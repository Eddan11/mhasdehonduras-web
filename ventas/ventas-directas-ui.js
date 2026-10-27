// Registro comercial separado; no sustituye un comprobante fiscal ni declara exenciones.
export function calcularDocumento(c,calc){const x=calc(c.items,c.flete);return c.sinComprobante?{...x,sinComprobante:true,isv:null,total:Math.round((x.base+x.flete)*100)/100}:x;}
export function pdfInterno(c,jsPDF,calc){
 const d=new jsPDF(),L=n=>'L '+Number(n||0).toFixed(2),x=calcularDocumento(c,calc);let y=20;
 const texto=(s,size=10)=>{d.setFontSize(size);const lines=d.splitTextToSize(String(s),175);if(y+lines.length*5>275){d.addPage();y=20;}d.text(lines,18,y);y+=lines.length*5+3;};
 texto('COTIZACIÓN',16);texto('MHAS de Honduras');texto(c.numero||'');texto(c.cliente?.nombre||'Consumidor final');
 (c.items||[]).forEach((i,n)=>{const f=Math.max(1,Number(i.vu?.f)||1);texto(i.nombre);texto(`${Number(i.cant)/f} ${i.vu?.n||i.unidad||'unidades'} x ${L(x.lines[n].un*f)} · Importe ${L(x.lines[n].imp)}`);});
 if(x.flete)texto('Flete: '+L(x.flete));texto('TOTAL: '+L(x.total),14);return d;
}
export function crearVentasDirectas({S,esc,L,today,draw,toast,fallo,call,esFact}){
 const M={guardando:false},puedeCerrar=()=>typeof esFact==='function'?esFact():S.admin===true||S.me?.rol==='facturador';
 const casilla=(k,t)=>`<label style="display:flex;gap:7px;align-items:center;margin:10px 0;font-weight:500"><input type="checkbox" style="width:16px;height:16px;min-height:16px;margin:0;flex:0 0 16px" data-k="${k}" ${S.f[k]===true?'checked':''}>${t}</label>`;
 function formulario(c){return `<h2>Cerrar cotización sin factura</h2><p>${esc(c.numero)} · ${esc(c.cliente?.nombre||'')} · <b>${L(c.total)}</b></p><div class="row"><div class="field"><label for="vd_fecha">Fecha de venta</label><input id="vd_fecha" data-k="vd_fecha" type="date" value="${esc(S.f.vd_fecha||today())}"></div><div class="field"><label for="vd_metodo">Forma de pago</label><select id="vd_metodo" data-k="vd_metodo">${['Transferencia','Efectivo','Contra entrega','Cheque','Tarjeta','Link de pago','Crédito'].map(x=>`<option ${x===(S.f.vd_metodo||c.formaPago||'Transferencia')?'selected':''}>${x}</option>`).join('')}</select></div></div>${casilla('vd_pagado','Ya recibí el pago completo')}${casilla('vd_incluida','Esta salida ya estaba incluida en el último conteo físico')}<div class="actions"><button class="btn pri" data-a="vdGuardar" ${M.guardando?'disabled':''}>${M.guardando?'Cerrando…':'Cerrar cotización'}</button><button class="btn" data-a="modeVer" ${M.guardando?'disabled':''}>Cancelar</button></div>`;}
 const acciones={
  vdAbrir(){if(!puedeCerrar())return toast('Administración o facturación debe cerrar esta venta.');if(!S.m)return;['vd_pagado','vd_fecha','vd_metodo','vd_incluida'].forEach(k=>delete S.f[k]);S.m.mode='ventaDirecta';draw();},
  async vdGuardar(){if(!puedeCerrar())return toast('No tiene permiso para cerrar esta venta.');if(M.guardando)return;const c=S.cot.find(x=>x.id===S.m?.id);if(!c)return toast('Actualice la lista y abra la cotización.');const modal=S.m;M.guardando=true;S.busy=true;draw();
   try{await call({id:c.id,fecha:S.f.vd_fecha||today(),metodo:S.f.vd_metodo||c.formaPago||'Transferencia',pagado:S.f.vd_pagado===true,incluidaEnConteo:S.f.vd_incluida===true,confirmado:true});if(S.m===modal)S.m.mode='ver';['vd_pagado','vd_fecha','vd_metodo','vd_incluida'].forEach(k=>delete S.f[k]);S.filtro='fin';toast('Cotización finalizada sin factura.');}
   catch(e){if(e.message)toast(e.message);else fallo(e,'cerrar la cotización');}
   finally{M.guardando=false;S.busy=false;draw();}
  }
 };return {formulario,acciones};
}
