const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
  const inputSvg = path.join(__dirname, '../public/favicon.svg');
  const publicDir = path.join(__dirname, '../public');

  // Read the SVG file
  const svgBuffer = await fs.readFile(inputSvg);

  // Generate different sizes
  const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon.ico': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512
  };

  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(path.join(publicDir, filename));
    
    console.log(`Generated ${filename}`);
  }
}

generateFavicons().catch(console.error); 