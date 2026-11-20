export const sumarDia=(f,n)=>new Date(Date.parse(f)+n*864e5).toISOString().slice(0,10);
export function lunesAgenda(f){const d=new Date(f+'T12:00:00Z');return sumarDia(f,-((d.getUTCDay()+6)%7));}
export function horaAgenda(h){
 const s=String(h||'').trim(),m=s.match(/^(\d{1,2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?$/i);if(!m)return '';
 let n=Number(m[1]);if(m[3])n=n%12+(/^p/i.test(m[3])?12:0);
 return n<24&&Number(m[2])<60?String(n).padStart(2,'0')+':'+m[2]:'';
}
const minutos=h=>{const s=horaAgenda(h);return s?Number(s.slice(0,2))*60+Number(s.slice(3)):null;};
export function coincidencias(evento,pendientes){
 const ini=minutos(evento.hora);if(ini==null)return [];
 return pendientes.filter(t=>{const a=minutos(t.hora);return t.id!==evento.id&&t.fecha===evento.fecha&&a!=null&&!(t.semana&&t.tipo==='entregas'&&evento.clase==='entrega')&&ini<a+Number(t.duracion||30)&&a<ini+Number(evento.duracion||30);});
}
export function crearAgenda(ctx){
 const {S,PZ,esc,fdate,today,draw,toast,call,cargar,oportunidades}=ctx;
 const fecha=()=>PZ.fecha||(PZ.fecha=today()<'2026-11-23'?'2026-11-23':today());
 const lista=()=>[...(PZ.data?.pendientes||[]).map(t=>({...t,hecha:false})),...(PZ.data?.hechas||PZ.data?.hechasHoy||[]).map(t=>({...t,hecha:true}))];
 const fechaTxt=f=>new Date(f+'T12:00:00Z').toLocaleDateString('es-HN',{weekday:'long',day:'numeric',month:'long',timeZone:'America/Guatemala'});
 const fin=t=>{const n=minutos(t.hora);if(n==null)return '';const h=n+Number(t.duracion||30);return h>=1440?'día siguiente':String(Math.floor(h/60)).padStart(2,'0')+':'+String(h%60).padStart(2,'0');};
 function tarjeta(t){
  const choques=!t.hecha?coincidencias(t,PZ.data?.pendientes||[]):[];
  return `<article class="ag-event ag-${esc(t.clase||'tarea')}${t.hecha?' ag-done':''}" draggable="${!t.hecha}" data-agenda-id="${esc(t.id)}">
   <div class="ag-event-top"><button class="pz-chk" data-a="${t.hecha?'pzDeshacer':'pzHecha'}" data-v="${esc(t.id)}" aria-label="${t.hecha?'Regresar a pendientes':'Marcar como hecha'}">${t.hecha?'✓':''}</button><b>${horaAgenda(t.hora)?esc(horaAgenda(t.hora)+'–'+fin(t)):'Hora por confirmar'}</b></div>
   <button class="ag-title" data-a="pzEditar" data-v="${esc(t.id)}">${esc(t.texto)}</button><small>${t.sugerencia&&!t.fija?'Sugerencia · se acomoda automáticamente':horaAgenda(t.hora)?'Horario fijo':'Pendiente de ubicar'}</small>
   ${t.cliente?`<small>${esc(t.cliente)}</small>`:''}${t.ubicacion?`<small>📍 ${esc(t.ubicacion)}</small>`:''}
   ${t.nota?`<p>${esc(t.nota)}</p>`:''}${choques.length?`<small class="ag-alert">Coincide con ${esc(choques[0].texto)}</small>`:''}
   <div class="actions"><button class="btn sm" data-a="pzEditar" data-v="${esc(t.id)}">Editar / mover</button>${t.refChat?`<button class="btn sm" data-a="asVerChat" data-v="${esc(t.refChat)}">Chat</button>`:''}${t.refCot?`<button class="btn sm" data-a="asVerCot" data-v="${esc(t.refCot)}">${esc(t.refCot)}</button>`:''}</div></article>`;
 }
 function dia(f,compacto=false){
  const todos=lista().filter(t=>t.fecha===f),hechas=todos.filter(t=>t.hecha).length;
  const orden=todos.slice().sort((a,b)=>(minutos(a.hora)??-1)-(minutos(b.hora)??-1));
  const grupo=(titulo,hora,items)=>`<section class="ag-slot" data-agenda-fecha="${f}" data-agenda-hora="${hora}"><h3>${titulo}<button class="btn sm" data-a="agNuevo" data-v="${f}|${hora}" aria-label="Agregar en ${esc(titulo)}">+</button></h3>${items.map(tarjeta).join('')||'<p class="ag-empty">Libre · puedes agregar o mover aquí</p>'}</section>`;
  return `<section class="ag-day" data-agenda-fecha="${f}"><header><button class="ag-day-title" data-a="agAbrirDia" data-v="${f}">${esc(fechaTxt(f))}</button><small>${hechas}/${todos.length} completados</small></header>
   ${compacto?orden.map(tarjeta).join('')||'<p class="ag-empty">Sin compromisos</p>':
   grupo('Sin hora confirmada','',orden.filter(t=>minutos(t.hora)==null))+
   grupo('Mañana · leads y clientes','09:00',orden.filter(t=>minutos(t.hora)!=null&&minutos(t.hora)<780))+
   grupo('1–3 p. m. · entregas','13:00',orden.filter(t=>minutos(t.hora)>=780&&minutos(t.hora)<900))+
   grupo('4–5 p. m. · últimos contactos','16:00',orden.filter(t=>minutos(t.hora)>=960&&minutos(t.hora)<1020))+
   grupo('Otros horarios / espacio flexible','15:00',orden.filter(t=>minutos(t.hora)!=null&&(minutos(t.hora)>=900&&minutos(t.hora)<960||minutos(t.hora)>=1020)))}
   ${compacto?`<button class="btn sm" data-a="agNuevo" data-v="${f}|">+ Cita o tarea</button>`:''}</section>`;
 }
 function vista(){
  if(!S.admin)return '<p class="empty">La agenda es privada del administrador.</p>';
  if(!PZ.data&&!PZ.cargando)cargar();
  const f=fecha(),lunes=lunesAgenda(f),semana=PZ.vistaAgenda==='semana';
  const dias=Array.from({length:6},(_,n)=>sumarDia(lunes,n));
  const atrasadas=(PZ.data?.pendientes||[]).filter(t=>t.fecha<today());
  return `<div class="ag-toolbar"><div><h1>Mi agenda</h1><p class="sub">Solo para ti · Eduardo Maradiaga</p></div><div class="actions"><button class="btn" data-a="agHoy">Hoy</button><button class="btn" data-a="agNav" data-v="-1" aria-label="Anterior">←</button><input aria-label="Fecha de agenda" type="date" id="ag_fecha" value="${f}"><button class="btn" data-a="agNav" data-v="1" aria-label="Siguiente">→</button><button class="btn ${semana?'':'pri'}" data-a="agVista" data-v="dia">Día</button><button class="btn ${semana?'pri':''}" data-a="agVista" data-v="semana">Semana</button><button class="btn pri" data-a="agNuevo" data-v="${f}|">+ Cita, visita o tarea</button><button class="btn" data-a="pzRecargar" ${PZ.cargando?'disabled':''}>Actualizar</button></div></div>
   <p class="note">Mañanas: leads y búsqueda de clientes. Entregas: 1 a 3 p. m. Últimos contactos: 4 a 5 p. m. Al agregar horas a tus citas, las sugerencias se acomodan en los espacios libres o pasan a otro día. Una entrega grande o importante puede ir por la mañana.</p>
   <div class="actions"><button class="btn" data-a="agPreparar" ${PZ.preparando?'disabled':''}>${PZ.preparando?'Preparando…':'Cargar plan comercial de esta semana'}</button><button class="btn" data-a="agReacomodar" ${PZ.preparando?'disabled':''}>Reacomodar sugerencias</button><small class="muted">${esc(fdate(lunes))}–${esc(fdate(sumarDia(lunes,5)))} · conserva tus citas fijas</small></div>
   ${!PZ.data?'<p class="empty">Cargando agenda…</p>':PZ.data.error?`<p class="empty">${esc(PZ.data.error)}</p>`:
   `<div class="${semana?'ag-week':'ag-single'}">${semana?dias.map(d=>dia(d,true)).join(''):dia(f)}</div>
   ${atrasadas.length?`<details class="panel"><summary>Pendientes anteriores (${atrasadas.length})</summary>${atrasadas.map(tarjeta).join('')}</details>`:''}
   <details class="panel ag-opciones"><summary>Oportunidades, recompras y cobros para agendar</summary>${oportunidades()}</details>`}`;
 }
 const acciones={
  agHoy(){PZ.fecha=today();draw();},
  agNav(n){PZ.fecha=sumarDia(fecha(),Number(n)*(PZ.vistaAgenda==='semana'?7:1));draw();},
  agVista(v){PZ.vistaAgenda=v;draw();},
  agAbrirDia(f){PZ.fecha=f;PZ.vistaAgenda='dia';draw();},
  agNuevo(v){if(!S.admin)return;const [f,h]=String(v||'').split('|');Object.keys(S.f).filter(k=>k.startsWith('tz_')).forEach(k=>delete S.f[k]);S.m={type:'tarea',pre:{fecha:f||fecha(),hora:h||'',duracion:30,clase:'tarea',tipo:'seguimiento'}};draw();},
  async agPreparar(){if(!S.admin||PZ.preparando)return;PZ.preparando=true;draw();try{const r=await call({accion:'agendaPreparar',semana:lunesAgenda(fecha())});await cargar();toast(r.data?.creadas?'Plan semanal agregado':'Esta semana ya está preparada; se conservaron tus cambios');}catch(e){toast(e.message||'No se pudo preparar la semana.');}finally{PZ.preparando=false;draw();}},
  async agReacomodar(){if(!S.admin||PZ.preparando)return;PZ.preparando=true;draw();try{const r=await call({accion:'agendaReacomodar'});await cargar();toast(r.data?.movidas?'Sugerencias reacomodadas':'Las sugerencias ya están en espacios disponibles');}catch(e){toast(e.message||'No se pudo reacomodar.');}finally{PZ.preparando=false;draw();}},
 };
 async function mover(id,f,h){
  const t=PZ.data?.pendientes?.find(x=>x.id===id);if(!S.admin||!t||PZ.moviendo)return;
  const hora=h===undefined?horaAgenda(t.hora):h,choques=coincidencias({...t,fecha:f,hora},PZ.data.pendientes).filter(t=>!t.sugerencia||t.fija);
  if(choques.length&&!confirm('Coincide con «'+choques[0].texto+'». ¿Mover de todas formas?'))return;
  PZ.moviendo=true;try{await call({accion:'agendaMover',id,fecha:f,hora,version:t.actualizado||0});await cargar();toast('Compromiso movido');}catch(e){toast(e.message||'No se pudo mover.');}finally{PZ.moviendo=false;draw();}
 }
 if(typeof document!=='undefined'){
  document.addEventListener('change',e=>{if(e.target.id==='ag_fecha'&&/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){PZ.fecha=e.target.value;draw();}});
  document.addEventListener('dragstart',e=>{const card=e.target.closest?.('[data-agenda-id]');if(card&&card.draggable){e.dataTransfer.setData('text/plain',card.dataset.agendaId);e.dataTransfer.effectAllowed='move';}});
  document.addEventListener('dragover',e=>{if(e.target.closest?.('[data-agenda-fecha]'))e.preventDefault();});
  document.addEventListener('drop',e=>{const target=e.target.closest?.('[data-agenda-fecha]');if(!target)return;e.preventDefault();mover(e.dataTransfer.getData('text/plain'),target.dataset.agendaFecha,target.dataset.agendaHora);});
 }
 return {vista,acciones,mover};
}
