/* =========================================================
   AtuendoDB - Demo del módulo de sugerencias
   Lógica de la interfaz.
   Depende de SEED_DATA (js/data.js).
   ========================================================= */

/* ---------- 1. Constantes ---------- */
const USERS = [1, 2, 3];
const FIRST_NEW_ID = 108;

/* ---------- 2. Estado ---------- */
const state = {
  db: structuredClone(SEED_DATA),
  userId: 1,
  selectedOutfitId: null,
  nextId: FIRST_NEW_ID,
  newDocIds: new Set()
};

/* ---------- 3. Referencias al DOM ---------- */
const dom = {
  users: document.getElementById("users"),
  closet: document.getElementById("closet"),
  log: document.getElementById("log"),
  outfits: document.getElementById("outfits"),
  detail: document.getElementById("detail"),
  history: document.getElementById("history"),
  reset: document.getElementById("reset"),
  queryCloset: document.getElementById("query-closet"),
  queryOutfits: document.getElementById("query-outfits"),
  queryHistory: document.getElementById("query-history")
};

/* ---------- 4. Utilidades ---------- */
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

const formatPercent = (value) => (Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`);

const byDateDesc = (field) => (a, b) => b[field].localeCompare(a[field]);

function getLevel(percent) {
  if (percent >= 100) return "full";
  if (percent >= 75) return "part";
  return "low";
}

/* ---------- 5. Consultas (equivalen a las de mongosh) ---------- */
function findCloset(userId) {
  return state.db.closet_usuario
    .filter((doc) => doc.id_usuario === userId)
    .sort(byDateDesc("fecha_agregado"));
}

function userOwnsPrenda(userId, prendaId) {
  return state.db.closet_usuario.some(
    (doc) => doc.id_usuario === userId && doc.id_prenda === prendaId
  );
}

function findCoincidencias(userId) {
  return state.db.coincidencia_outfit
    .filter((doc) => doc.id_usuario === userId)
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

function findFaltantes(userId, outfitId) {
  return state.db.prendas_faltantes.filter(
    (doc) => doc.id_usuario === userId && doc.id_outfit === outfitId
  );
}

function findEquivalencia(prendaId) {
  return state.db.equivalencias_prendas.find((doc) => doc.id_prenda === prendaId);
}

function findHistorial(userId) {
  return state.db.historial_sugerencias
    .filter((doc) => doc.id_usuario === userId)
    .sort(byDateDesc("fecha_sugerencia"));
}

/* Simula insertOne respetando el índice único (id_usuario + id_prenda) */
function insertIntoCloset(userId, prendaId) {
  if (userOwnsPrenda(userId, prendaId)) {
    return {
      ok: false,
      message: `E11000 duplicate key: el índice idx_usuario_prenda_unique no permite repetir la prenda ${prendaId} para el usuario ${userId}.`
    };
  }

  const doc = {
    _id: state.nextId++,
    id_usuario: userId,
    id_prenda: prendaId,
    fecha_agregado: new Date().toISOString()
  };

  state.db.closet_usuario.push(doc);
  state.newDocIds.add(doc._id);

  return {
    ok: true,
    message: `insertOne({ _id: ${doc._id}, id_usuario: ${userId}, id_prenda: ${prendaId} }) ejecutado.`
  };
}

/* ---------- 6. Textos de las consultas que se muestran ---------- */
const queries = {
  closet: (userId) =>
`db.closet_usuario.find({ id_usuario: ${userId} })
  .sort({ fecha_agregado: -1 })`,

  outfits: (userId, outfitId) =>
`// Outfits del usuario ordenados por porcentaje
db.coincidencia_outfit.find({ id_usuario: ${userId} })
  .sort({ porcentaje: -1 })

// Qué le falta y si ya tiene un sustituto en su closet
db.prendas_faltantes.aggregate([
  { $match: { id_usuario: ${userId}, id_outfit: ${outfitId ?? "ID_OUTFIT"} } },
  { $lookup: { from: "equivalencias_prendas",
      localField: "id_prenda", foreignField: "id_prenda",
      as: "equivalencias" } },
  { $unwind: "$equivalencias" },
  { $lookup: { from: "closet_usuario",
      let: { u: "$id_usuario", eq: "$equivalencias.id_prenda_equivalente" },
      pipeline: [ { $match: { $expr: { $and: [
        { $eq: ["$id_usuario", "$$u"] },
        { $eq: ["$id_prenda", "$$eq"] } ] } } } ],
      as: "sustituto_poseido" } }
])`,

  history: (userId) =>
`db.historial_sugerencias.find({ id_usuario: ${userId} })
  .sort({ fecha_sugerencia: -1 })`
};

/* ---------- 7. Plantillas HTML ---------- */
function userButtonTemplate(userId) {
  const pressed = userId === state.userId;
  return `<button class="user-switch__btn" aria-pressed="${pressed}" data-user="${userId}">Usuario ${userId}</button>`;
}

function hangerTemplate(doc) {
  const isNew = state.newDocIds.has(doc._id) ? " hanger--new" : "";
  return `
    <div class="hanger${isNew}">
      <span class="hanger__name">Prenda ${doc.id_prenda}</span>
      <span class="hanger__date">${formatDate(doc.fecha_agregado)}</span>
    </div>`;
}

function outfitTemplate(doc) {
  const level = getLevel(doc.porcentaje);
  const pressed = doc.id_outfit === state.selectedOutfitId;
  const stateText = level === "full" ? "Lo puede armar completo" : "Le faltan prendas";

  return `
    <button class="outfit level--${level}" aria-pressed="${pressed}" data-outfit="${doc.id_outfit}">
      <span class="tag">${formatPercent(doc.porcentaje)}</span>
      <span>
        <strong>Outfit ${doc.id_outfit}</strong><br>
        <span class="outfit__state">${stateText}</span>
        <span class="progress"><span class="progress__fill" style="width: ${doc.porcentaje}%"></span></span>
      </span>
      <span class="outfit__date">Calculado ${formatDate(doc.fecha_calculo)}</span>
    </button>`;
}

function substituteTemplate(equivalencia) {
  if (!equivalencia) {
    return `<span class="pill pill--miss">Sin equivalencia registrada</span>`;
  }

  const { id_prenda_equivalente: sustituta, porcentaje_similitud: similitud } = equivalencia;

  if (userOwnsPrenda(state.userId, sustituta)) {
    return `<span class="pill pill--ok">Puede usar la prenda ${sustituta} que ya tiene (${similitud}% similar)</span>`;
  }

  return `
    <span class="pill pill--warn">Sustituto: prenda ${sustituta} (${similitud}% similar), pero no la tiene</span>
    <div><button class="btn" data-add="${sustituta}">Agregar prenda ${sustituta} al closet</button></div>`;
}

function missingTemplate(faltante) {
  const equivalencia = findEquivalencia(faltante.id_prenda);
  return `
    <div class="missing">
      <div class="missing__head">
        <strong>Prenda ${faltante.id_prenda}</strong>
        <span class="pill pill--miss">Falta</span>
      </div>
      ${substituteTemplate(equivalencia)}
    </div>`;
}

function historyRowTemplate(doc) {
  const pill = doc.aceptada
    ? `<span class="pill pill--ok">Aceptada</span>`
    : `<span class="pill pill--miss">No aceptada</span>`;
  return `<tr><td>Outfit ${doc.id_outfit}</td><td>${formatDate(doc.fecha_sugerencia)}</td><td>${pill}</td></tr>`;
}

/* ---------- 8. Render ---------- */
function renderUsers() {
  dom.users.innerHTML = USERS.map(userButtonTemplate).join("");
}

function renderCloset() {
  const items = findCloset(state.userId);
  dom.closet.innerHTML = items.length
    ? items.map(hangerTemplate).join("")
    : `<p class="empty">Este usuario aún no tiene prendas.</p>`;
  dom.queryCloset.textContent = queries.closet(state.userId);
}

function renderOutfits() {
  const list = findCoincidencias(state.userId);
  const stillExists = list.some((doc) => doc.id_outfit === state.selectedOutfitId);
  if (!stillExists) state.selectedOutfitId = list[0]?.id_outfit ?? null;

  dom.outfits.innerHTML = list.map(outfitTemplate).join("");
  dom.queryOutfits.textContent = queries.outfits(state.userId, state.selectedOutfitId);
  renderDetail();
}

function renderDetail() {
  const outfitId = state.selectedOutfitId;
  if (outfitId === null) {
    dom.detail.innerHTML = "";
    return;
  }

  const faltantes = findFaltantes(state.userId, outfitId);
  if (!faltantes.length) {
    dom.detail.innerHTML = `
      <h3 class="card__title">Outfit ${outfitId}</h3>
      <p class="card__hint">No hay registros en prendas_faltantes: tiene todas las prendas.</p>`;
    return;
  }

  dom.detail.innerHTML =
    `<h3 class="card__title">Le falta para el outfit ${outfitId}</h3>` +
    faltantes.map(missingTemplate).join("");
}

function renderHistory() {
  dom.history.innerHTML = findHistorial(state.userId).map(historyRowTemplate).join("");
  dom.queryHistory.textContent = queries.history(state.userId);
}

function renderAll() {
  renderUsers();
  renderCloset();
  renderOutfits();
  renderHistory();
}

function showLog(result) {
  dom.log.className = `log ${result.ok ? "log--success" : "log--error"}`;
  dom.log.textContent = result.message;
}

function clearLog() {
  dom.log.className = "log";
  dom.log.textContent = "";
}

/* ---------- 9. Eventos ---------- */
function handleUserClick(event) {
  const button = event.target.closest("[data-user]");
  if (!button) return;
  state.userId = Number(button.dataset.user);
  state.selectedOutfitId = null;
  clearLog();
  renderAll();
}

function handleOutfitClick(event) {
  const button = event.target.closest("[data-outfit]");
  if (!button) return;
  state.selectedOutfitId = Number(button.dataset.outfit);
  renderOutfits();
}

function handleAddClick(event) {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  const result = insertIntoCloset(state.userId, Number(button.dataset.add));
  showLog(result);
  if (result.ok) renderAll();
}

function handleReset() {
  state.db = structuredClone(SEED_DATA);
  state.nextId = FIRST_NEW_ID;
  state.newDocIds.clear();
  state.selectedOutfitId = null;
  clearLog();
  renderAll();
}

/* ---------- 10. Inicio ---------- */
function init() {
  dom.users.addEventListener("click", handleUserClick);
  dom.outfits.addEventListener("click", handleOutfitClick);
  dom.detail.addEventListener("click", handleAddClick);
  dom.reset.addEventListener("click", handleReset);
  renderAll();
}

init();
