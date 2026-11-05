export function miniaturaProducto(p,esc){return p.foto?`<img src="${esc(p.fotoMini||p.foto)}" alt="Imagen de ${esc(p.nombre||'producto')}" loading="lazy" style="width:56px;height:56px;object-fit:contain;border-radius:8px;vertical-align:middle;margin-right:10px">`:'<span class="badge b-warn">Sin imagen</span> ';}
export function crearImagenesCatalogo({S,draw,toast,call}){
 const base64=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(Error('No se pudo leer la imagen.'));r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(blob);});
 async function preparar(file){const img=await createImageBitmap(file);try{const factor=Math.min(1,320/img.width,320/img.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*factor));canvas.height=Math.max(1,Math.round(img.height*factor));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);const mini=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.85));if(!mini)throw Error('No se pudo preparar la vista previa.');return {miniBase64:await base64(mini),ancho:img.width,alto:img.height};}finally{img.close();}}
 document.addEventListener('input',e=>{const k=e.target.dataset?.k;if(k==='pe_foto'||k==='cw_foto'){delete S.f[k+'Mini'];delete S.f[k+'Archivo'];}});
 document.addEventListener('change',async e=>{
  const campo=e.target.dataset?.imagen,file=e.target.files?.[0];if(!campo||!file||!S.admin||S.imagenSubiendo)return;
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))return toast('Seleccione una imagen JPG, PNG, WebP o GIF.');
  if(file.size>6*1024*1024)return toast('La imagen debe pesar como máximo 6 MB.');
  const contexto=JSON.stringify(S.m);S.imagenSubiendo=true;draw();
  try{const [contenido,mini]=await Promise.all([base64(file),preparar(file)]);const r=await call({base64:contenido,nombre:file.name,...mini}),d=r.data??r;
   if(JSON.stringify(S.m)!==contexto)throw Error('La ficha cambió mientras se subía la imagen. Vuelva a abrirla.');
   S.f[campo]=d.url;S.f[campo+'Mini']=d.mini;S.f[campo+'Archivo']=d.archivo;if(campo==='pe_foto')S.f.pe_fotoWeb=true;toast('Imagen subida. Guarde la ficha para aplicarla.');
  }catch(err){toast(err.message||'No se pudo subir la imagen.');}finally{S.imagenSubiendo=false;draw();}
 });
}
