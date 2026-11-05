function unidadTexto(unidad,cantidad=1){
  const raw=String(unidad||'UNIDAD').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('es-HN');
  const alias={UN:'UNIDAD',UNS:'UNIDAD',UND:'UNIDAD',UNDS:'UNIDAD',UD:'UNIDAD',UDS:'UNIDAD',UNIDADES:'UNIDAD',ETQ:'ETIQUETA',ETQS:'ETIQUETA',PAQ:'PAQUETE',PAQS:'PAQUETE',ROLLOS:'ROLLO',CAJAS:'CAJA',FARDOS:'FARDO',PAQUETES:'PAQUETE',BOLSAS:'BOLSA',RESMAS:'RESMA',ETIQUETAS:'ETIQUETA',HOJAS:'HOJA',PAÑUELOS:'PAÑUELO',LIBRAS:'LIBRA',LB:'LIBRA',LBS:'LIBRA',KILOS:'KILO',KG:'KILO',MILLARES:'MILLAR',CLISES:'CLISÉ','CLISÉS':'CLISÉ',CLISE:'CLISÉ',PIEZAS:'PIEZA'};
  const singular=alias[raw]||raw;
  const abreviada={UNIDAD:['UND','UNDS'],ETIQUETA:['ETQ','ETQS'],PAQUETE:['PAQ','PAQS']}[singular];
  if(abreviada)return abreviada[Math.abs(Number(cantidad))===1?0:1];
  if(Math.abs(Number(cantidad))===1)return singular;
  if(singular==='CLISÉ')return 'CLISÉS';
  if(singular==='MILLAR')return 'MILLARES';
  if(/S$/.test(singular))return singular;
  return singular+(/[AEIOUÁÉÍÓÚ]$/.test(singular)?'S':'ES');
}
function abreviarTexto(texto){
  return String(texto||'').replace(/\b(\d[\d,.]*)\s*(UNIDADES|UNIDAD|UNDS|UND|UNS|UN|ETIQUETAS|ETIQUETA|ETQS|ETQ|PAQUETES|PAQUETE|PAQS|PAQ)\b/gi,(_,n,unidad)=>n+' '+unidadTexto(unidad,Number(n.replace(/,/g,'')))).replace(/\bPAQUETES\b/gi,'PAQS').replace(/\bPAQUETE\b/gi,'PAQ');
}
function textoNormal(texto){
  const s=String(texto||'').trim();
  if(!s||s!==s.toLocaleUpperCase('es-HN'))return s;
  return s.toLocaleLowerCase('es-HN').replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu,(_,inicio,letra)=>inicio+letra.toLocaleUpperCase('es-HN'))
    .replace(/\b(pos|bopp|cai|isv|rtn|und|unds|etq|etqs|paq|paqs|mhas|sat|hd|ap)\b/gi,x=>x.toUpperCase())
    .replace(/\b(kleenex|lariansa|ferrecomsa|zebra|epson)\b/gi,x=>x[0].toUpperCase()+x.slice(1).toLowerCase());
}
export {unidadTexto,abreviarTexto,textoNormal};
