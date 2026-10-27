// Solo administración. Los datos se consultan mediante una función autenticada;
// no se descarga la colección desde el navegador ni se contacta a empresas.
export function crearProspectos({S,esc,draw,toast,fallo,call}){
 const M={lista:[],cargada:false,cargando:false,buscando:false,error:'',resumen:'',detalle:'',peticion:0,guardando:false};
 const estados={nuevo:'Nuevo',contactado:'Contactado',interesado:'Interesado',descartado:'Descartado',no_contactar:'No contactar'};
 const campo=(k,n,t='text')=>`<div class="field"><label for="${k}">${n}</label><input id="${k}" data-k="${k}" type="${t}" value="${esc(S.f[k]??'')}"></div>`;
 const enlace=(u,n)=>u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`:'';
 function reiniciar(){M.peticion++;Object.assign(M,{lista:[],cargada:false,cargando:false,buscando:false,error:'',resumen:'',detalle:'',guardando:false});S.prospectoForm=false;}
 async function cargar(){if(!S.admin)return;const n=++M.peticion;M.cargando=true;M.error='';
   try{const r=await call({accion:'listar'});if(n===M.peticion&&S.admin){M.lista=(r.data??r).prospectos||[];M.cargada=true;}}
   catch(e){if(n===M.peticion){M.error='No se pudo cargar Prospectos. Pulse Actualizar.';M.cargada=true;}throw e;}
   finally{if(n===M.peticion){M.cargando=false;draw();}}
 }
 function abrir(p){S.prospectoForm=true;M.detalle='';S.prospectoEdit=p||null;
   Object.assign(S.f,{pp_nombre:p?.nombre||'',pp_ciudad:p?.ciudad||'San Pedro Sula',pp_rubro:p?.rubro||'',pp_web:p?.web||'',pp_correo:p?.correo?.valor||'',pp_correoFuente:p?.correo?.fuente||'',pp_whatsapp:p?.whatsapp?.valor||'',pp_whatsappFuente:p?.whatsapp?.fuente||'',pp_fuente:p?.fuentes?.[0]?.url||'',pp_interes:p?.interes||'',pp_nota:p?.nota||''});draw();
 }
 function formulario(){return `<section class="panel"><h2>${S.prospectoEdit?'Revisar prospecto':'Agregar prospecto'}</h2><p class="note">Use datos comerciales publicados. El interés es una estimación; no significa que la empresa haya solicitado una cotización.</p>
   <div class="row">${campo('pp_nombre','Empresa')}${campo('pp_ciudad','Ciudad')}${campo('pp_rubro','Rubro')}</div>
   <div class="row">${campo('pp_web','Web oficial','url')}${campo('pp_fuente','Fuente pública principal','url')}</div>
   <div class="row">${campo('pp_correo','Correo comercial o de compras','email')}${campo('pp_correoFuente','Fuente del correo','url')}</div>
   <div class="row">${campo('pp_whatsapp','WhatsApp empresarial publicado','tel')}${campo('pp_whatsappFuente','Fuente que identifica ese WhatsApp','url')}</div>
   ${campo('pp_interes','Posible producto o uso')}${campo('pp_nota','Nota de seguimiento')}
   <div class="actions"><button class="btn pri" data-a="ppGuardar" ${M.guardando?'disabled':''}>${M.guardando?'Guardando…':'Guardar revisión'}</button><button class="btn" data-a="ppCancelar" ${M.guardando?'disabled':''}>Cancelar</button></div></section>`;}
 function vista(){
   if(!S.admin)return '<p class="msg">Prospectos es exclusivo del administrador.</p>';
   if(!M.cargada&&!M.cargando)cargar().catch(()=>{});
   const q=String(S.f.pp_buscar||'').toLowerCase(),estado=S.f.pp_filtro||'todos';
   const lista=M.lista.filter(p=>(estado==='todos'||p.estado===estado)&&(!q||[p.nombre,p.ciudad,p.rubro,p.correo?.valor,p.whatsapp?.valor].join(' ').toLowerCase().includes(q)));
   const pendientes=M.lista.filter(p=>p.estado==='nuevo').length,contactables=M.lista.filter(p=>p.correo||p.whatsapp).length;
   return `<h1>Prospectos</h1><p class="sub">Solo usted. Empresas por revisar, con fuentes y contactos comerciales públicos. No se envían mensajes automáticamente.</p>
   <div class="actions"><button class="btn" data-a="ppActualizar" ${M.cargando||M.buscando?'disabled':''}>Actualizar</button><button class="btn" data-a="ppNuevo" ${M.buscando?'disabled':''}>Agregar empresa</button><span>${pendientes} nuevos · ${contactables} con correo o WhatsApp</span></div>
   <section class="panel"><h2>Buscar empresas</h2><div class="row"><div class="field"><label for="pp_zona">Zona</label><select id="pp_zona" data-k="pp_zona">${['San Pedro Sula','Tegucigalpa','Todo Honduras'].map(x=>`<option ${x===(S.f.pp_zona||'San Pedro Sula')?'selected':''}>${x}</option>`).join('')}</select></div>
   <div class="field"><label for="pp_sector">Sector</label><select id="pp_sector" data-k="pp_sector">${['Comercios y distribuidores','Farmacias y supermercados','Restaurantes y hoteles','Bodegas y logística','Comercio electrónico'].map(x=>`<option ${x===(S.f.pp_sector||'Comercios y distribuidores')?'selected':''}>${x}</option>`).join('')}</select></div>
   <div class="field"><label for="pp_enfoque">Productos</label><select id="pp_enfoque" data-k="pp_enfoque">${['Rollos térmicos y film estirable','Rollos térmicos','Film estirable','Etiquetas'].map(x=>`<option ${x===(S.f.pp_enfoque||'Rollos térmicos y film estirable')?'selected':''}>${x}</option>`).join('')}</select></div></div>
   <button class="btn pri" data-a="ppBuscar" ${M.buscando||M.guardando?'disabled':''}>${M.buscando?'Investigando empresas…':'Buscar hasta 5 empresas'}</button><p class="note">Usa Sonnet y búsqueda web. Máximo cinco búsquedas al día; no es un envío de publicidad. El sistema descarta coincidencias con sus clientes y prospectos existentes. Los resultados quedan por revisar.</p></section>
   ${M.resumen?`<p class="msg">${esc(M.resumen)}</p>`:''}${M.error?`<p class="msg">${esc(M.error)}</p>`:''}${S.prospectoForm?formulario():''}
   <div class="actions"><input data-k="pp_buscar" aria-label="Buscar prospectos guardados" placeholder="Empresa, ciudad o contacto" value="${esc(S.f.pp_buscar||'')}"><select data-k="pp_filtro" aria-label="Estado">${[['todos','Todos'],...Object.entries(estados)].map(([k,n])=>`<option value="${k}" ${k===estado?'selected':''}>${n}</option>`).join('')}</select><button class="btn" data-a="ppFiltrar">Filtrar</button></div>
   ${M.cargando?'<p class="note">Cargando prospectos…</p>':''}
   <div class="panel"><div class="scroll">${lista.length?`<table><thead><tr><th>Empresa</th><th>Contactos publicados</th><th>Prioridad / estado</th><th>Revisión</th></tr></thead><tbody>${lista.map(p=>`<tr><td><b>${esc(p.nombre)}</b><br>${esc(p.ciudad)} · ${esc(p.rubro||'')}<br><small>${esc(p.interes||'Posible uso por confirmar')}</small>${p.clienteExistente?`<br><span class="badge b-warn">Ya figura en Clientes</span>`:''}</td><td>${p.correo?`${enlace('mailto:'+p.correo.valor,p.correo.valor)}<br><small>${enlace(p.correo.fuente,'Fuente del correo')}</small><br>`:''}${p.whatsapp?`${enlace('https://wa.me/'+p.whatsapp.valor,'WhatsApp '+p.whatsapp.valor)}<br><small>${enlace(p.whatsapp.fuente,'Fuente de WhatsApp')}</small>`:''}${!p.correo&&!p.whatsapp?'<small>Contacto pendiente de localizar</small>':''}</td><td>${esc(p.prioridad||'baja')}<br><select data-ppestado="${esc(p.id)}" aria-label="Estado de ${esc(p.nombre)}" ${M.guardando?'disabled':''}>${Object.entries(estados).map(([k,n])=>`<option value="${k}" ${k===p.estado?'selected':''}>${n}</option>`).join('')}</select></td><td><span class="badge ${p.revisado?'b-ok':'b-warn'}">${p.revisado?'Revisado':'Por revisar'}</span><br><small>${p.ultimaRevision?new Date(p.ultimaRevision).toLocaleDateString('es-HN',{timeZone:'America/Tegucigalpa'}):''}</small><br><button class="btn sm" data-a="ppEditar" data-v="${esc(p.id)}">Abrir ficha</button><br>${(p.fuentes||[]).map(f=>enlace(f.url,f.titulo||'Fuente')).join('<br>')}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">No hay prospectos en este filtro. Puede buscar empresas o agregar una ficha con su fuente.</p>'}</div></div><p class="note">Se muestran los 200 prospectos más recientes. Un contacto publicado no confirma interés de compra ni autoriza envíos automáticos.</p>`;
 }
 const acciones={
   ppActualizar(){cargar().catch(e=>fallo(e,'cargar prospectos'));},ppFiltrar(){draw();},ppNuevo(){abrir(null);},ppEditar(id){const p=M.lista.find(x=>x.id===id);if(p)abrir(p);},ppCancelar(){S.prospectoForm=false;S.prospectoEdit=null;draw();},
   async ppBuscar(){if(!S.admin||M.buscando)return;M.buscando=true;M.error='';M.resumen='';const n=M.peticion;draw();
     try{const r=await call({accion:'buscar',operacion:crypto.randomUUID(),ciudad:S.f.pp_zona||'San Pedro Sula',rubro:S.f.pp_sector||'Comercios y distribuidores',enfoque:S.f.pp_enfoque||'Rollos térmicos y film estirable'});if(n!==M.peticion||!S.admin)return;const x=r.data??r;M.resumen=`${x.nuevos||0} nuevos · ${x.repetidos||0} ya estaban guardados · ${x.clientesExistentes||0} ya eran clientes. ${x.omitidos?'Se omitieron '+x.omitidos+' resultados sin fuentes suficientes.':''}`;await cargar();}
     catch(e){if(n===M.peticion){M.error=String(e.message||'No se pudo completar la búsqueda. Actualice la lista e intente más tarde.');fallo(e,'buscar prospectos');}}
     finally{if(S.admin){M.buscando=false;draw();}}
   },
   async ppGuardar(){if(!S.admin||M.guardando)return;M.guardando=true;draw();try{const p=S.prospectoEdit;const r=await call({accion:'guardar',...(p?{id:p.id,revision:p.revision}:{}),prospecto:{nombre:S.f.pp_nombre,ciudad:S.f.pp_ciudad,rubro:S.f.pp_rubro,web:S.f.pp_web,correo:{valor:S.f.pp_correo,fuente:S.f.pp_correoFuente},whatsapp:{valor:S.f.pp_whatsapp,fuente:S.f.pp_whatsappFuente},fuentes:[S.f.pp_fuente,S.f.pp_web,S.f.pp_correoFuente,S.f.pp_whatsappFuente].filter(Boolean),interes:S.f.pp_interes,nota:S.f.pp_nota}});const x=r.data??r;if(x.repetidos||x.clientesExistentes){toast('La empresa ya está registrada como prospecto o cliente.');}else{S.prospectoForm=false;S.prospectoEdit=null;toast('Prospecto guardado.');}await cargar();}catch(e){fallo(e,'guardar prospecto');}finally{M.guardando=false;draw();}},
   async ppEstado(id,estado){if(!S.admin||M.guardando)return;const p=M.lista.find(x=>x.id===id);if(!p)return;M.guardando=true;draw();try{await call({accion:'estado',id,estado,revision:p.revision});await cargar();}catch(e){fallo(e,'actualizar prospecto');await cargar().catch(()=>{});}finally{M.guardando=false;draw();}}
 };
 return {vista,acciones,reiniciar};
}
