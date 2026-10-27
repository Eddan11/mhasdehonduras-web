// Una guía por página, en vertical y sin rotación del documento.
export const FORMATOS_GUIA={eti:{n:'Etiqueta 60 x 90 · vertical',page:[60,90],o:'portrait'},'4x6':{n:'Etiqueta 4 x 6 · vertical',page:[101.6,152.4],o:'portrait'},carta:{n:'Carta / A4 · vertical',page:'letter',o:'portrait'}};
export function crearGuia(c,fmt,{jsPDF,logo,qV,vuDe,telPedidos}){
 const F=FORMATOS_GUIA[fmt]||FORMATOS_GUIA.eti,d=new jsPDF({unit:'mm',format:F.page,orientation:F.o});
 const PW=d.internal.pageSize.getWidth(),PH=d.internal.pageSize.getHeight(),k=fmt==='carta'?Math.min((PW-20)/60,2):Math.min(PW/60,PH/90),ox=(PW-60*k)/2,oy=fmt==='carta'?10:(PH-90*k)/2;
 const X=x=>ox+x*k,Y=y=>oy+y*k,up=s=>String(s||'').toUpperCase().trim(),W=54,cx=30,cl=c.cliente||{};
 const font=(size,bold=true)=>{d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(size*k);};
 const text=(s,y)=>d.text(s,X(cx),Y(y),{align:'center'});
 function lineas(s,size,max){font(size);let a=d.splitTextToSize(s,W*k);while(a.length>max&&size>6){size-=.5;font(size);a=d.splitTextToSize(s,W*k);}if(a.length>max){a=a.slice(0,max);a[max-1]=a[max-1].replace(/\s+\S*$/,'')+'...';}return a;}
 d.setTextColor(0,0,0);
 try{d.addImage(logo,'JPEG',X(20),Y(3),20*k,9.9*k);}catch(_){}
 const nombre=lineas(up(cl.nombre),10,3);nombre.forEach((s,n)=>text(s,19+n*3.7));let y=20+nombre.length*3.7;
 d.setDrawColor(0);d.setLineWidth(.2*k);d.line(X(3),Y(y),X(57),Y(y));y+=4;
 const direccion=[cl.contacto?'ATE: '+up(cl.contacto)+'.':'',cl.direccion?'DIRECCION: '+up(cl.direccion):'DIRECCION:'].filter(Boolean).join(' ');
 lineas(direccion,8,6).forEach(s=>{text(s,y);y+=3.4;});y+=3;
 if(cl.tel){font(9);text('CEL: '+cl.tel,y);y+=6;}
 const productos='CONTENIDO: '+(c.items||[]).map(i=>`${qV(i)} ${up(vuDe(i).n)} ${up(i.nombre)}`).join(' · ');
 lineas(productos,7.5,Math.max(1,Math.floor((77-y)/3))).forEach(s=>{text(s,y);y+=3;});
 const tv=String(c.vendedorInfo?.tel||'').trim(),dg=tv.replace(/\D/g,''),tel=dg.length===8?'+504 '+dg.slice(0,4)+'-'+dg.slice(4):dg.length===11&&dg.startsWith('504')?'+504 '+dg.slice(3,7)+'-'+dg.slice(7):tv||telPedidos;
 font(7);const pedidos='PARA PEDIDOS: '+tel,w=Math.min(W,d.getTextWidth(pedidos)/k+3);d.setFillColor(0);d.rect(X(cx-w/2),Y(80),w*k,4.5*k,'F');d.setTextColor(255);text(pedidos,83.1);
 font(5.5,false);d.setTextColor(90);d.text(c.numero||'',X(57),Y(88),{align:'right'});
 return d;
}
