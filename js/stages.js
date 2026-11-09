// 6 Complete 16-Bit Pixel-Art Stages with Seamless Scrolling & Animated Foreground Waves
// Uses the high-detail 16-bit pixel art backgrounds + interactive signs & animated water/lava

const STAGES = [
  {
    id: 'city',
    number: 1,
    name: 'Cidade da Baía',
    icon: '🏙️',
    length: 3200,
    skyTop: '#60a5fa',
    waveColor: 'rgba(186, 230, 253, 0.75)',
    foamColor: '#ffffff',
    enemyTypes: ['city_drone', 'street_bot'],
    bossType: 'boss_city',
    bossName: 'MEGA ROBÔ MECHA',
    welcomeTitle: 'WELCOME TO HERO ISLAND',
    welcomeSub: 'Birthplace of Heroes & Unicorns'
  },
  {
    id: 'forest',
    number: 2,
    name: 'Floresta Encantada',
    icon: '🌲',
    length: 3200,
    skyTop: '#10b981',
    waveColor: 'rgba(125, 211, 252, 0.75)',
    foamColor: '#e0f2fe',
    enemyTypes: ['forest_plant', 'city_drone'],
    bossType: 'boss_forest',
    bossName: 'MONSTRO PLANTA GIGANTE',
    welcomeTitle: 'ENCHANTED UNICORN FOREST',
    welcomeSub: 'Magical Woods of Light'
  },
  {
    id: 'snow',
    number: 3,
    name: 'Montanha de Neve',
    icon: '❄️',
    length: 3300,
    skyTop: '#1e3a8a',
    waveColor: 'rgba(224, 242, 254, 0.75)',
    foamColor: '#ffffff',
    enemyTypes: ['snow_yeti', 'city_drone'],
    bossType: 'boss_snow',
    bossName: 'GIGANTE YETI DO GELO',
    welcomeTitle: 'FROSTY ALPINE VILLAGE',
    welcomeSub: 'Glacier Peak Kingdom'
  },
  {
    id: 'volcano',
    number: 4,
    name: 'Vulcão de Magma',
    icon: '🌋',
    length: 3400,
    skyTop: '#450a0a',
    waveColor: 'rgba(253, 224, 71, 0.85)',
    foamColor: '#fef08a',
    enemyTypes: ['lava_golem', 'bridge_knight'],
    bossType: 'boss_volcano',
    bossName: 'DRAGÃO REI DE MAGMA',
    welcomeTitle: 'MOUNT MAGMA CRATER',
    welcomeSub: 'Home of Heatblast'
  },
  {
    id: 'bridge',
    number: 5,
    name: 'Ponte Dourada',
    icon: '🌉',
    length: 3500,
    skyTop: '#4c1d95',
    waveColor: 'rgba(147, 197, 253, 0.7)',
    foamColor: '#dbeafe',
    enemyTypes: ['bridge_knight', 'city_drone'],
    bossType: 'boss_bridge',
    bossName: 'GUARDIÃO DOURADO SUPREMO',
    welcomeTitle: 'GOLDEN SUNSET BRIDGE',
    welcomeSub: 'Bay Crossing Battle'
  },
  {
    id: 'castle',
    number: 6,
    name: 'Castelo Cósmico',
    icon: '🏰',
    length: 3600,
    skyTop: '#090b14',
    waveColor: 'rgba(240, 171, 252, 0.75)',
    foamColor: '#fae8ff',
    enemyTypes: ['bridge_knight', 'lava_golem', 'city_drone'],
    bossType: 'boss_final',
    bossName: 'IMPERADOR VILGAX SUPREMO',
    welcomeTitle: 'COSMIC RAINBOW FORTRESS',
    welcomeSub: 'Final Showdown!'
  }
];

