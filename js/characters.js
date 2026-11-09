// Playable Roster: Ben 10 Heroes & Magical Horn-Charging Unicorns (True 16-Bit Pixel Art)

const CHARACTERS = [
  // ================= ROW 1: BEN 10 HEROES =================
  {
    id: 'chama',
    sheetIndex: 0,
    group: 'ben10',
    name: 'Chama',
    subtitle: 'Poder de Fogo',
    attackName: 'Soco Flamejante',
    specialName: 'Bola de Fogo!',
    attackEmoji: '🔥',
    specialEmoji: '☄️',
    speed: 4.6,
    powerType: 'fire',
    primaryColor: '#ef4444',
    secondaryColor: '#facc15',
    height: 156
  },
  {
    id: 'quatrobracos',
    sheetIndex: 1,
    group: 'ben10',
    name: 'Quatro Braços',
    subtitle: 'Super Força',
    attackName: 'Soco Quádruplo',
    specialName: 'Terremoto!',
    attackEmoji: '👊',
    specialEmoji: '💥',
    speed: 4.2,
    powerType: 'smash',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
    height: 168
  },
  {
    id: 'xlr8',
    sheetIndex: 2,
    group: 'ben10',
    name: 'XLR8',
    subtitle: 'Super Velocidade',
    attackName: 'Garra Turbo',
    specialName: 'Turbo Tornado!',
    attackEmoji: '⚡',
    specialEmoji: '🌪️',
    speed: 6.4,
    powerType: 'speed',
    primaryColor: '#0284c7',
    secondaryColor: '#38bdf8',
    height: 152
  },
  {
    id: 'diamante',
    sheetIndex: 3,
    group: 'ben10',
    name: 'Diamante',
    subtitle: 'Cristais Indestrutíveis',
    attackName: 'Lâmina Cristal',
    specialName: 'Chuva de Cristal!',
    attackEmoji: '💎',
    specialEmoji: '🔷',
    speed: 4.4,
    powerType: 'crystal',
    primaryColor: '#06b6d4',
    secondaryColor: '#67e8f9',
    height: 164
  },

  // ================= ROW 2: MAGICAL UNICORNS =================
  {
    id: 'uni_rosa',
    sheetIndex: 4,
    group: 'unicorn',
    name: 'Estrelinha',
    subtitle: 'Unicórnio Rosa Estelar',
    attackName: 'Chifrada Estelar',
    specialName: 'Super Chifrada!',
    attackEmoji: '🦄',
    specialEmoji: '🌟',
    speed: 5.1,
    powerType: 'horn_star',
    primaryColor: '#f472b6',
    secondaryColor: '#fde047',
    height: 158
  },
  {
    id: 'uni_azul',
    sheetIndex: 5,
    group: 'unicorn',
    name: 'Relâmpago',
    subtitle: 'Unicórnio Azul Trovão',
    attackName: 'Chifrada Elétrica',
    specialName: 'Chifrada Trovão!',
    attackEmoji: '🦄',
    specialEmoji: '⚡',
    speed: 5.5,
    powerType: 'horn_lightning',
    primaryColor: '#38bdf8',
    secondaryColor: '#fef08a',
    height: 158
  },
  {
    id: 'uni_dourado',
    sheetIndex: 6,
    group: 'unicorn',
    name: 'Solzinho',
    subtitle: 'Unicórnio Dourado Solar',
    attackName: 'Chifrada Solar',
    specialName: 'Chifrada de Fogo!',
    attackEmoji: '🦄',
    specialEmoji: '☀️',
    speed: 5.0,
    powerType: 'horn_sun',
    primaryColor: '#fbbf24',
    secondaryColor: '#f97316',
    height: 158
  },
  {
    id: 'uni_roxo',
    sheetIndex: 7,
    group: 'unicorn',
    name: 'Íris Arco-Íris',
    subtitle: 'Unicórnio Roxo Mágico',
    attackName: 'Chifrada Prisma',
    specialName: 'Raio Arco-Íris!',
    attackEmoji: '🦄',
    specialEmoji: '🌈',
    speed: 5.2,
    powerType: 'horn_rainbow',
    primaryColor: '#a855f7',
    secondaryColor: '#f472b6',
    height: 158
  }
];

function drawOutlinedRect(ctx, x, y, w, h, r, fill, stroke = '#111111', lineWidth = 3.5) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawOmnitrixBadge(ctx, cx, cy, radius = 9) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#111111';
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.65, cy - radius * 0.65);
  ctx.lineTo(cx + radius * 0.65, cy - radius * 0.65);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.65, cy + radius * 0.65);
  ctx.lineTo(cx + radius * 0.65, cy + radius * 0.65);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCharacterSprite(ctx, charData, state) {
  const {
    x = 0,
    y = 0,
    z = 0,
    facing = 1,
    animTime = 0,
    action = 'idle',
    scale = 1
  } = state;

  const pe = window.pixelEngine;
  const spriteObj = pe && pe.ready ? pe.heroSprites[charData.sheetIndex] : null;

  if (spriteObj) {
    pe.drawAnimatedPixelSprite(ctx, spriteObj, {
      x,
      y,
      z,
      facing,
      targetHeight: (charData.height || 156) * scale,
      animTime,
      action,
      hitFlash: false,
      accentColor: charData.secondaryColor,
      isUnicorn: charData.group === 'unicorn'
    });
  }
}

