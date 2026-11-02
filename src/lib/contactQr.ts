// ENKAY "Contact Us" QR code – always points at the public /contact page (never /admin).
//
// The module pattern below is the QR encoding of CONTACT_URL (version 5, error-correction level H,
// so the centre logo cannot break scanning). If the production domain ever changes, update
// CONTACT_URL and regenerate the pattern, e.g. with `npx qrcode` / any QR library set to level H.
export const CONTACT_URL = 'https://enkayrenewablesenergy.com/contact';

const MODULES: string[] = [
  '1111111001000101000011000100101111111',
  '1000001000011101001011100010101000001',
  '1011101001101110011100100111001011101',
  '1011101001011100010000111101001011101',
  '1011101010000101111101100011001011101',
  '1000001001100010110010010110001000001',
  '1111111010101010101010101010101111111',
  '0000000010010010010001100011100000000',
  '0011001111010001100110011101011010000',
  '1110110010000010110111101100110100110',
  '0110001011100101101100111100110001100',
  '0100100010110011110100110111100011110',
  '0111111101100110100001011111111011111',
  '1111100100010111111010101011101110111',
  '1101001100010000100110110100010110110',
  '1000100011010011100100110010111110010',
  '0101101010000111001000011100100001111',
  '1010100100001001101111111001001000101',
  '1100111011000010001011011111111010011',
  '1111000000011000001100001010100011000',
  '1001001010001001110100010010110011001',
  '0010010100001000100001101100010101000',
  '1111011110000111101010000100000011110',
  '0011010001101001001011010001100001110',
  '0100011101110001101100101010011011110',
  '0101010010100100111111011011111110011',
  '0111011110000101100100110110000011010',
  '1010100101001010111110010011010110001',
  '0011001101101010110011100100111110101',
  '0000000011100000001000011100100011101',
  '1111111011001110110111100100101011011',
  '1000001001111111001110001011100011011',
  '1011101000110110010110111010111111011',
  '1011101010110010100011001001101011100',
  '1011101011101110001001111110001111010',
  '1000001000010011001110000110011001100',
  '1111111001100110110011101110000100111',
];

const N = MODULES.length;
const GREEN = '#1d3a1d';
const MID_GREEN = '#1d6b1d';
const YELLOW = '#f5b800';
const M = 10; // module size in SVG units

const W = 500;
const H = 570;
const X0 = (W - N * M) / 2;
const Y0 = 60;

// Centre logo box (modules) – ~6% of the area, well inside level-H recovery.
const LOGO_W = 11;
const LOGO_H = 8;
const LOGO_C0 = Math.floor((N - LOGO_W) / 2);
const LOGO_R0 = Math.floor((N - LOGO_H) / 2);

const inFinder = (r: number, c: number) =>
  (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
const inLogo = (r: number, c: number) =>
  r >= LOGO_R0 && r < LOGO_R0 + LOGO_H && c >= LOGO_C0 && c < LOGO_C0 + LOGO_W;

function finder(r: number, c: number): string {
  const x = X0 + c * M;
  const y = Y0 + r * M;
  return (
    `<rect x="${x + M / 2}" y="${y + M / 2}" width="${6 * M}" height="${6 * M}" rx="${1.8 * M}" fill="none" stroke="${GREEN}" stroke-width="${M}"/>` +
    `<rect x="${x + 2 * M}" y="${y + 2 * M}" width="${3 * M}" height="${3 * M}" rx="${M}" fill="${MID_GREEN}"/>`
  );
}

/** Standalone SVG. `logoDataUri` is the ENKAY logo as a data: URI so the file is self-contained. */
export function buildQrSvg(logoDataUri: string): string {
  let dots = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (MODULES[r][c] !== '1' || inFinder(r, c) || inLogo(r, c)) continue;
      dots += `<rect x="${X0 + c * M + 0.4}" y="${Y0 + r * M + 0.4}" width="${M - 0.8}" height="${M - 0.8}" rx="2.6"/>`;
    }
  }
  const lx = X0 + LOGO_C0 * M;
  const ly = Y0 + LOGO_R0 * M;
  const lw = LOGO_W * M;
  const lh = LOGO_H * M;
  // Logo mark (the "EK" symbol) is the left ~44% of the 800x222 logo image.
  const markW = 350;
  const scale = (lh - 16) / 222;
  const mw = markW * scale;
  const mx = lx + (lw - mw) / 2;
  const my = ly + 8;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<title>ENKAY Renewables Energy – scan to open the Contact Us page</title>` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="22" fill="none" stroke="${YELLOW}" stroke-width="8"/>` +
    `<g fill="${GREEN}">${dots}</g>` +
    finder(0, 0) + finder(0, N - 7) + finder(N - 7, 0) +
    `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="14" fill="#ffffff" stroke="${YELLOW}" stroke-width="3"/>` +
    `<svg x="${mx}" y="${my}" width="${mw}" height="${lh - 16}" viewBox="0 0 ${markW} 222" overflow="hidden">` +
    `<image href="${logoDataUri}" xlink:href="${logoDataUri}" width="800" height="222"/></svg>` +
    `<rect x="60" y="${Y0 + N * M + 36}" width="${W - 120}" height="62" rx="31" fill="${GREEN}"/>` +
    `<text x="${W / 2}" y="${Y0 + N * M + 76}" text-anchor="middle" font-family="Montserrat, Arial, Helvetica, sans-serif" font-size="25" font-weight="800" letter-spacing="2.5" fill="${YELLOW}">SCAN TO CONTACT US</text>` +
    `</svg>`
  );
}

// ── helpers used by the admin download buttons ──
export async function logoToDataUri(url = '/assets/enkay-logo.png'): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

const crcTable = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff;
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Insert a pHYs chunk so print software opens the PNG at 300 DPI. */
function setPngDpi(png: Uint8Array, dpi = 300): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // 'pHYs'
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1; // metres
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const at = 33; // after signature (8) + IHDR chunk (25)
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, at), 0);
  out.set(chunk, at);
  out.set(png.subarray(at), at + chunk.length);
  return out;
}

/** 3000 px wide PNG (10 in at 300 DPI) rendered from the SVG. */
export async function buildQrPng(svg: string, width = 3000): Promise<Blob> {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round((width * H) / W);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'));
  const bytes = setPngDpi(new Uint8Array(await blob.arrayBuffer()));
  return new Blob([bytes as BlobPart], { type: 'image/png' });
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