function drawStageEnvironment(ctx, stage, cameraX, canvasWidth, canvasHeight, time) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const pe = window.pixelEngine;
  const bgImg = pe && pe.ready ? pe.stageBgs[stage.id] : null;

  if (bgImg) {
    // Draw the true 16-bit Pixel Art Background tiled seamlessly across the stage!
    const tileW = canvasWidth;
    const tileH = canvasHeight;
    const startTile = Math.floor(cameraX / tileW);
    const endTile = startTile + 2;

    for (let t = startTile; t <= endTile; t++) {
      const drawX = Math.round(t * tileW - cameraX);
      ctx.save();
      if (Math.abs(t) % 2 === 1) {
        // Mirror alternate tiles so edges match 100% seamlessly!
        ctx.translate(drawX + tileW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(bgImg, 0, 0, tileW, tileH);
      } else {
        ctx.drawImage(bgImg, drawX, 0, tileW, tileH);
      }
      ctx.restore();
    }
  } else {
    ctx.fillStyle = stage.skyTop;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Animated 16-Bit Pixel Water / Lava Foam Ripples along the bottom edge (Just like 00:01 & 00:35 in the video!)
  const waterY = canvasHeight - 48;
  for (let row = 0; row < 2; row++) {
    const ry = waterY + row * 20;
    for (let x = -40; x < canvasWidth + 40; x += 16) {
      const worldX = x + cameraX;
      const wave = Math.round(Math.sin(worldX * 0.025 + time * 4.5 + row * 1.8) * 4);
      ctx.fillStyle = row === 0 ? stage.foamColor : stage.waveColor;
      ctx.fillRect(x, ry + wave, 10, 4);
    }
  }

  // Draw the Iconic "WELCOME TO..." Brick & Flowerbed Sign at the start of the stage (Exactly like 00:01 in the video!)
  const signX = Math.round(68 - cameraX);
  if (signX > -260 && signX < canvasWidth + 100) {
    drawPixelWelcomeMonument(ctx, signX, 558, stage);
  }

  ctx.restore();
}

// Recreates the exact "WELCOME TO JERSEY ISLAND" ornate maroon/gold sign + brick flowerbed from 00:01 of the video!
function drawPixelWelcomeMonument(ctx, x, groundY, stage) {
  const w = 178;
  const h = 116;
  const y = groundY - h;

  ctx.save();
  // Green bushes behind the sign
  ctx.fillStyle = '#14532d';
  ctx.fillRect(x - 14, groundY - 46, w + 28, 34);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 10, groundY - 42, w + 20, 24);

  // Outer Dark & Gold Pixel Frame
  window.drawOutlinedRect(ctx, x, y, w, h - 22, 6, '#7f1d1d', '#111827', 4);
  window.drawOutlinedRect(ctx, x + 5, y + 5, w - 10, h - 32, 4, '#881337', '#facc15', 3);

  // Top Crest Emblem (Like the golden crest at the top of the sign in 00:01!)
  window.drawOutlinedRect(ctx, x + w * 0.5 - 24, y - 18, 48, 34, 8, '#991b1b', '#facc15', 3.5);
  window.drawOmnitrixBadge(ctx, x + w * 0.5, y - 1, 11);

  // Sign Text
  ctx.fillStyle = '#fde047';
  ctx.font = '900 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME TO', x + w * 0.5, y + 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px sans-serif';
  ctx.fillText(stage.name.toUpperCase(), x + w * 0.5, y + 50);

  ctx.fillStyle = '#fbcfe8';
  ctx.font = '700 10px sans-serif';
  ctx.fillText(stage.welcomeSub, x + w * 0.5, y + 66);

  // Red Brick Planter Base + Colorful Pixel Flowers at the bottom
  window.drawOutlinedRect(ctx, x - 8, groundY - 26, w + 16, 26, 3, '#9a3412', '#111827', 3.5);
  // Colorful flower dots
  const flowerColors = ['#f43f5e', '#facc15', '#ec4899', '#ffffff', '#38bdf8'];
  for (let fx = x - 2; fx < x + w + 4; fx += 12) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(fx, groundY - 32, 8, 8);
    ctx.fillStyle = flowerColors[Math.abs(fx) % flowerColors.length];
    ctx.fillRect(fx + 1, groundY - 34, 6, 6);
  }

  ctx.restore();
}

window.STAGES = STAGES;
window.drawStageEnvironment = drawStageEnvironment;
