/**
 * Tasteful SVG placeholders: soft brand gradient + a minimal line illustration
 * per category, tinted with the product's main colour.
 */

const ART: Record<string, string> = {
  bras: `
    <path d="M190 250 L214 330 M410 250 L386 330" fill="none" stroke="{stroke}" stroke-width="5" stroke-linecap="round"/>
    <path d="M140 430 Q300 480 460 430 L462 462 Q300 512 138 462 Z" fill="{fill}" stroke="{stroke}" stroke-width="4"/>
    <path d="M150 432 C146 352 226 300 296 410 C252 450 192 456 150 432 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M450 432 C454 352 374 300 304 410 C348 450 408 456 450 432 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M168 372 Q196 344 228 352 Q258 360 282 392 M432 372 Q404 344 372 352 Q342 360 318 392" fill="none" stroke="{stroke}" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <circle cx="300" cy="414" r="8" fill="#F4C7CF" stroke="{stroke}" stroke-width="2.5"/>`,
  panties: `
    <path d="M140 320 L460 320 L452 364 C392 382 344 452 326 548 L274 548 C256 452 208 382 148 364 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M144 342 L456 342" stroke="{stroke}" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <circle cx="300" cy="358" r="8" fill="#F4C7CF" stroke="{stroke}" stroke-width="2.5"/>`,
  pajamas: `
    <path d="M222 470 L378 470 L400 700 L318 700 L300 548 L282 700 L200 700 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M206 236 L254 214 L300 252 L346 214 L394 236 L456 384 L414 400 L386 330 L386 482 L214 482 L214 330 L186 400 L144 384 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M254 214 L300 300 L346 214" fill="none" stroke="{stroke}" stroke-width="3"/>
    <g fill="{stroke}"><circle cx="300" cy="336" r="4"/><circle cx="300" cy="382" r="4"/><circle cx="300" cy="428" r="4"/></g>`,
  tops: `
    <path d="M226 226 Q300 262 374 226 L436 254 L470 552 L428 558 L398 336 L398 600 L202 600 L202 336 L172 558 L130 552 L164 254 Z" fill="{fill}" stroke="{stroke}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M226 226 Q300 282 374 226" fill="none" stroke="{stroke}" stroke-width="3"/>`,
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export function placeholderSvg(category: string, color: string, variant: 1 | 2 = 1): string {
  const art = (ART[category] ?? ART.tops).replaceAll("{fill}", color).replaceAll("{stroke}", mix(color, "#2A2024", 0.55));
  const [bgA, bgB] = variant === 1 ? ["#FBF6F1", "#F6E3D3"] : ["#FBE7EA", "#F6E3D3"];
  const transform = variant === 1 ? "" : ` transform="translate(-150 -230) scale(1.5)"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient></defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="470" cy="150" r="170" fill="#F4C7CF" opacity="0.28"/>
  <circle cx="120" cy="690" r="130" fill="#FFFFFF" opacity="0.45"/>
  <g${transform}>${art}</g>
  <g fill="#6B1E3A" opacity="0.55"><path d="M96 118 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 z"/><path d="M512 642 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z"/></g>
</svg>`;
}
