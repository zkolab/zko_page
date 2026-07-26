const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const logoSource = fs.readFileSync(path.join(root, 'ZKO_logo_vector.svg'), 'utf8');
const qrSource = fs.readFileSync(path.join(root, 'assets/packaging/zko-homepage-qr.svg'), 'utf8');
const logoPath = logoSource.match(/<path\s+d="([^"]+)"[^>]*fill-rule="evenodd"\s*\/>/s)?.[1];

if (!logoPath) {
  throw new Error('Unable to extract ZKO logo path');
}

const qrData = Buffer.from(qrSource).toString('base64');
const homepage = 'https://shenqiqishi.github.io/zko_page/';
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2400" height="1440" viewBox="0 0 2400 1440" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">ZKO Logo packaging sticker</title>
  <desc id="desc">苍虬 AI 编程手柄包装贴纸，主页 ${homepage}</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#05090B"/>
      <stop offset="0.64" stop-color="#101C20"/>
      <stop offset="1" stop-color="#071015"/>
    </linearGradient>
    <radialGradient id="glow" cx="1" cy="0">
      <stop stop-color="#1DE2EF" stop-opacity=".28"/>
      <stop offset=".52" stop-color="#1DE2EF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="2400" height="1440" rx="72" fill="url(#bg)"/>
  <rect width="2400" height="1440" rx="72" fill="url(#glow)"/>
  <circle cx="2180" cy="1420" r="570" fill="none" stroke="#2FE4ED" stroke-opacity=".16" stroke-width="8"/>
  <circle cx="2180" cy="1420" r="480" fill="none" stroke="#2FE4ED" stroke-opacity=".08" stroke-width="4"/>
  <g transform="translate(150 242) scale(1.12)" fill="#F7FBFC">
    <path d="${logoPath}" fill-rule="evenodd"/>
  </g>
  <text x="150" y="930" fill="#FFFFFF" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="126" font-weight="700">苍虬 AI 编程手柄</text>
  <text x="154" y="1055" fill="#8FEAF0" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="64" font-weight="600" letter-spacing="8">把 AI 工作流握在手里</text>
  <rect x="1672" y="250" width="560" height="560" rx="18" fill="#FFFFFF"/>
  <image x="1714" y="292" width="476" height="476" href="data:image/svg+xml;base64,${qrData}"/>
  <text x="1952" y="920" text-anchor="middle" fill="#FFFFFF" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="58" font-weight="700" letter-spacing="8">扫码访问官网</text>
  <text x="1952" y="1005" text-anchor="middle" fill="#79DCE3" font-family="Arial, sans-serif" font-size="64" font-weight="600">
    <tspan x="1952" textLength="520" lengthAdjust="spacingAndGlyphs">shenqiqishi.github.io</tspan>
    <tspan x="1952" dy="78">/zko_page</tspan>
  </text>
</svg>`;

const packagingDir = path.join(root, 'assets/packaging');
const svgPath = path.join(packagingDir, 'zko-packaging-sticker.svg');
const pngPath = path.join(packagingDir, 'zko-packaging-sticker.png');
const logoPngPath = path.join(root, 'ZKO_logo_vector.png');

fs.mkdirSync(packagingDir, { recursive: true });
fs.writeFileSync(svgPath, svg);

Promise.all([
  sharp(Buffer.from(svg)).png().toFile(pngPath),
  sharp(Buffer.from(logoSource)).png().toFile(logoPngPath),
]).then(() => console.log(`${svgPath}\n${pngPath}\n${logoPngPath}`));
