// Run with NODE_PATH pointing to a temporary @resvg/resvg-js installation.
// SVG sources are original Runway geometry; fonts are self-hosted under public/fonts.
const { Resvg } = require("@resvg/resvg-js");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve("apps/web/public");
const mark =
  '<g fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M7 27 13 8M25 27 19 8M10 21h12M12 15h8"/></g><circle cx="16" cy="4" r="1.75" fill="currentColor"/>';
function icon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#20261f"/><g transform="translate(27 24) scale(1.45)" color="#f7f8f4">${mark}</g></svg>`;
}
const options = {
  font: {
    fontFiles: [
      process.env.RUNWAY_BRAND_FONT ||
        "/tmp/runway-fonts/public-sans-latin-600-normal.ttf",
    ],
    loadSystemFonts: false,
    defaultFontFamily: "Public Sans",
  },
};
function render(svg) {
  return new Resvg(svg, options).render().asPng();
}
for (const [file, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
])
  fs.writeFileSync(path.join(root, file), render(icon(size)));
const pngs = [16, 32, 48].map((size) => ({ size, data: render(icon(size)) }));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach(({ size, data }, i) => {
  const p = 6 + i * 16;
  header[p] = size;
  header[p + 1] = size;
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(data.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += data.length;
});
fs.writeFileSync(
  path.join(root, "favicon.ico"),
  Buffer.concat([header, ...pngs.map((p) => p.data)]),
);
const wordmark =
  '<text x="0" y="34" fill="#20261f" font-family="Public Sans" font-weight="600" font-size="38" letter-spacing="-2">Runway</text>';
for (const [file, svg] of [
  [
    "runway-wordmark.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="44">${wordmark}</svg>`,
  ],
  [
    "runway-lockup.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="198" height="44"><g transform="translate(0 5)" color="#20261f">${mark}</g><g transform="translate(44 0)">${wordmark}</g></svg>`,
  ],
]) {
  const resvg = new Resvg(svg, options);
  fs.writeFileSync(path.join(root, "brand", file), resvg.toString());
}
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f7f8f4"/><g transform="translate(80 60) scale(1.6)" color="#20261f">${mark}</g><text x="152" y="107" font-family="Public Sans" font-size="48" font-weight="600" fill="#20261f">Runway</text><text x="80" y="295" font-family="Public Sans" font-size="64" font-weight="600" fill="#20261f">Your client says Friday.</text><text x="80" y="380" font-family="Public Sans" font-size="64" font-weight="600" fill="#245b43">Your history says Tuesday.</text><text x="80" y="500" font-family="Public Sans" font-size="28" fill="#596356">Plan around the next payment.</text><line x1="80" y1="550" x2="1120" y2="550" stroke="#d8ded3"/></svg>`;
fs.writeFileSync(path.join(root, "brand/runway-social.png"), render(social));
console.log(
  "Exported original SVG lockups, PNG shortcut icons, social cover, and layered ICO.",
);
