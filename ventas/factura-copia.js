// Conserva el original y agrega una reproducción en grises para archivo.
export async function facturaConCopia(PDFLib, bytes, pdfjs, crearCanvas = () => document.createElement("canvas")) {
  const pdf = await PDFLib.PDFDocument.load(bytes, {updateMetadata: false});
  if (pdf.getPageCount() !== 1) throw new Error("La factura original debe tener una página.");
  const original = pdf.getPage(0), {width, height} = original.getSize();
  const render = await pdfjs.getDocument({data: bytes.slice(0)}).promise;
  let canvas;
  try {
    const page = await render.getPage(1), viewport = page.getViewport({scale: 300 / 72});
    canvas = crearCanvas(); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d", {willReadFrequently: true});
    if (!ctx) throw new Error("No se pudo preparar la copia de la factura.");
    await page.render({canvasContext: ctx, viewport, background: "rgb(255,255,255)"}).promise;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const gris = Math.round(0.2126 * pixels.data[i] + 0.7152 * pixels.data[i + 1] + 0.0722 * pixels.data[i + 2]);
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = gris;
    }
    ctx.putImageData(pixels, 0, 0);
    const imagen = await pdf.embedPng(canvas.toDataURL("image/png"));
    const copia = pdf.addPage([width, height]);
    copia.drawImage(imagen, {x: 0, y: 0, width, height});
    const font = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold), size = 16;
    copia.drawText("COPIA", {
      x: (width - font.widthOfTextAtSize("COPIA", size)) / 2,
      y: height * 0.32, size, font, color: PDFLib.rgb(0, 0, 0), opacity: 0.2
    });
    return await pdf.save();
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    await render.destroy();
  }
}
