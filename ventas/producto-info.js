const limpiarInfo = v => String(v ?? '').replace(/\s+/g, ' ').trim();
// Solo organiza texto existente. No deduce medidas ni propiedades del producto.
function separarInfo(texto) {
  let descripcion = limpiarInfo(texto), tamano = '', caracteristicas = [];
  const quitar = (patron, aplicar) => { descripcion = descripcion.replace(patron, (...m) => { aplicar(m); return ' '; }); };
  quitar(/(?:Tamaño\s*:?\s*)([^.;]+)([.;]?)/i, m => { tamano = m[1].trim(); });
  quitar(/Formato (cuadrado|rectangular) de ([^.;]+)[.;]?/i, m => { tamano = m[2].trim(); caracteristicas.push('Formato ' + m[1] + '.'); });
  quitar(/Impresión térmica directa:\s*no usa ribbon\./i, () => caracteristicas.push('Impresión térmica directa.', 'No usa ribbon.'));
  quitar(/Transferencia térmica:\s*requiere ribbon\./i, () => caracteristicas.push('Transferencia térmica.', 'Requiere ribbon.'));
  quitar(/Material plastificado\./i, m => caracteristicas.unshift(m[0]));
  // Se separa el grosor conservando literalmente el valor revisado.
  if (tamano) tamano = tamano.replace(/,\s*(grosor de .+)$/i, (_, dato) => { caracteristicas.push(dato.charAt(0).toUpperCase()+dato.slice(1)+'.'); return ''; });
  quitar(/Film negro de ([^,.;]+),\s*(grosor de [^.;]+)\./i, m => { tamano = m[1]; caracteristicas.push('Film negro.', m[2].charAt(0).toUpperCase()+m[2].slice(1)+'.'); });
  descripcion = limpiarInfo(descripcion).replace(/(^|[.!?]\s+)([a-záéíóúñ])/g,(_,a,b)=>a+b.toUpperCase());
  if (caracteristicas.length > 3) caracteristicas = [...caracteristicas.slice(0,2), caracteristicas.slice(2).join(' ')];
  return {descripcion, tamano, caracteristicas};
}
function infoProducto(p) {
  if (!Object.hasOwn(p, 'tamanoWeb') && !Object.hasOwn(p, 'caracteristicasWeb')) return separarInfo(p.descripcionWeb);
  return {descripcion:limpiarInfo(p.descripcionWeb),tamano:limpiarInfo(p.tamanoWeb),caracteristicas:(Array.isArray(p.caracteristicasWeb)?p.caracteristicasWeb:[]).map(limpiarInfo).filter(Boolean).slice(0,3)};
}
function nombreConTamano(p){
  const nombre=limpiarInfo(p.nombre),tamano=limpiarInfo(p.tamanoWeb);
  const numeros=t=>String(t).match(/\d+(?:[.,]\d+)?/g)||[];
  const medidas=numeros(tamano),actual=numeros(nombre);
  return tamano&&medidas.length&&!medidas.every(n=>actual.includes(n))?nombre+' — '+tamano.toUpperCase():nombre;
}
export {separarInfo, infoProducto, nombreConTamano};
