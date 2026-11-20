// Reutiliza los datos del panel. No envía mensajes ni consulta un modelo.
export function organizarPizarra({data, clientes, statsCliente, hoy}) {
  const tareas = (data.pendientes || []).slice().sort((a,b) =>
    String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora || '').localeCompare(String(b.hora || '')));
  const hoyTareas = tareas.filter(t => !t.fecha || t.fecha <= hoy);
  const futuras = tareas.filter(t => t.fecha > hoy);
  const ocupadas = new Set(tareas.map(t => t.refCot).filter(Boolean));
  const hechas = new Set((data.hechasHoy || []).map(t => t.refCot).filter(Boolean));
  const recompras = clientes.map(c => ({c, st:statsCliente(c)}))
    .filter(({c,st}) => (!data.cuentas || data.cuentas.includes(c.asignado || st.ultCot?.vendedor))
      && st.ultCot && st.falta != null && st.falta <= 7 && !st.manual?.omitido
      && !ocupadas.has(st.ultCot.numero || st.ultCot.id) && !hechas.has(st.ultCot.numero || st.ultCot.id))
    .sort((a,b) => a.st.falta-b.st.falta || String(a.c.nombre).localeCompare(String(b.c.nombre)));
  return {hoyTareas, futuras, recompras};
}