// Render True 16-Bit Pixel Portrait for HUD & Menu Cards
function drawCharacterPortrait(ctx, charData, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, charData.primaryColor);
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const pe = window.pixelEngine;
  const spriteObj = pe && pe.ready ? pe.heroSprites[charData.sheetIndex] : null;

  if (spriteObj && spriteObj.canvas) {
    // Crop upper 58% of sprite (Head & Shoulders) for an authentic arcade portrait!
    const srcW = spriteObj.width;
    const srcH = Math.floor(spriteObj.height * 0.58);
    const pad = 4;
    ctx.drawImage(
      spriteObj.canvas,
      0, 0, srcW, srcH,
      pad, pad, width - pad * 2, height - pad * 2
    );
  }
}

// Close-Up 16-Bit Transformation Cutscene Box (Inspired directly by 00:16-00:33 in the video!)
function drawTransformationShowcase(ctx, charData, timer, maxTimer, canvasWidth, canvasHeight) {
  const pe = window.pixelEngine;
  const spriteObj = pe && pe.ready ? pe.heroSprites[charData.sheetIndex] : null;
  if (!spriteObj) return;

  const boxW = 310;
  const boxH = 340;
  const bx = canvasWidth * 0.5 - boxW * 0.5;
  const by = canvasHeight * 0.45 - boxH * 0.5;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Tiled Room Backdrop (Like the white/blue grid tile wall in the video's transformation scene!)
  drawOutlinedRect(ctx, bx, by, boxW, boxH, 16, '#e2e8f0', '#111827', 6);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx + 4, by + 4, boxW - 8, boxH - 8, 12);
  ctx.clip();

  // Tile grid lines
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let gx = bx; gx < bx + boxW; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, by);
    ctx.lineTo(gx, by + boxH);
    ctx.stroke();
  }
  for (let gy = by; gy < by + boxH; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(bx, gy);
    ctx.lineTo(bx + boxW, gy);
    ctx.stroke();
  }

  // Floor shadow strip
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx, by + boxH - 54, boxW, 54);

  // 2. Zoomed-In 16-Bit Hero Sprite (Grows bigger with muscle/power surge!)
  const progress = 1 - timer / maxTimer;
  const scalePulse = progress < 0.5 ? 0.92 + Math.sin(progress * 30) * 0.08 : 1.08;
  const targetH = 245 * scalePulse;
  const targetW = (spriteObj.width / spriteObj.height) * targetH;

  const cx = bx + boxW * 0.5;
  const cy = by + boxH - 28;

  // Floor shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, targetW * 0.42, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(
    spriteObj.canvas,
    cx - targetW * 0.5,
    cy - targetH,
    targetW,
    targetH
  );

  // 3. Crackling 16-Bit Blue/Green Lightning Bolts over the Hero (First half of cutscene, like 00:29!)
  if (progress < 0.65) {
    const boltColor = charData.group === 'ben10' ? '#38bdf8' : '#f472b6';
    for (let b = 0; b < 5; b++) {
      let lx = cx - 85 + Math.random() * 170;
      let ly = cy - 220 + Math.random() * 40;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      for (let seg = 0; seg < 4; seg++) {
        lx += (Math.random() - 0.5) * 55;
        ly += 42;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();

      ctx.strokeStyle = boltColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else {
    // 4. Second half: Celebratory Thumbs-Up / Wink Badge (Like 00:33 in the video!)
    drawOutlinedRect(ctx, bx + boxW - 86, by + 24, 68, 68, 16, '#fde047', '#111827', 4);
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👍', bx + boxW - 52, by + 72);
  }

  ctx.restore();

  // Top Banner Title on Cutscene Box
  drawOutlinedRect(ctx, bx + 20, by - 22, boxW - 40, 42, 10, '#16a34a', '#111827', 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${charData.name.toUpperCase()} PRONTO!`, cx, by + 5);

  ctx.restore();
}

window.CHARACTERS = CHARACTERS;
window.drawCharacterSprite = drawCharacterSprite;
window.drawCharacterPortrait = drawCharacterPortrait;
window.drawTransformationShowcase = drawTransformationShowcase;
window.drawOmnitrixBadge = drawOmnitrixBadge;
window.drawOutlinedRect = drawOutlinedRect;
