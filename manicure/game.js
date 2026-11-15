// Salão de Manicure Kids - Motor Anatômico 2D, Pintura Real por Unha & Física de Partículas
(() => {
  const Tools = window.ManicureTools;
  const Audio = window.ManicureAudio;

  const canvas = document.getElementById('manicure-canvas');
  const ctx = canvas.getContext('2d');

  // ================== ESTADO GLOBAL ==================
  let activeMenuTab = 'care'; // 'care' | 'polish' | 'art' | 'style'
  let activeToolId = 'sponge';
  let activePolish = Tools.POLISH_COLORS[0];
  let activeGlitter = Tools.GLITTER_OPTIONS[2];
  let activeSticker = Tools.STICKERS[0];
  let activeSkinTone = Tools.SKIN_TONES[0];
  let activeNailShape = 'round'; // 'round' | 'square' | 'almond'
  let activeRing = '💍'; // '' or emoji
  let handSide = 'left'; // 'left' | 'right'

  let rainbowHue = 0;
  let canvasW = 800;
  let canvasH = 600;
  let dpr = 1;

  // Pointer tracking for smooth brush interpolation & tool animation
  const ptr = {
    x: -999,
    y: -999,
    prevX: -999,
    prevY: -999,
    isDown: false,
    visible: false,
    moveAngle: 0,
    moveSpeed: 0,
    clipAnim: 0,
    pressAnim: 0,
    activeId: null
  };

  let particles = [];
  let flashOpacity = 0;

  // Definição anatômica dos 5 dedos relativa ao centro da mão
  const FINGER_SPECS = [
    { name: 'Polegar', baseX: -0.34, baseY: 0.25, tipX: -0.49, tipY: 0.03, width: 0.118, angle: -0.62, nailW: 0.095, nailH: 0.125 },
    { name: 'Indicador', baseX: -0.17, baseY: -0.02, tipX: -0.23, tipY: -0.37, width: 0.105, angle: -0.16, nailW: 0.088, nailH: 0.132 },
    { name: 'Médio', baseX: -0.02, baseY: -0.05, tipX: -0.02, tipY: -0.43, width: 0.11, angle: 0.0, nailW: 0.092, nailH: 0.138 },
    { name: 'Anelar', baseX: 0.13, baseY: -0.01, tipX: 0.17, tipY: -0.37, width: 0.103, angle: 0.12, nailW: 0.086, nailH: 0.13 },
    { name: 'Mindinho', baseX: 0.27, baseY: 0.05, tipX: 0.36, tipY: -0.24, width: 0.092, angle: 0.28, nailW: 0.076, nailH: 0.112 }
  ];

  // Estado das 5 unhas
  let nails = [];

  function createNailState(idx) {
    const paintCanvas = document.createElement('canvas');
    paintCanvas.width = 180;
    paintCanvas.height = 240;
    const paintCtx = paintCanvas.getContext('2d');

    const glitterCanvas = document.createElement('canvas');
    glitterCanvas.width = 180;
    glitterCanvas.height = 240;
    const glitterCtx = glitterCanvas.getContext('2d');

    // Manchinhas de poeira determinísticas por unha
    const spots = [];
    for (let s = 0; s < 5; s++) {
      spots.push({
        u: (Math.random() - 0.5) * 0.58,
        v: (Math.random() - 0.5) * 0.62,
        r: 0.06 + Math.random() * 0.06
      });
    }

    return {
      index: idx,
      dirtyLevel: 0.85,      // 0..1 (limpar com esponja)
      excessLength: 0.28,    // 0..0.32 (cortar com cortador)
      roughness: 0.8,        // 0..1 (alisar com lixa)
      cuticle: 0.85,         // 0..1 (cuidar com espátula)
      hydration: 0.15,       // 0..1 (hidratar com creme)
      topCoat: 0.15,         // 0..1 (secar/brilho com secador)
      spots,
      stickers: [],          // { u, v, icon, size, rot }
      creamDrops: [],        // { u, v, alpha, r }
      paintCanvas,
      paintCtx,
      glitterCanvas,
      glitterCtx,
      screenGeo: null        // calculado a cada frame/resize: { cx, cy, w, h, angle }
    };
  }

  function resetAllNails(makeMessy = true) {
    nails = FINGER_SPECS.map((_, idx) => {
      const n = createNailState(idx);
      if (!makeMessy) {
        n.dirtyLevel = 0;
        n.excessLength = 0;
        n.roughness = 0;
        n.cuticle = 0;
        n.hydration = 1;
      }
      return n;
    });
    particles = [];
  }

  // ================== RESIZE E COORDENADAS DA MÃO ==================
  function resizeCanvas() {
    const stage = document.getElementById('hand-stage');
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasW = Math.max(280, rect.width);
    canvasH = Math.max(260, rect.height);
    canvas.width = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getHandLayout() {
    const scale = Math.min(canvasW * 0.94, canvasH * 0.98);
    const centerX = canvasW * 0.5;
    const centerY = canvasH * 0.62;
    const mirror = handSide === 'right' ? -1 : 1;
    return { scale, centerX, centerY, mirror };
  }

  // Converte ponto da tela para coordenadas normalizadas da unha (-0.5..+0.5)
  function screenToNailLocal(nail, sx, sy) {
    const g = nail.screenGeo;
    if (!g) return null;
    const dx = sx - g.cx;
    const dy = sy - g.cy;
    const cos = Math.cos(-g.angle);
    const sin = Math.sin(-g.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return {
      u: lx / g.w,
      v: ly / g.h,
      lx,
      ly
    };
  }

  function isInsideNailLocal(u, v, margin = 0.04) {
    return Math.abs(u) <= 0.52 + margin && v >= -0.84 - margin && v <= 0.54 + margin;
  }

  function nailLocalToCanvas(nail, u, v) {
    const W = nail.paintCanvas.width;
    const H = nail.paintCanvas.height;
    return {
      cx: (u + 0.5) * W,
      cy: ((v + 0.86) / 1.36) * H
    };
  }

  function findNailUnderPointer(sx, sy, margin = 0.08) {
    for (let i = 0; i < nails.length; i++) {
      const loc = screenToNailLocal(nails[i], sx, sy);
      if (loc && isInsideNailLocal(loc.u, loc.v, margin)) {
        return { nail: nails[i], loc };
      }
    }
    return null;
  }

  // ================== PARTÍCULAS E FÍSICA ==================
  function spawnSoapBubble(x, y) {
    particles.push({
      type: 'bubble',
      x: x + (Math.random() - 0.5) * 26,
      y: y + (Math.random() - 0.5) * 18,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.7 - Math.random() * 1.1,
      r: 4 + Math.random() * 7,
      life: 1,
      decay: 0.025
    });
  }

  function spawnDustGrain(x, y) {
    particles.push({
      type: 'dust',
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 1.4,
      vy: 0.4 + Math.random() * 1.2,
      r: 1.5 + Math.random() * 2,
      life: 1,
      decay: 0.035
    });
  }

  function spawnNailClipping(x, y, w) {
    particles.push({
      type: 'clip',
      x,
      y,
      vx: (Math.random() - 0.5) * 3.5,
      vy: -3.2 - Math.random() * 2.2,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.28,
      w: w * 0.72,
      life: 1,
      decay: 0.02
    });
  }

  function spawnSparkle(x, y, color = '#fef08a') {
    particles.push({
      type: 'sparkle',
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -0.6 - Math.random() * 1.0,
      r: 4 + Math.random() * 6,
      color,
      life: 1,
      decay: 0.028
    });
  }

  // ================== APLICAÇÃO DAS FERRAMENTAS NAS UNHAS ==================
  function paintStrokeOnNail(nail, fromU, fromV, toU, toV, colorHex, radiusPx, isFrench = false) {
    const pc = nail.paintCtx;
    const W = nail.paintCanvas.width;
    const H = nail.paintCanvas.height;

    const p1 = nailLocalToCanvas(nail, fromU, fromV);
    const p2 = nailLocalToCanvas(nail, toU, toV);

    pc.save();
    pc.lineCap = 'round';
    pc.lineJoin = 'round';
    pc.strokeStyle = colorHex;
    pc.fillStyle = colorHex;
    pc.lineWidth = radiusPx * 2;

    if (isFrench) {
      // Limita pintura da francesinha à ponta real atual da unha
      const tipBoundaryY = nailLocalToCanvas(nail, 0, -0.24 - nail.excessLength).cy;
      pc.beginPath();
      pc.rect(0, 0, W, Math.max(24, tipBoundaryY));
      pc.clip();
    }

    pc.beginPath();
    pc.moveTo(p1.cx, p1.cy);
    pc.lineTo(p2.cx, p2.cy);
    pc.stroke();

    pc.beginPath();
    pc.arc(p2.cx, p2.cy, radiusPx, 0, Math.PI * 2);
    pc.fill();
    pc.restore();
  }

  function sprinkleGlitterOnNail(nail, u, v, colors) {
    const gc = nail.glitterCtx;
    const { cx, cy } = nailLocalToCanvas(nail, u, v);

    for (let i = 0; i < 6; i++) {
      const gx = cx + (Math.random() - 0.5) * 34;
      const gy = cy + (Math.random() - 0.5) * 34;
      const r = 1.6 + Math.random() * 3.4;
      gc.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      gc.beginPath();
      if (Math.random() > 0.35) {
        gc.arc(gx, gy, r, 0, Math.PI * 2);
      } else {
        // Losango estrelinha
        gc.moveTo(gx, gy - r * 1.4);
        gc.lineTo(gx + r * 1.2, gy);
        gc.lineTo(gx, gy + r * 1.4);
        gc.lineTo(gx - r * 1.2, gy);
        gc.closePath();
      }
      gc.fill();
    }
  }

  function wipeNailLayers(nail, u, v, radiusPx = 28) {
    const { cx, cy } = nailLocalToCanvas(nail, u, v);

    [nail.paintCtx, nail.glitterCtx].forEach(c => {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });

    // Remove adesivos tocados pelo algodão
    nail.stickers = nail.stickers.filter(st => Math.hypot(st.u - u, st.v - v) > 0.24);
  }

  function applyToolAtPoint(sx, sy, prevSx, prevSy, isTap = false) {
    const found = findNailUnderPointer(sx, sy, activeToolId === 'cream' ? 0.24 : 0.11);
    if (!found) return;
    const { nail, loc } = found;
    const distMoved = Math.hypot(sx - prevSx, sy - prevSy);

    if (activeToolId === 'sponge') {
      if (isTap || distMoved > 2) {
        nail.dirtyLevel = Math.max(0, nail.dirtyLevel - 0.055);
        Audio.playSoapScrub();
        if (Math.random() > 0.35) spawnSoapBubble(sx, sy);
      }
    } else if (activeToolId === 'clipper') {
      if (isTap) {
        ptr.clipAnim = 1;
        Audio.playClipperSnip();
        if (nail.excessLength > 0.02) {
          nail.excessLength = Math.max(0, nail.excessLength - 0.14);
          spawnNailClipping(sx, sy, nail.screenGeo.w);
          spawnSparkle(sx, sy, '#ffffff');
        }
      }
    } else if (activeToolId === 'file') {
      if (distMoved > 2 && loc.v < 0.05) {
        nail.roughness = Math.max(0, nail.roughness - 0.065);
        nail.excessLength = Math.max(0, nail.excessLength - 0.008);
        Audio.playFileScrape();
        if (Math.random() > 0.3) spawnDustGrain(sx, sy);
      }
    } else if (activeToolId === 'cream') {
      if (isTap || distMoved > 3) {
        nail.hydration = Math.min(1, nail.hydration + 0.07);
        nail.cuticle = Math.max(0, nail.cuticle - 0.03);
        Audio.playCreamMassage();
        if (nail.creamDrops.length < 14 && Math.random() > 0.45) {
          nail.creamDrops.push({ u: loc.u, v: loc.v, alpha: 0.9, r: 0.06 + Math.random() * 0.05 });
        }
      }
    } else if (activeToolId === 'pusher') {
      if (isTap || (distMoved > 2 && loc.v > 0.08)) {
        nail.cuticle = Math.max(0, nail.cuticle - 0.08);
        Audio.playCreamMassage();
        if (Math.random() > 0.55) spawnSparkle(sx, sy, '#fbcfe8');
      }
    } else if (activeToolId === 'remover') {
      if (isTap || distMoved > 1.5) {
        wipeNailLayers(nail, loc.u, loc.v, 28);
        Audio.playCottonWipe();
      }
    } else if (activeToolId === 'polish' || activeToolId === 'french') {
      if (isTap || distMoved > 1.5) {
        const prevLoc = screenToNailLocal(nail, prevSx, prevSy) || loc;
        let hex = activePolish.hex;
        if (hex === 'rainbow') {
          rainbowHue = (rainbowHue + 10) % 360;
          hex = `hsl(${rainbowHue}, 88%, 56%)`;
        }
        paintStrokeOnNail(
          nail,
          prevLoc.u,
          prevLoc.v,
          loc.u,
          loc.v,
          hex,
          activeToolId === 'french' ? 22 : 24,
          activeToolId === 'french'
        );
        Audio.playBrushStroke();
      }
    } else if (activeToolId === 'dots') {
      if (isTap) {
        let hex = activePolish.hex;
        if (hex === 'rainbow') {
          rainbowHue = (rainbowHue + 40) % 360;
          hex = `hsl(${rainbowHue}, 88%, 56%)`;
        }
        paintStrokeOnNail(nail, loc.u, loc.v, loc.u, loc.v, hex, 15, false);
        Audio.playStickerPlace();
        spawnSparkle(sx, sy, hex);
      }
    } else if (activeToolId === 'glitter') {
      if (isTap || distMoved > 2) {
        sprinkleGlitterOnNail(nail, loc.u, loc.v, activeGlitter.colors);
        Audio.playGlitterSparkle();
        if (Math.random() > 0.5) spawnSparkle(sx, sy, activeGlitter.colors[0]);
      }
    } else if (activeToolId === 'sticker') {
      if (isTap && isInsideNailLocal(loc.u, loc.v, -0.02)) {
        nail.stickers.push({
          u: Math.max(-0.34, Math.min(0.34, loc.u)),
          v: Math.max(-0.36, Math.min(0.36, loc.v)),
          icon: activeSticker.icon,
          size: 0.34,
          rot: (Math.random() - 0.5) * 0.25
        });
        Audio.playStickerPlace();
        for (let k = 0; k < 5; k++) spawnSparkle(sx, sy, '#fef08a');
      }
    } else if (activeToolId === 'dryer') {
      nail.topCoat = Math.min(1, nail.topCoat + 0.04);
      Audio.playDryerBreeze();
      if (Math.random() > 0.35) spawnSparkle(sx, sy, '#bae6fd');
    }
  }

  // ================== DESENHO DA MÃO, UNHAS E PARTÍCULAS ==================
  function traceNailShapePath(context, w, h, excess, shape, roughness) {
    const topY = -h * (0.5 + excess);
    const botY = h * 0.5;
    const hw = w * 0.5;

    context.beginPath();
    if (shape === 'square') {
      const r = w * 0.14;
      context.moveTo(-hw, botY - h * 0.14);
      context.lineTo(-hw, topY + r);
      context.quadraticCurveTo(-hw, topY, -hw + r, topY);
      if (roughness > 0.2) {
        // Borda serrilhada leve antes de lixar
        const teeth = 5;
        for (let t = 1; t < teeth; t++) {
          const tx = -hw + r + ((w - r * 2) * t) / teeth;
          const ty = topY + (t % 2 === 0 ? -roughness * 3.5 : roughness * 3.5);
          context.lineTo(tx, ty);
        }
      }
      context.lineTo(hw - r, topY);
      context.quadraticCurveTo(hw, topY, hw, topY + r);
      context.lineTo(hw, botY - h * 0.14);
      context.quadraticCurveTo(0, botY + h * 0.1, -hw, botY - h * 0.14);
    } else if (shape === 'almond') {
      context.moveTo(-hw, botY - h * 0.15);
      context.quadraticCurveTo(-hw * 0.95, 0, 0, topY - h * 0.08);
      context.quadraticCurveTo(hw * 0.95, 0, hw, botY - h * 0.15);
      context.quadraticCurveTo(0, botY + h * 0.1, -hw, botY - h * 0.15);
    } else {
      // Clássica arredondada
      context.moveTo(-hw, botY - h * 0.14);
      context.lineTo(-hw, topY + hw * 0.95);
      context.quadraticCurveTo(-hw, topY, 0, topY + (roughness > 0.25 ? roughness * 4 : 0));
      context.quadraticCurveTo(hw, topY, hw, topY + hw * 0.95);
      context.lineTo(hw, botY - h * 0.14);
      context.quadraticCurveTo(0, botY + h * 0.1, -hw, botY - h * 0.14);
    }
    context.closePath();
  }

  function drawPillowAndBackground() {
    // Mesa pastel de salão
    const bgGrad = ctx.createRadialGradient(canvasW * 0.5, canvasH * 0.4, 20, canvasW * 0.5, canvasH * 0.5, Math.max(canvasW, canvasH) * 0.75);
    bgGrad.addColorStop(0, '#fff1f2');
    bgGrad.addColorStop(0.55, '#fce7f3');
    bgGrad.addColorStop(1, '#fbcfe8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Almofada fofinha de manicure na base
    const { scale, centerX, centerY } = getHandLayout();
    ctx.save();
    ctx.translate(centerX, centerY + scale * 0.25);
    ctx.fillStyle = 'rgba(190, 24, 93, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 18, scale * 0.42, scale * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    const pillowGrad = ctx.createLinearGradient(0, -scale * 0.16, 0, scale * 0.2);
    pillowGrad.addColorStop(0, '#ffffff');
    pillowGrad.addColorStop(1, '#f3e8ff');
    ctx.fillStyle = pillowGrad;
    ctx.strokeStyle = '#e9d5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 0.4, scale * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawHandAndNails() {
    const { scale, centerX, centerY, mirror } = getHandLayout();
    const skin = activeSkinTone;

    // 1. Antebraço + Palma da Mão
    ctx.save();
    ctx.translate(centerX, centerY);

    // Sombra suave da mão
    ctx.fillStyle = 'rgba(131, 24, 67, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, scale * 0.12, scale * 0.28, scale * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pulso / Antebraço
    const wristGrad = ctx.createLinearGradient(-scale * 0.16, 0, scale * 0.16, 0);
    wristGrad.addColorStop(0, skin.shadow);
    wristGrad.addColorStop(0.35, skin.base);
    wristGrad.addColorStop(0.65, skin.highlight);
    wristGrad.addColorStop(1, skin.shadow);
    ctx.fillStyle = wristGrad;
    ctx.beginPath();
    ctx.moveTo(-scale * 0.15 * mirror, scale * 0.2);
    ctx.lineTo(-scale * 0.18 * mirror, scale * 0.6);
    ctx.lineTo(scale * 0.18 * mirror, scale * 0.6);
    ctx.lineTo(scale * 0.16 * mirror, scale * 0.2);
    ctx.closePath();
    ctx.fill();

    // Palma arredondada
    const palmGrad = ctx.createRadialGradient(-scale * 0.04 * mirror, scale * 0.08, scale * 0.03, 0, scale * 0.14, scale * 0.29);
    palmGrad.addColorStop(0, skin.highlight);
    palmGrad.addColorStop(0.65, skin.base);
    palmGrad.addColorStop(1, skin.shadow);
    ctx.fillStyle = palmGrad;
    ctx.beginPath();
    ctx.ellipse(0, scale * 0.14, scale * 0.24, scale * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Desenha cada um dos 5 dedos + unhas
    FINGER_SPECS.forEach((spec, idx) => {
      const bx = spec.baseX * mirror * scale;
      const by = spec.baseY * scale;
      const tx = spec.tipX * mirror * scale;
      const ty = spec.tipY * scale;
      const fw = spec.width * scale;
      const dx = tx - bx;
      const dy = ty - by;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) + Math.PI * 0.5;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(angle);

      // Dedo anatômico cilíndrico com pontinha arredondada
      const fGrad = ctx.createLinearGradient(-fw * 0.5, 0, fw * 0.5, 0);
      fGrad.addColorStop(0, skin.shadow);
      fGrad.addColorStop(0.28, skin.base);
      fGrad.addColorStop(0.58, skin.highlight);
      fGrad.addColorStop(1, skin.shadow);

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.moveTo(-fw * 0.54, 16);
      ctx.lineTo(-fw * 0.48, -len * 0.86);
      ctx.quadraticCurveTo(-fw * 0.46, -len - fw * 0.18, 0, -len - fw * 0.2);
      ctx.quadraticCurveTo(fw * 0.46, -len - fw * 0.18, fw * 0.48, -len * 0.86);
      ctx.lineTo(fw * 0.54, 16);
      ctx.closePath();
      ctx.fill();

      // Dobrinhas sutis das articulações
      ctx.strokeStyle = skin.shadow;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-fw * 0.26, -len * 0.38);
      ctx.quadraticCurveTo(0, -len * 0.35, fw * 0.26, -len * 0.38);
      ctx.moveTo(-fw * 0.22, -len * 0.64);
      ctx.quadraticCurveTo(0, -len * 0.62, fw * 0.22, -len * 0.64);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Anel bonito no dedo anelar (idx === 3)
      if (idx === 3 && activeRing) {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        const rx = -fw * 0.52;
        const ry = -len * 0.32;
        const rw = fw * 1.04;
        const rh = 11;
        const rr = 5;
        ctx.beginPath();
        ctx.moveTo(rx + rr, ry);
        ctx.lineTo(rx + rw - rr, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
        ctx.lineTo(rx + rw, ry + rh - rr);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
        ctx.lineTo(rx + rr, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
        ctx.lineTo(rx, ry + rr);
        ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.font = `${Math.round(fw * 0.56)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeRing, 0, -len * 0.32 + 4);
      }

      // 3. Unha deste dedo
      const nail = nails[idx];
      const nw = spec.nailW * scale;
      const nh = spec.nailH * scale;
      const nailCenterY = -len + nh * 0.24;

      // Registra posição e ângulo em coordenadas de tela para detecção precisa do toque
      const worldCos = Math.cos(angle);
      const worldSin = Math.sin(angle);
      const screenCx = centerX + bx + (0 * worldCos - nailCenterY * worldSin);
      const screenCy = centerY + by + (0 * worldSin + nailCenterY * worldCos);
      nail.screenGeo = { cx: screenCx, cy: screenCy, w: nw, h: nh, angle };

      ctx.save();
      ctx.translate(0, nailCenterY);

      // Leito natural da unha + ponta branquinha se crescida
      traceNailShapePath(ctx, nw, nh, nail.excessLength, activeNailShape, nail.roughness);
      ctx.save();
      ctx.clip();

      const bedGrad = ctx.createLinearGradient(0, -nh * 0.6, 0, nh * 0.5);
      bedGrad.addColorStop(0, '#fff7ed');
      bedGrad.addColorStop(0.26, skin.nailBed);
      bedGrad.addColorStop(1, skin.nailBed);
      ctx.fillStyle = bedGrad;
      ctx.fillRect(-nw, -nh, nw * 2, nh * 2);

      // Lúnula suave (meia-lua na base)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
      ctx.beginPath();
      ctx.ellipse(0, nh * 0.45, nw * 0.32, nh * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Camada de Esmalte Pintada pelo Dedo
      ctx.drawImage(nail.paintCanvas, -nw * 0.5, -nh * 0.86, nw, nh * 1.36);

      // Camada de Glitter Pintada pelo Dedo
      ctx.drawImage(nail.glitterCanvas, -nw * 0.5, -nh * 0.86, nw, nh * 1.36);

      // Adesivos e Pedrinhas Coladas
      nail.stickers.forEach(st => {
        ctx.save();
        ctx.translate(st.u * nw, st.v * nh);
        ctx.rotate(st.rot);
        ctx.font = `${Math.round(nw * st.size)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.icon, 0, 0);
        ctx.restore();
      });

      // Sujeira lúdica inicial (desaparece com a esponja)
      if (nail.dirtyLevel > 0.02) {
        ctx.fillStyle = `rgba(120, 82, 54, ${0.42 * nail.dirtyLevel})`;
        nail.spots.forEach(sp => {
          ctx.beginPath();
          ctx.arc(sp.u * nw, sp.v * nh, sp.r * nw, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Reflexo vítreo / extra brilho do secador
      const glossOpacity = 0.22 + nail.topCoat * 0.45;
      ctx.fillStyle = `rgba(255, 255, 255, ${glossOpacity})`;
      ctx.beginPath();
      ctx.ellipse(-nw * 0.22, -nh * 0.1, nw * 0.11, nh * 0.3, -0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Contorno natural da unha
      traceNailShapePath(ctx, nw, nh, nail.excessLength, activeNailShape, nail.roughness);
      ctx.strokeStyle = skin.shadow;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Cutícula na base (diminui com a espátula)
      if (nail.cuticle > 0.04) {
        ctx.strokeStyle = `rgba(161, 98, 7, ${0.35 * nail.cuticle})`;
        ctx.lineWidth = 2.5 * nail.cuticle;
        ctx.beginPath();
        ctx.arc(0, nh * 0.36, nw * 0.44, 0.25, Math.PI - 0.25);
        ctx.stroke();
      }

      // Gotinhas de creme hidratante sendo massageadas
      for (let c = nail.creamDrops.length - 1; c >= 0; c--) {
        const drop = nail.creamDrops[c];
        ctx.fillStyle = `rgba(255, 255, 255, ${drop.alpha})`;
        ctx.beginPath();
        ctx.arc(drop.u * nw, drop.v * nh, drop.r * nw, 0, Math.PI * 2);
        ctx.fill();
        drop.alpha -= 0.015;
        if (drop.alpha <= 0) nail.creamDrops.splice(c, 1);
      }

      ctx.restore();
      ctx.restore();
    });

    ctx.restore();
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'bubble') {
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'clip') {
        p.vy += 0.22;
        p.rot += p.vrot;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#fffbeb';
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, Math.PI * 0.1, Math.PI * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        const s = p.r * p.life;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.35, -s * 0.35);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.35, s * 0.35);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.35, -s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ================== EVENTOS DE TOQUE / MOUSE ==================
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    Audio.init();
    if (ptr.activeId !== null && ptr.activeId !== e.pointerId) return;
    ptr.activeId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}

    const pt = getCanvasCoords(e);
    ptr.x = pt.x;
    ptr.y = pt.y;
    ptr.prevX = pt.x;
    ptr.prevY = pt.y;
    ptr.isDown = true;
    ptr.visible = true;
    ptr.pressAnim = 1;

    applyToolAtPoint(pt.x, pt.y, pt.x, pt.y, true);
  });

  canvas.addEventListener('pointermove', (e) => {
    const pt = getCanvasCoords(e);
    const dx = pt.x - ptr.x;
    const dy = pt.y - ptr.y;
    ptr.moveSpeed = Math.hypot(dx, dy);
    if (ptr.moveSpeed > 0.5) {
      ptr.moveAngle = Math.atan2(dy, dx);
    }
    ptr.prevX = ptr.x;
    ptr.prevY = ptr.y;
    ptr.x = pt.x;
    ptr.y = pt.y;
    ptr.visible = true;

    if (ptr.isDown && ptr.activeId === e.pointerId) {
      applyToolAtPoint(pt.x, pt.y, ptr.prevX, ptr.prevY, false);
    }
  });

  function stopPointer(e) {
    if (ptr.activeId !== e.pointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    ptr.activeId = null;
    ptr.isDown = false;
  }

  canvas.addEventListener('pointerup', stopPointer);
  canvas.addEventListener('pointercancel', stopPointer);
  canvas.addEventListener('pointerleave', () => {
    if (!ptr.isDown) ptr.visible = false;
  });

  // ================== CONSTRUÇÃO DOS MENUS LATERAIS ==================
  function updateToolHint() {
    const all = [...Tools.CARE_TOOLS, ...Tools.ART_TOOLS];
    const found = all.find(t => t.id === activeToolId);
    const hintEl = document.getElementById('tool-hint-text');
    if (hintEl && found) {
      hintEl.textContent = `${found.icon} ${found.name}: ${found.hint}`;
    }
  }

  function selectTool(toolId, targetTab = null) {
    activeToolId = toolId;
    if (targetTab) activeMenuTab = targetTab;
    Audio.playUiSelect();
    renderSideMenus();
    updateToolHint();
  }

  function renderSideMenus() {
    const tabsEl = document.getElementById('menu-tabs');
    const contentEl = document.getElementById('menu-content');
    tabsEl.innerHTML = '';
    contentEl.innerHTML = '';

    const tabs = [
      { id: 'care', icon: '🧼', label: 'Cuidar' },
      { id: 'polish', icon: '💅', label: 'Esmaltes' },
      { id: 'art', icon: '💎', label: 'Arte' },
      { id: 'style', icon: '🖐️', label: 'Estilo' }
    ];

    tabs.forEach(tb => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `tab-btn ${activeMenuTab === tb.id ? 'active' : ''}`;
      b.innerHTML = `<span>${tb.icon}</span><span>${tb.label}</span>`;
      b.addEventListener('click', () => {
        Audio.init();
        Audio.playUiSelect();
        activeMenuTab = tb.id;
        if (tb.id === 'polish' && !['polish', 'dots', 'french'].includes(activeToolId)) {
          activeToolId = 'polish';
        }
        renderSideMenus();
        updateToolHint();
      });
      tabsEl.appendChild(b);
    });

    if (activeMenuTab === 'care') {
      const grid = document.createElement('div');
      grid.className = 'tool-grid';
      Tools.CARE_TOOLS.forEach(tool => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tool-card-btn ${activeToolId === tool.id ? 'active' : ''}`;
        btn.innerHTML = `<span class="t-icon">${tool.icon}</span><span class="t-name">${tool.name}</span>`;
        btn.addEventListener('click', () => selectTool(tool.id));
        grid.appendChild(btn);
      });
      contentEl.appendChild(grid);
    } else if (activeMenuTab === 'polish') {
      const brushRow = document.createElement('div');
      brushRow.className = 'sub-row';
      ['polish', 'french', 'dots'].forEach(tid => {
        const meta = Tools.ART_TOOLS.find(t => t.id === tid);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mini-pill ${activeToolId === tid ? 'active' : ''}`;
        btn.innerHTML = `${meta.icon} ${meta.name}`;
        btn.addEventListener('click', () => selectTool(tid));
        brushRow.appendChild(btn);
      });
      contentEl.appendChild(brushRow);

      const colorsGrid = document.createElement('div');
      colorsGrid.className = 'color-grid';
      Tools.POLISH_COLORS.forEach(col => {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.title = col.name;
        sw.className = `polish-swatch ${activePolish.id === col.id ? 'active' : ''}`;
        sw.style.background = col.hex === 'rainbow'
          ? 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)'
          : col.hex;
        sw.innerHTML = '<span class="bottle-cap"></span>';
        sw.addEventListener('click', () => {
          Audio.init();
          Audio.playUiSelect();
          activePolish = col;
          if (!['polish', 'french', 'dots'].includes(activeToolId)) activeToolId = 'polish';
          renderSideMenus();
          updateToolHint();
        });
        colorsGrid.appendChild(sw);
      });
      contentEl.appendChild(colorsGrid);
    } else if (activeMenuTab === 'art') {
      const artTop = document.createElement('div');
      artTop.className = 'sub-row';
      ['glitter', 'sticker', 'dryer'].forEach(tid => {
        const meta = Tools.ART_TOOLS.find(t => t.id === tid);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mini-pill ${activeToolId === tid ? 'active' : ''}`;
        btn.innerHTML = `${meta.icon} ${meta.name}`;
        btn.addEventListener('click', () => selectTool(tid));
        artTop.appendChild(btn);
      });
      contentEl.appendChild(artTop);

      if (activeToolId === 'glitter') {
        const glGrid = document.createElement('div');
        glGrid.className = 'tool-grid';
        Tools.GLITTER_OPTIONS.forEach(gl => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `tool-card-btn ${activeGlitter.id === gl.id ? 'active' : ''}`;
          b.innerHTML = `<span class="t-icon">✨</span><span class="t-name">${gl.name}</span>`;
          b.addEventListener('click', () => {
            Audio.playUiSelect();
            activeGlitter = gl;
            renderSideMenus();
          });
          glGrid.appendChild(b);
        });
        contentEl.appendChild(glGrid);
      } else {
        const stGrid = document.createElement('div');
        stGrid.className = 'sticker-grid';
        Tools.STICKERS.forEach(st => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `sticker-btn ${activeSticker.id === st.id && activeToolId === 'sticker' ? 'active' : ''}`;
          b.textContent = st.icon;
          b.title = st.name;
          b.addEventListener('click', () => {
            Audio.playUiSelect();
            activeSticker = st;
            activeToolId = 'sticker';
            renderSideMenus();
            updateToolHint();
          });
          stGrid.appendChild(b);
        });
        contentEl.appendChild(stGrid);
      }
    } else if (activeMenuTab === 'style') {
      // Tons de pele
      const skinTitle = document.createElement('div');
      skinTitle.className = 'section-label';
      skinTitle.textContent = 'Tom de Pele & Mão:';
      contentEl.appendChild(skinTitle);

      const skinRow = document.createElement('div');
      skinRow.className = 'sub-row';
      Tools.SKIN_TONES.forEach(sk => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `skin-dot ${activeSkinTone.id === sk.id ? 'active' : ''}`;
        b.style.background = sk.base;
        b.title = sk.name;
        b.addEventListener('click', () => {
          Audio.playUiSelect();
          activeSkinTone = sk;
          renderSideMenus();
        });
        skinRow.appendChild(b);
      });
      ['left', 'right'].forEach(side => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mini-pill ${handSide === side ? 'active' : ''}`;
        b.textContent = side === 'left' ? '🤚 Esq.' : '🖐️ Dir.';
        b.addEventListener('click', () => {
          Audio.playUiSelect();
          handSide = side;
          renderSideMenus();
        });
        skinRow.appendChild(b);
      });
      contentEl.appendChild(skinRow);

      // Formato da Unha
      const shapeTitle = document.createElement('div');
      shapeTitle.className = 'section-label';
      shapeTitle.textContent = 'Formato das Unhas:';
      contentEl.appendChild(shapeTitle);

      const shapeRow = document.createElement('div');
      shapeRow.className = 'sub-row';
      [
        { id: 'round', label: '⭕ Redonda' },
        { id: 'square', label: '⬜ Quadrada' },
        { id: 'almond', label: '💧 Amêndoa' }
      ].forEach(sh => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mini-pill ${activeNailShape === sh.id ? 'active' : ''}`;
        b.textContent = sh.label;
        b.addEventListener('click', () => {
          Audio.playUiSelect();
          activeNailShape = sh.id;
          renderSideMenus();
        });
        shapeRow.appendChild(b);
      });
      contentEl.appendChild(shapeRow);

      // Anel
      const ringTitle = document.createElement('div');
      ringTitle.className = 'section-label';
      ringTitle.textContent = 'Anel Fofo:';
      contentEl.appendChild(ringTitle);

      const ringRow = document.createElement('div');
      ringRow.className = 'sub-row';
      ['💍', '🌸', '🦋', '💎', ''].forEach(rg => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mini-pill ${activeRing === rg ? 'active' : ''}`;
        b.textContent = rg || 'Sem Anel';
        b.addEventListener('click', () => {
          Audio.playStickerPlace();
          activeRing = rg;
          renderSideMenus();
        });
        ringRow.appendChild(b);
      });
      contentEl.appendChild(ringRow);
    }
  }

  // ================== FOTO FINAL & LOOP PRINCIPAL ==================
  function takeSalonPhoto() {
    Audio.init();
    Audio.playCameraFlash();
    flashOpacity = 0.9;
    nails.forEach(n => {
      if (n.screenGeo) {
        for (let i = 0; i < 6; i++) {
          spawnSparkle(n.screenGeo.cx, n.screenGeo.cy, '#facc15');
        }
      }
    });
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const timeSec = now * 0.001;

    if (ptr.clipAnim > 0) ptr.clipAnim = Math.max(0, ptr.clipAnim - 0.12);
    if (ptr.pressAnim > 0 && !ptr.isDown) ptr.pressAnim = Math.max(0, ptr.pressAnim - 0.08);

    drawPillowAndBackground();
    drawHandAndNails();
    drawParticles();

    if (ptr.visible) {
      Tools.drawActiveToolCursor(ctx, {
        x: ptr.x,
        y: ptr.y,
        toolId: activeToolId,
        isDown: ptr.isDown,
        moveAngle: ptr.moveAngle,
        moveSpeed: ptr.moveSpeed,
        polishColor: activePolish,
        glitterOption: activeGlitter,
        stickerIcon: activeSticker.icon,
        clipAnim: ptr.clipAnim,
        pressAnim: ptr.pressAnim,
        timeSec
      });
    }

    if (flashOpacity > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, canvasW, canvasH);
      flashOpacity *= 0.85;
    }
  }

  function init() {
    resetAllNails(true);
    resizeCanvas();
    renderSideMenus();
    updateToolHint();

    window.addEventListener('resize', resizeCanvas);

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = Audio.setEnabled(!Audio.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) Audio.playUiSelect();
    });

    document.getElementById('btn-new-hand').addEventListener('click', () => {
      Audio.playUiSelect();
      resetAllNails(true);
    });

    document.getElementById('btn-photo').addEventListener('click', takeSalonPhoto);

    requestAnimationFrame(animate);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
