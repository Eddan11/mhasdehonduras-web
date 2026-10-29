// Compras reutiliza Productos, Inventario y Por pagar. No contiene credenciales ni costos iniciales.
export function crearCompras(ctx) {
  const {S,esc,L,fdate,today,r2,draw,toast,call,fallo,pagoForm,pagosHtml,saldo,leerPago,clearForm}=ctx;
  const uid=()=>crypto.randomUUID();
  const v=k=>esc(S.f[k]??'');
  const cart=()=>S.compraCart||(S.compraCart=[]);
  const compras=()=>S.compras||[];
  const estado=c=>({pendiente:'Pendiente de recibir',parcial:'Recepción parcial',recibida:'Recibida',anulada:'Anulada'}[c.estado]||c.estado);
  const cuenta=c=>(S.cxp||[]).find(x=>x.id===c.cxpId);
  const total=()=>r2(cart().reduce((s,i)=>s+r2(i.cantidad*i.costo)+r2(r2(i.cantidad*i.costo)*i.tasa/100),0)+Number(S.f.cp_cargos||0));
  const retirados=()=>S.compraEdit?(S.compraEdit.items||[]).filter(i=>Number(i.recibida)>0&&!cart().some(x=>x.prod===i.prod&&Number(x.recibida)>0)&&!S.compraEdit.costosAnteriores?.[i.prod]):[];
  function limpiarLinea(){delete S.compraLineaEdit;['cp_prod','cp_cant','cp_costo','cp_tasa','cp_line_rec'].forEach(k=>delete S.f[k]);}
  function limpiarCompra(){S.compraForm=false;S.compraCart=[];S.compraIntento=null;S.compraEdit=null;limpiarLinea();Object.keys(S.f).filter(k=>k.startsWith('cp_')).forEach(k=>delete S.f[k]);}
  const input=(k,label,type='text',valor=null,extra='')=>`<div class="field"><label for="${k}">${label}</label><input id="${k}" data-k="${k}" type="${type}" value="${valor==null?v(k):esc(valor)}" ${extra}></div>`;
  const chk=(k,label)=>`<label style="display:flex;gap:8px;align-items:center;margin:12px 0"><input style="width:20px;min-height:20px" data-k="${k}" type="checkbox" ${S.f[k]?'checked':''}>${label}</label>`;
  function vista() {
    const q=String(S.f.cpq||'').trim().toLowerCase();
    const list=compras().filter(c=>!q||[c.proveedor,c.factura,c.numero].join(' ').toLowerCase().includes(q)).sort((a,b)=>(b.creado||0)-(a.creado||0));
    return `<h1>Compras</h1><p class="sub">Registre la compra una vez: mercadería recibida en Inventario y saldo del proveedor en Por pagar.</p>
      <div class="actions"><button class="btn pri" data-a="cpNueva">Nueva compra</button><button class="btn" data-a="cpPagarTab">Por pagar</button><button class="btn" data-a="cpInvTab">Inventario</button></div>
      ${S.compraForm?formulario():''}
      ${input('cpq','Buscar proveedor o referencia')}
      <div class="panel"><div class="scroll">${list.length?`<table><thead><tr><th>Fecha</th><th>Proveedor / referencia</th><th>Recepción</th><th class="num">Total</th><th class="num">Saldo</th></tr></thead><tbody>${list.map(c=>`<tr class="click" tabindex="0" data-a="cpAbrir" data-v="${esc(c.id)}"><td>${fdate(c.fecha)}</td><td>${esc(c.proveedor)}<br><small>${esc(c.factura)}</small></td><td>${esc(estado(c))}</td><td class="num">${L(c.total)}</td><td class="num">${c.estado==='anulada'?'—':cuenta(c)?L(saldo(cuenta(c))):'Cargando…'}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">No hay compras registradas.</p>'}</div></div>`;
  }
  function formulario() {
    const ps=S.prod.filter(p=>p.activo!==false);
    return `<section class="panel"><h2>${S.compraEdit?'Modificar compra':'Nueva compra'}</h2>
      <div class="row">${input('cp_prov','Proveedor','text',null,'list="cp_proveedores" autocomplete="off"')}${input('cp_rtn','RTN del proveedor (opcional)')}</div>
      <datalist id="cp_proveedores">${[...new Set([...(S.proveedores||[]).map(p=>p.nombre),...(S.cxp||[]).map(p=>p.proveedor)])].filter(Boolean).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
      <div class="row">${input('cp_fact','Factura o referencia del proveedor')}${input('cp_fecha','Fecha','date',S.f.cp_fecha||today())}${input('cp_vence','Vence','date',S.f.cp_vence||today())}</div>
      <div class="field"><label for="cp_venta">Venta relacionada (opcional)</label><select id="cp_venta" data-k="cp_venta"><option value="">Para inventario, sin venta asociada</option>${(S.cot||[]).filter(c=>!c.eliminada&&!['anulada','perdida'].includes(c.estado)).slice(0,150).map(c=>`<option value="${esc(c.id)}" ${S.f.cp_venta===c.id?'selected':''}>${esc(c.numero)} · ${esc(c.cliente?.nombre||'')}</option>`).join('')}</select></div>
      <h3>Productos</h3><p class="note">Cantidad en la presentación del panel (caja, rollo, libra…). El costo es de compra, sin ISV; no modifica el precio de venta.</p>
      <div class="field"><label for="cp_prod">Producto</label><select id="cp_prod" data-k="cp_prod"><option value="">Seleccione</option>${ps.map(p=>`<option value="${esc(p.id)}" ${S.f.cp_prod===p.id?'selected':''}>${esc(p.codigo||p.id)} · ${esc(p.nombre)} · ${esc(p.presentacion||p.unidad||'Unidad')}</option>`).join('')}</select></div>
      <div class="row">${input('cp_cant','Cantidad de presentaciones','number',null,'min="0.001" step="0.001"')}${input('cp_costo','Costo por presentación sin ISV (L)','number',null,'min="0.0001" step="0.0001"')}${input('cp_tasa','ISV (%)','number',S.f.cp_tasa??15,'min="0" max="100" step="0.01"')}</div>
      ${S.compraEdit?input('cp_line_rec','Cantidad recibida de este producto','number',S.f.cp_line_rec??0,'min="0" step="0.001"'):''}
      <button class="btn" data-a="cpAgregar">${S.compraLineaEdit!=null?'Guardar producto':'Agregar producto'}</button>
      ${cart().length?`<div class="scroll"><table><thead><tr><th>Producto / presentación</th><th class="num">Cantidad</th>${S.compraEdit?'<th class="num">Recibido</th>':''}<th class="num">Costo sin ISV</th><th class="num">Con ISV</th><th></th></tr></thead><tbody>${cart().map((i,n)=>`<tr><td>${esc(i.nombre)}<br><small>${esc(i.presentacion)} · ${i.unidades} ${esc(i.unidad)} por presentación</small></td><td class="num">${i.cantidad}</td>${S.compraEdit?`<td class="num">${i.recibida||0}</td>`:''}<td class="num">${L(i.costo)}</td><td class="num">${L(r2(i.cantidad*i.costo)+r2(r2(i.cantidad*i.costo)*i.tasa/100))}</td><td><button class="btn sm" data-a="cpEditarLinea" data-v="${n}">Editar</button> <button class="btn sm" data-a="cpQuitar" data-v="${n}">Quitar</button></td></tr>`).join('')}</tbody></table></div>`:''}
      <div class="row">${input('cp_cargos','Otros cargos: total con ISV (L)','number',S.f.cp_cargos??0,'min="0" step="0.01"')}${S.compraEdit?'':input('cp_abono','Pago inicial (L)','number',S.f.cp_abono??0,'min="0" step="0.01"')}</div>
      ${!S.compraEdit&&Number(S.f.cp_abono)>0?`<div class="row"><div class="field"><label for="cp_metodo">Medio del pago inicial</label><select id="cp_metodo" data-k="cp_metodo">${['Transferencia','Efectivo','Depósito','Cheque'].map(m=>`<option ${S.f.cp_metodo===m?'selected':''}>${m}</option>`).join('')}</select></div>${input('cp_ref','Referencia del pago (opcional)')}</div>`:''}
      <p><b>Total de compra: ${L(total())}</b> ${S.compraEdit?`<span class="note">Pagos registrados: ${L(S.compraEdit.pagado)} · Saldo resultante: ${L(r2(total()-S.compraEdit.pagado))}. Los pagos se conservan.</span>`:'<button class="btn sm" data-a="cpContado">Marcar pagada completa</button>'}</p>
      ${input('cp_nota','Nota (opcional)')}
      ${S.compraEdit?'<p class="note">Revise lo comprado y lo recibido en cada producto. Se corregirán las entradas existentes y se conservarán los pagos.</p>':chk('cp_recibida','Ya recibí toda la mercadería (registrar entrada de inventario)')}
      ${retirados().map(i=>input('cp_rest_'+i.prod,'Costo correcto actual sin ISV de '+esc(i.nombre)+' (producto retirado)','number',null,'min="0.0001" step="0.0001"')).join('')}
      <p class="note">Al recibir la mercadería se actualiza automáticamente el último costo de compra en Productos; el precio de venta se conserva. Otros cargos no se reparten en ese costo. Las facturas sin costo guardado aún usan el costo de referencia actual.</p>
      <div class="actions"><button class="btn pri" data-a="cpGuardar" ${S.busy?'disabled':''}>${S.compraEdit?'Guardar cambios':'Guardar compra'}</button><button class="btn" data-a="cpCancelar" ${S.busy?'disabled':''}>Cancelar</button></div></section>`;
  }
  function modal() {
    const c=compras().find(x=>x.id===S.m.id);if(!c)return '<p>Cargando compra…</p>';
    const x=cuenta(c),recibir=S.m.mode==='recibir';
    return `<h1>${esc(c.proveedor)}</h1><p>${esc(c.factura)} · ${fdate(c.fecha)} · ${esc(estado(c))}</p>${c.cotizacionId?`<button class="btn" data-a="cpVenta" data-v="${esc(c.cotizacionId)}">Ver venta ${esc(c.cotizacionNumero||'')}</button>`:''}
      <div class="scroll"><table><thead><tr><th>Producto / presentación</th><th class="num">Comprado</th><th class="num">Recibido</th>${recibir?'<th>Recibir ahora</th>':''}</tr></thead><tbody>${c.items.map((i,n)=>`<tr><td>${esc(i.nombre)}<br><small>${esc(i.presentacion)} · ${i.unidades} unidades · costo sin ISV ${L(i.costo)}</small></td><td class="num">${i.cantidad}</td><td class="num">${i.recibida||0}</td>${recibir?`<td><input aria-label="Recibir ${esc(i.nombre)}" data-k="cp_rec_${n}" type="number" min="0" max="${r2(i.cantidad-(i.recibida||0))}" step="0.001" value="${esc(S.f['cp_rec_'+n]??0)}"></td>`:''}</tr>`).join('')}</tbody></table></div>
      <dl class="kv"><dt>Subtotal sin ISV</dt><dd>${L(c.base)}</dd><dt>ISV</dt><dd>${L(c.isv)}</dd><dt>Otros cargos</dt><dd>${L(c.cargos)}</dd><dt>Total</dt><dd>${L(c.total)}</dd><dt>Saldo</dt><dd>${x?L(saldo(x)):'Cargando…'}</dd><dt>Vence</dt><dd>${fdate(c.vence)}</dd></dl>
      ${c.nota?`<p>${esc(c.nota)}</p>`:''}
      ${recibir?`<p class="note">Indique solo lo que recibió físicamente. El resto queda pendiente.</p><div class="actions"><button class="btn" data-a="cpRecTodo">Completar lo pendiente</button><button class="btn pri" data-a="cpRecGuardar" ${S.busy?'disabled':''}>Confirmar recepción</button><button class="btn" data-a="cpVolver">Volver</button></div>`:`<div class="actions">${c.estado!=='anulada'?'<button class="btn" data-a="cpModificar">Modificar compra</button>':''}${!['recibida','anulada'].includes(c.estado)?'<button class="btn pri" data-a="cpRecibir">Recibir mercadería</button>':''}${x&&!x.anulada?`<button class="btn" data-a="cpCuenta" data-v="${esc(x.id)}">Ver cuenta / registrar pago</button>`:''}<button class="btn" data-a="cpInvTab">Ver inventario</button>${S.admin&&c.estado==='pendiente'&&x&&!(x.pagos||[]).length?'<button class="btn danger" data-a="cpAnular">Anular compra</button>':''}</div>`}`;
  }
  async function enviar(payload,exito) {
    if(S.busy)return false;S.busy=true;draw();
    try {await call(payload);exito();return true;}catch(e){
      if(/failed-precondition|invalid-argument/.test(e.code||'')){S.compraIntento=null;if(S.m){delete S.m.intento;delete S.m.intentoPago;}}
      fallo(e,'guardar la compra');return false;
    }finally{S.busy=false;draw();}
  }
  const acciones={
    cpNueva(){if(S.compraEdit){if(!confirm('¿Descartar los cambios de esta compra?'))return;limpiarCompra();}const prod=S.m&&S.m.type==='inv'?S.m.id:null;S.tab='compras';S.m=null;if(!S.compraForm){S.compraForm=true;S.compraId=uid();S.compraCart=[];}if(prod)S.f.cp_prod=prod;draw();},
    cpCancelar(){if(cart().length&&!confirm('¿Descartar esta compra sin guardar?'))return;const id=S.compraEdit?.id;limpiarCompra();if(id)S.m={type:'compra',id};draw();},
    cpAgregar(){
      const p=S.prod.find(x=>x.id===S.f.cp_prod);const cantidad=Number(S.f.cp_cant),costo=Number(S.f.cp_costo),tasa=Number(S.f.cp_tasa??15);
      if(!p||!(cantidad>0)||!(costo>0)||!Number.isFinite(cantidad)||!Number.isFinite(costo)||!Number.isFinite(tasa)||tasa<0||tasa>100)return toast('Seleccione producto y revise cantidad, costo e ISV.');
      if(cart().some((i,n)=>i.prod===p.id&&n!==S.compraLineaEdit))return toast('Ese producto ya está agregado. Quite la línea para corregirla.');
      if(cart().length>=30&&S.compraLineaEdit==null)return toast('Máximo 30 productos por compra.');
      const vieja=S.compraLineaEdit!=null?cart()[S.compraLineaEdit]:null,recibida=S.compraEdit?Number(S.f.cp_line_rec??vieja?.recibida??0):0;
      if(S.compraEdit&&(!Number.isFinite(recibida)||recibida<0||recibida>cantidad))return toast('La cantidad recibida debe estar entre cero y la cantidad comprada.');
      const linea={...(vieja||{}),prod:p.id,nombre:p.nombre,presentacion:vieja?.prod===p.id?vieja.presentacion:p.presentacion||p.unidad||'Unidad',unidades:vieja?.prod===p.id?vieja.unidades:Number(p.unidades)||1,unidad:p.unidad||'unidades',cantidad,costo,tasa,recibida};
      if(S.compraLineaEdit!=null)cart()[S.compraLineaEdit]=linea;else cart().push(linea);limpiarLinea();draw();
    },
    cpEditarLinea(n){const i=cart()[Number(n)];if(!i)return;S.compraLineaEdit=Number(n);Object.assign(S.f,{cp_prod:i.prod,cp_cant:i.cantidad,cp_costo:i.costo,cp_tasa:i.tasa,cp_line_rec:i.recibida||0});draw();},
    cpQuitar(n){cart().splice(Number(n),1);limpiarLinea();draw();},
    cpContado(){S.f.cp_abono=total();draw();},
    cpGuardar(){
      if(S.compraLineaEdit!=null)return toast('Guarde primero el producto que está editando.');
      if(!String(S.f.cp_prov||'').trim()||!String(S.f.cp_fact||'').trim()||!cart().length)return toast('Complete proveedor, referencia y productos.');
      // Un reintento conserva la misma operación: no duplica compra, pago ni inventario si se perdió la respuesta.
      const payload=S.compraIntento||(S.compraIntento={accion:S.compraEdit?'modificar':'registrar',id:S.compraId,...(S.compraEdit?{version:S.compraEdit.version,operacion:uid(),costosRestaurar:Object.fromEntries(retirados().map(i=>[i.prod,Number(S.f['cp_rest_'+i.prod])||0]))}:{}),proveedor:S.f.cp_prov,rtn:S.f.cp_rtn||'',factura:S.f.cp_fact,fecha:S.f.cp_fecha||today(),vence:S.f.cp_vence||today(),cotizacionId:S.f.cp_venta||'',items:cart().map(({prod,cantidad,costo,tasa,origen,recibida})=>({prod,cantidad,costo,tasa,...(S.compraEdit?{origen:origen??null,recibida:recibida||0}:{})})),cargos:Number(S.f.cp_cargos||0),abono:Number(S.f.cp_abono||0),metodo:S.f.cp_metodo||'Transferencia',ref:S.f.cp_ref||'',nota:S.f.cp_nota||'',recibido:!!S.f.cp_recibida,actualizarCosto:true});
      return enviar(payload,()=>{limpiarCompra();S.m={type:'compra',id:payload.id};toast(payload.accion==='modificar'?'Compra modificada; inventario y saldo actualizados.':'Compra guardada y vinculada con Por pagar.');});
    },
    cpModificar(){const c=compras().find(x=>x.id===S.m?.id);if(!c||c.estado==='anulada'||S.busy)return;if(S.compraForm&&cart().length&&!confirm('¿Descartar el formulario actual?'))return;limpiarCompra();const x=cuenta(c);S.compraEdit={id:c.id,version:c.actualizado||c.creado,items:c.items.map(i=>({...i})),costosAnteriores:c.costosAnteriores||{},pagado:(x?.pagos||[]).reduce((n,p)=>n+Number(p.monto||0),0)};S.compraId=c.id;S.compraForm=true;S.compraCart=c.items.map((i,origen)=>({...i,origen}));Object.assign(S.f,{cp_prov:c.proveedor,cp_rtn:c.rtn||'',cp_fact:c.factura,cp_fecha:c.fecha,cp_vence:c.vence,cp_venta:c.cotizacionId||'',cp_cargos:c.cargos||0,cp_nota:c.nota||''});S.tab='compras';S.m=null;draw();},
    cpAbrir(id){S.m={type:'compra',id};draw();},
    cpVenta(id){S.m={type:'cot',id,mode:'ver'};draw();},
    cpRecibir(){S.m.mode='recibir';S.m.operacion=uid();S.m.intento=null;Object.keys(S.f).filter(k=>k.startsWith('cp_rec_')).forEach(k=>delete S.f[k]);draw();},
    cpRecTodo(){const c=compras().find(x=>x.id===S.m.id);c.items.forEach((i,n)=>S.f['cp_rec_'+n]=Math.round((i.cantidad-(i.recibida||0))*1000)/1000);draw();},
    cpRecGuardar(){const c=compras().find(x=>x.id===S.m.id);const p=S.m.intento||(S.m.intento={accion:'recibir',id:c.id,operacion:S.m.operacion,cantidades:c.items.map((i,n)=>Number(S.f['cp_rec_'+n]||0))});return enviar(p,()=>{S.m={type:'compra',id:c.id};toast('Recepción registrada en Inventario.');});},
    cpVolver(){S.m.mode='ver';S.m.intento=null;draw();},
    cpCuenta(id){S.m={type:'cxp',id,mode:'ver'};clearForm();draw();},
    cpPagarTab(){S.tab='pagar';S.m=null;draw();},
    cpInvTab(){S.tab='inventario';S.m=null;draw();},
    cpAnular(){if(!confirm('¿Anular esta compra y su cuenta? Se conservará el registro.'))return;const id=S.m.id;return enviar({accion:'anular',id},()=>{S.m=null;toast('Compra anulada.');});}
  };
  async function pagarVinculada(x) {
    const p=leerPago(x);if(!p)return;
    const payload=S.m.intentoPago||(S.m.intentoPago={accion:'pagar',id:x.compraId,operacion:uid(),...p});
    return enviar(payload,()=>{S.m={type:'cxp',id:x.id,mode:'ver'};clearForm();toast('Pago registrado en la compra y Por pagar.');});
  }
  return {vista,modal,acciones,pagarVinculada};
}
