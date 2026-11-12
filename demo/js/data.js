/* =========================================================
   AtuendoDB - Datos de prueba
   Mismos documentos que las 5 colecciones en MongoDB.
   ========================================================= */

const SEED_DATA = Object.freeze({
  closet_usuario: [
    { _id: 101, id_usuario: 1, id_prenda: 1, fecha_agregado: "2026-10-01T10:30:00Z" },
    { _id: 102, id_usuario: 1, id_prenda: 2, fecha_agregado: "2026-10-02T11:15:00Z" },
    { _id: 103, id_usuario: 1, id_prenda: 4, fecha_agregado: "2026-10-05T09:00:00Z" },
    { _id: 104, id_usuario: 2, id_prenda: 1, fecha_agregado: "2026-10-03T14:20:00Z" },
    { _id: 105, id_usuario: 2, id_prenda: 5, fecha_agregado: "2026-10-04T16:40:00Z" },
    { _id: 106, id_usuario: 3, id_prenda: 3, fecha_agregado: "2026-10-06T08:10:00Z" },
    { _id: 107, id_usuario: 3, id_prenda: 6, fecha_agregado: "2026-10-06T08:15:00Z" }
  ],

  equivalencias_prendas: [
    { _id: 201, id_prenda: 1, id_prenda_equivalente: 7, porcentaje_similitud: 90 },
    { _id: 202, id_prenda: 2, id_prenda_equivalente: 8, porcentaje_similitud: 85 },
    { _id: 203, id_prenda: 3, id_prenda_equivalente: 9, porcentaje_similitud: 80 },
    { _id: 204, id_prenda: 4, id_prenda_equivalente: 10, porcentaje_similitud: 95 },
    { _id: 205, id_prenda: 6, id_prenda_equivalente: 11, porcentaje_similitud: 90 }
  ],

  historial_sugerencias: [
    { _id: 301, id_usuario: 1, id_outfit: 501, fecha_sugerencia: "2026-10-07T08:00:00Z", aceptada: true },
    { _id: 302, id_usuario: 1, id_outfit: 502, fecha_sugerencia: "2026-10-08T09:30:00Z", aceptada: false },
    { _id: 303, id_usuario: 2, id_outfit: 503, fecha_sugerencia: "2026-10-09T10:15:00Z", aceptada: true },
    { _id: 304, id_usuario: 2, id_outfit: 504, fecha_sugerencia: "2026-10-10T14:00:00Z", aceptada: false },
    { _id: 305, id_usuario: 3, id_outfit: 505, fecha_sugerencia: "2026-10-10T16:45:00Z", aceptada: true }
  ],

  coincidencia_outfit: [
    { _id: 401, id_usuario: 1, id_outfit: 501, porcentaje: 100.0, fecha_calculo: "2026-10-06T07:30:00Z" },
    { _id: 402, id_usuario: 1, id_outfit: 502, porcentaje: 75.5, fecha_calculo: "2026-10-07T08:00:00Z" },
    { _id: 403, id_usuario: 2, id_outfit: 503, porcentaje: 100.0, fecha_calculo: "2026-10-08T09:00:00Z" },
    { _id: 404, id_usuario: 2, id_outfit: 504, porcentaje: 50.0, fecha_calculo: "2026-10-09T10:00:00Z" },
    { _id: 405, id_usuario: 3, id_outfit: 505, porcentaje: 88.3, fecha_calculo: "2026-10-10T12:30:00Z" }
  ],

  prendas_faltantes: [
    { _id: 601, id_usuario: 1, id_outfit: 502, id_prenda: 3 },
    { _id: 602, id_usuario: 2, id_outfit: 504, id_prenda: 2 },
    { _id: 603, id_usuario: 2, id_outfit: 504, id_prenda: 6 },
    { _id: 604, id_usuario: 3, id_outfit: 505, id_prenda: 1 }
  ]
});
