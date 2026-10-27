(function(root,fabrica){if(typeof module==='object'&&module.exports)module.exports=fabrica();else root.MhasGastosBase=fabrica();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const r2=n=>Math.round((Number(n)||0)*100)/100;
 const cent=n=>Math.round((Number(n)||0)*100);
 function periodo(mes,modo='mes'){
   if(!/^\d{4}-\d{2}$/.test(String(mes)))throw Error('Seleccione un mes válido.');
   const [a,m]=mes.split('-').map(Number);if(a<2000||a>2200||m<1||m>12||!['mes','q1','q2'].includes(modo))throw Error('Período inválido.');
   const ultimo=new Date(Date.UTC(a,m,0)).getUTCDate();
   return {mes,modo,inicio:mes+(modo==='q2'?'-16':'-01'),fin:mes+'-'+String(modo==='q1'?15:ultimo).padStart(2,'0')};
 }
 // Distribución en centavos: la suma asignada siempre coincide con el gasto.
 function prorratear(total,pesos){
   if(!Number.isSafeInteger(total)||total<0)throw Error('Gasto inválido.');
   const filas=pesos.map(([id,peso])=>({id:String(id),peso:BigInt(Math.max(0,Math.round(Number(peso)||0))),monto:0,resto:0n})).sort((a,b)=>a.id.localeCompare(b.id));
   const suma=filas.reduce((n,f)=>n+f.peso,0n);
   if(suma===0n)return {montos:Object.fromEntries(filas.map(f=>[f.id,0])),pendiente:total};
   let usados=0;
   filas.forEach(f=>{const x=BigInt(total)*f.peso;f.monto=Number(x/suma);f.resto=x%suma;usados+=f.monto;});
   const orden=filas.slice().sort((a,b)=>a.resto===b.resto?a.id.localeCompare(b.id):a.resto>b.resto?-1:1);
   for(let n=0;n<total-usados;n++)orden[n].monto++;
   return {montos:Object.fromEntries(filas.map(f=>[f.id,f.monto])),pendiente:0};
 }
 // Mismo cálculo de venta sin ISV que usa Ventas, conservando redondeo y descuentos por línea.
 function ventaSinIsv(items,flete){
   let sub=0,desc=0;
   (items||[]).forEach(i=>{const bruto=r2((Number(i.precio)||0)/1.15*i.cant);const descX=Math.min(bruto,Math.max(0,Math.round((Number(i.desc)||0)*1e4)/1e4));sub+=bruto;desc+=r2(descX);});
   return r2(r2(r2(sub)-r2(desc))+r2(Math.max(0,r2(Number(flete)||0))/1.15));
 }
 function calcular({facturas,gastos,personas,periodo:p}){
   const filas=facturas.filter(f=>!f.eliminada&&f.estado==='facturada'&&f.fecha>=p.inicio&&f.fecha<=p.fin).map(f=>({...f,venta:cent(f.venta),costo:cent(f.costo),directos:cent(f.directos),bruta:cent(r2(f.venta-f.costo))}));
   const gastosPeriodo=gastos.filter(g=>!g.anulado&&g.fecha>=p.inicio&&g.fecha<=p.fin);
   const gastosCentavos=gastosPeriodo.reduce((n,g)=>n+(Number(g.montoCentavos)||0),0);
   const reparto=prorratear(gastosCentavos,filas.map(f=>[f.id,f.bruta]));
   const porPersona=new Map(),porFactura={};let sinReparto=0,sinCosto=0;
   const tomar=(uid,ini,nombre)=>{if(!porPersona.has(uid))porPersona.set(uid,{uid,ini,nombre,bruta:0,directos:0,generales:0,neta:0,pagado:0});return porPersona.get(uid);};
   filas.forEach(f=>{
     const generales=reparto.montos[f.id]||0,neta=f.bruta-f.directos-generales;
     const rs=(f.reparto||[]).filter(r=>Number(r.pct)>0),pct=rs.reduce((n,r)=>n+Number(r.pct||0),0);
     const partes=[];if(f.sinCosto)sinCosto++;
     if(!rs.length||Math.abs(pct-100)>0.05){sinReparto++;const x=tomar('_sin_reparto','Sin reparto','Sin reparto confirmado');x.bruta+=f.bruta;x.directos+=f.directos;x.generales+=generales;x.neta+=neta;}
     else {
       const unir=new Map();rs.forEach(r=>{const uid=personas[r.uid]?.uid||r.uid;const v=unir.get(uid)||{uid,ini:personas[r.uid]?.ini||r.ini||'?',nombre:personas[r.uid]?.nombre||r.nombre||'',pct:0};v.pct+=Number(r.pct);unir.set(uid,v);});
       const R=[...unir.values()],pesos=R.map(r=>[r.uid,Math.round(r.pct*10000)]);
       const dividir=n=>{const d=prorratear(Math.abs(n),pesos).montos;return Object.fromEntries(Object.entries(d).map(([k,v])=>[k,n<0?-v:v]));};
       const br=dividir(f.bruta),di=dividir(f.directos),ge=dividir(generales);
       R.forEach(r=>{const x=tomar(r.uid,r.ini,r.nombre),n=br[r.uid]-di[r.uid]-ge[r.uid];
         // Los pagos históricos conservan el importe realmente marcado, aunque cambie un gasto después.
         const historico=f.netoPagado!=null?cent(f.netoPagado):f.bruta-f.directos;
         const entregado=(f.pagadoPartes||[]).find(p=>p.uid===r.uid);
         const pagado=f.pagado?(entregado?cent(entregado.monto):Math.round(historico*r.pct/100)):0;
         x.bruta+=br[r.uid];x.directos+=di[r.uid];x.generales+=ge[r.uid];x.neta+=n;x.pagado+=pagado;
         partes.push({uid:r.uid,pct:r.pct,bruta:br[r.uid],directos:di[r.uid],generales:ge[r.uid],neta:n,pagado});
       });
     }
     porFactura[f.id]={id:f.id,numero:f.numero,factura:f.factura,sinComprobante:!!f.sinComprobante,fiscalPendiente:!!f.fiscalPendiente,fecha:f.fecha,fechaFactura:f.fechaFactura||f.fecha,ajuste:!!f.ajuste,vendedor:f.vendedor,venta:f.venta,costo:f.costo,bruta:f.bruta,directos:f.directos,generales,neta,pagado:!!f.pagado,partes};
   });
   const total=filas.reduce((a,f)=>{a.venta+=f.venta;a.costo+=f.costo;a.bruta+=f.bruta;a.directos+=f.directos;return a;},{venta:0,costo:0,bruta:0,directos:0});
   return {periodo:p,totales:{...total,gastos:gastosCentavos,asignado:gastosCentavos-reparto.pendiente,pendiente:reparto.pendiente,neta:total.bruta-total.directos-gastosCentavos},porFactura,personas:[...porPersona.values()],sinReparto,sinCosto,gastosRegistrados:gastosPeriodo.length};
 }
 return {r2,cent,periodo,prorratear,ventaSinIsv,calcular};
});
