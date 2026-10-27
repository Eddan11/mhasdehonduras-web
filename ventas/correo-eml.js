// Borrador MIME local con PDF adjunto. No realiza conexiones ni envía mensajes.
const cabecera=s=>String(s||'').replace(/[\r\n]/g,' ').trim();
const b64=s=>{const bytes=new TextEncoder().encode(String(s)),trozos=[];for(let i=0;i<bytes.length;i+=32768)trozos.push(String.fromCharCode(...bytes.subarray(i,i+32768)));return btoa(trozos.join(''));};
const lineas64=s=>String(s).match(/.{1,76}/g)?.join('\r\n')||'';
export function crearBorrador({desde,nombre,para,asunto,texto,pdfBase64,archivo,id=crypto.randomUUID(),fecha=new Date()}){
 const valido=s=>/^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[a-z]{2,}$/i.test(String(s||''));
 if(!valido(desde)||!valido(para))throw Error('Revise el remitente y el destinatario.');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(pdfBase64||''))throw Error('El PDF no se pudo preparar.');
 if(!/^[\w-]+$/.test(id))throw Error('Referencia de borrador inválida.');
 const boundary='mhas_'+id,filename=cabecera(archivo).replace(/["\\/]/g,'_'),ascii=filename.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'_');
 return [`From: =?UTF-8?B?${b64(cabecera(nombre))}?= <${desde}>`,`To: ${para}`,`Reply-To: ${desde}`,`Subject: =?UTF-8?B?${b64(cabecera(asunto))}?=`,`Date: ${fecha.toUTCString()}`,'MIME-Version: 1.0','X-Unsent: 1',`Content-Type: multipart/mixed; boundary="${boundary}"`,'',`--${boundary}`,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',lineas64(b64(texto)),'',`--${boundary}`,`Content-Type: application/pdf; name="${ascii}"`,'Content-Transfer-Encoding: base64',`Content-Disposition: attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,'',lineas64(pdfBase64),'',`--${boundary}--`,''].join('\r\n');
}
