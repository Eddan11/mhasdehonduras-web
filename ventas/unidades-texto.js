function unidadTexto(unidad,cantidad=1){
  const raw=String(unidad||'UNIDAD').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('es-HN');
  const alias={UND:'UNIDAD',UNDS:'UNIDAD',UD:'UNIDAD',UDS:'UNIDAD',UNIDADES:'UNIDAD',ROLLOS:'ROLLO',CAJAS:'CAJA',FARDOS:'FARDO',PAQUETES:'PAQUETE',BOLSAS:'BOLSA',RESMAS:'RESMA',ETIQUETAS:'ETIQUETA',HOJAS:'HOJA',PAÑUELOS:'PAÑUELO',LIBRAS:'LIBRA',LB:'LIBRA',LBS:'LIBRA',KILOS:'KILO',KG:'KILO',MILLARES:'MILLAR',CLISES:'CLISÉ','CLISÉS':'CLISÉ',CLISE:'CLISÉ',PIEZAS:'PIEZA'};
  const singular=alias[raw]||raw;
  if(Math.abs(Number(cantidad))===1)return singular;
  if(singular==='CLISÉ')return 'CLISÉS';
  if(singular==='MILLAR')return 'MILLARES';
  if(/S$/.test(singular))return singular;
  return singular+(/[AEIOUÁÉÍÓÚ]$/.test(singular)?'S':'ES');
}
export {unidadTexto};
