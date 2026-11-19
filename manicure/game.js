// Salão de Manicure 3D Realista Kids - Motor 1024x1024 com Mãos CGI, Blend PBR e Guia Tracejado
(() => {
  const Tools = window.ManicureTools;
  const Audio = window.ManicureAudio;

  const S = 1024;
  const canvas = document.getElementById('manicure-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = S;
  canvas.height = S;

  const HAND_MODELS = [
    {
      id: 'fair',
      name: 'Clara',
      swatch: '#fbd5c0',
      src: 'assets/hand_fair.jpg',
      ring: { cx: 0.608, cy: 0.432, w: 0.068, angle: 0.14 },
      nails: [
        { name: 'Polegar', cx: 0.207, cy: 0.464, w: 0.044, h: 0.088, angle: -0.44 },
        { name: 'Indicador', cx: 0.365, cy: 0.186, w: 0.052, h: 0.082, angle: -0.04 },
        { name: 'Médio', cx: 0.506, cy: 0.138, w: 0.054, h: 0.082, angle: 0.01 },
        { name: 'Anelar', cx: 0.646, cy: 0.198, w: 0.051, h: 0.078, angle: 0.08 },
        { name: 'Mindinho', cx: 0.774, cy: 0.338, w: 0.042, h: 0.068, angle: 0.30 }
      ]
    },
    {
      id: 'tan',
      name: 'Dourada',
      swatch: '#e0a97f',
      src: 'assets/hand_tan.jpg',
      ring: { cx: 0.602, cy: 0.432, w: 0.065, angle: 0.13 },
      nails: [
        { name: 'Polegar', cx: 0.228, cy: 0.470, w: 0.044, h: 0.078, angle: -0.44 },
        { name: 'Indicador', cx: 0.373, cy: 0.197, w: 0.049, h: 0.076, angle: -0.05 },
        { name: 'Médio', cx: 0.508, cy: 0.148, w: 0.052, h: 0.080, angle: 0.01 },
        { name: 'Anelar', cx: 0.632, cy: 0.198, w: 0.048, h: 0.075, angle: 0.08 },
        { name: 'Mindinho', cx: 0.748, cy: 0.324, w: 0.040, h: 0.064, angle: 0.32 }
      ]
    },
    {
      id: 'deep',
      name: 'Negra',
      swatch: '#8c5535',
      src: 'assets/hand_deep.jpg',
      ring: { cx: 0.600, cy: 0.448, w: 0.066, angle: 0.12 },
      nails: [
        { name: 'Polegar', cx: 0.232, cy: 0.486, w: 0.044, h: 0.080, angle: -0.42 },
        { name: 'Indicador', cx: 0.374, cy: 0.220, w: 0.050, h: 0.078, angle: -0.04 },
        { name: 'Médio', cx: 0.506, cy: 0.174, w: 0.053, h: 0.080, angle: 0.00 },
        { name: 'Anelar', cx: 0.629, cy: 0.226, w: 0.049, h: 0.076, angle: 0.08 },
        { name: 'Mindinho', cx: 0.743, cy: 0.348, w: 0.040, h: 0.066, angle: 0.32 }
      ]
    }
  ];

  // Pré-carregar mãos 3D
  const loadedHands = {};
  HAND_MODELS.forEach(h => {
    const img = new Image();
    img.src = h.src;
    img.onload = () => { loadedHands[h.id] = img; };
  });

  // ================== ESTADO GLOBAL ==================
  let currentHand = HAND_MODELS[0];
  let handSide = 'right'; // 'right' (original) | 'left' (espelhado horizontalmente)
  let activeMenuTab = 'care';
  let activeToolId = 'sponge';
  let activePolish = Tools.POLISH_COLORS[0];
  let activeGlitter = Tools.GLITTER_OPTIONS[2];
  let activeSticker = Tools.STICKERS[0];
  let activeRing = '💍';
  let showGuide = true;

  let rainbowHue = 0;
  let particles = [];
  let flashOpacity = 0;
  let nails = [];

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

  function createNailState(idx) {
    const paintCanvas = document.createElement('canvas');
    paintCanvas.width = 180;
    paintCanvas.height = 240;
    const paintCtx = paintCanvas.getContext('2d');

    const glitterCanvas = document.createElement('canvas');
    glitterCanvas.width = 180;
    glitterCanvas.height = 240;
    const glitterCtx = glitterCanvas.getContext('2d');

    const spots = [];
    for (let s = 0; s < 5; s++) {
      spots.push({
        u: (Math.random() - 0.5) * 0.56,
        v: (Math.random() - 0.5) * 0.62,
        r: 0.07 + Math.random() * 0.07
      });
    }

    return {
      index: idx,
      dirtyLevel: 0.9,
      excessLength: 0.28,
      roughness: 0.85,
      cuticle: 0.85,
      hydration: 0.1,
      topCoat: 0.15,
      spots,
      stickers: [],
      creamDrops: [],
      paintCanvas,
      paintCtx,
      glitterCanvas,
      glitterCtx
    };
  }

  function resetAllNails(makeMessy = true) {
    nails = [0, 1, 2, 3, 4].map(idx => {
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

  // ================== COORDENADAS DAS UNHAS EM 1024x1024 ==================
  function getNailGeometry(idx) {
    const spec = currentHand.nails[idx];
    const mirrored = handSide === 'left';
    return {
      cx: (mirrored ? 1 - spec.cx : spec.cx) * S,
      cy: spec.cy * S,
      w: spec.w * S,
      h: spec.h * S,
      angle: mirrored ? -spec.angle : spec.angle
    };
  }

  function stageToNailLocal(idx, sx, sy) {
    const g = getNailGeometry(idx);
    const dx = sx - g.cx;
    const dy = sy - g.cy;
    const cos = Math.cos(-g.angle);
    const sin = Math.sin(-g.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    return { u: lx / g.w, v: ly / g.h, g };
  }

  function isInsideNailLocal(u, v, margin = 0.1) {
    return Math.abs(u) <= 0.54 + margin && v >= -0.84 - margin && v <= 0.56 + margin;
  }

  function nailLocalToCanvas(nail, u, v) {
    const W = nail.paintCanvas.width;
    const H = nail.paintCanvas.height;
    return {
      cx: (u + 0.5) * W,
      cy: ((v + 0.86) / 1.36) * H
    };
  }

  function findNailUnderPointer(sx, sy, margin = 0.14) {
    for (let i = 0; i < nails.length; i++) {
      const loc = stageToNailLocal(i, sx, sy);
      if (isInsideNailLocal(loc.u, loc.v, margin)) {
        return { nail: nails[i], loc };
      }
    }
    return null;
  }

  // ================== PARTÍCULAS ==================
  function spawnSoapBubble(x, y) {
    particles.push({
      type: 'bubble',
      x: x + (Math.random() - 0.5) * 34,
      y: y + (Math.random() - 0.5) * 26,
      vx: (Math.random() - 0.5) * 1.1,
      vy: -1.0 - Math.random() * 1.4,
      r: 7 + Math.random() * 11,
      life: 1,
      decay: 0.025
    });
  }

  function spawnDustGrain(x, y) {
    particles.push({
      type: 'dust',
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 1.8,
      vy: 0.6 + Math.random() * 1.5,
      r: 2.5 + Math.random() * 2.5,
      life: 1,
      decay: 0.032
    });
  }

  function spawnNailClipping(x, y, w) {
    particles.push({
      type: 'clip',
      x,
      y,
      vx: (Math.random() - 0.5) * 4.5,
      vy: -4.2 - Math.random() * 2.6,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      w: w * 0.72,
      life: 1,
      decay: 0.02
    });
  }

  function spawnSparkle(x, y, color = '#fef08a') {
    particles.push({
      type: 'sparkle',
      x: x + (Math.random() - 0.5) * 42,
      y: y + (Math.random() - 0.5) * 42,
      vx: (Math.random() - 0.5) * 1.3,
      vy: -0.9 - Math.random() * 1.3,
      r: 6 + Math.random() * 9,
      color,
      life: 1,
      decay: 0.028
    });
  }

  // ================== APLICAÇÃO DAS FERRAMENTAS ==================
  function paintStrokeOnNail(nail, fromU, fromV, toU, toV, colorHex, radiusPx, isFrench = false) {
    const pc = nail.paintCtx;
    const W = nail.paintCanvas.width;
    const p1 = nailLocalToCanvas(nail, fromU, fromV);
    const p2 = nailLocalToCanvas(nail, toU, toV);

    pc.save();
    pc.lineCap = 'round';
    pc.lineJoin = 'round';
    pc.strokeStyle = colorHex;
    pc.fillStyle = colorHex;
    pc.lineWidth = radiusPx * 2;

    if (isFrench) {
      const tipBoundaryY = nailLocalToCanvas(nail, 0, -0.22 - nail.excessLength).cy;
      pc.beginPath();
      pc.rect(0, 0, W, Math.max(26, tipBoundaryY));
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
      const gx = cx + (Math.random() - 0.5) * 36;
      const gy = cy + (Math.random() - 0.5) * 36;
      const r = 2 + Math.random() * 3.8;
      gc.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      gc.beginPath();
      if (Math.random() > 0.35) {
        gc.arc(gx, gy, r, 0, Math.PI * 2);
      } else {
        gc.moveTo(gx, gy - r * 1.4);
        gc.lineTo(gx + r * 1.2, gy);
        gc.lineTo(gx, gy + r * 1.4);
        gc.lineTo(gx - r * 1.2, gy);
        gc.closePath();
      }
      gc.fill();
    }
  }

  function wipeNailLayers(nail, u, v, radiusPx = 30) {
    const { cx, cy } = nailLocalToCanvas(nail, u, v);
    [nail.paintCtx, nail.glitterCtx].forEach(c => {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      c.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
    nail.stickers = nail.stickers.filter(st => Math.hypot(st.u - u, st.v - v) > 0.28);
  }

  function applyToolAtPoint(sx, sy, prevSx, prevSy, isTap = false) {
    const found = findNailUnderPointer(sx, sy, activeToolId === 'cream' ? 0.32 : 0.16);
    if (!found) return;
    const { nail, loc } = found;
    const distMoved = Math.hypot(sx - prevSx, sy - prevSy);

    if (activeToolId === 'sponge') {
      if (isTap || distMoved > 2) {
        nail.dirtyLevel = Math.max(0, nail.dirtyLevel - 0.06);
        Audio.playSoapScrub();
        if (Math.random() > 0.3) spawnSoapBubble(sx, sy);
      }
    } else if (activeToolId === 'clipper') {
      if (isTap) {
        ptr.clipAnim = 1;
        Audio.playClipperSnip();
        if (nail.excessLength > 0.02) {
          nail.excessLength = Math.max(0, nail.excessLength - 0.14);
          spawnNailClipping(sx, sy, loc.g.w);
          spawnSparkle(sx, sy, '#ffffff');
        }
      }
    } else if (activeToolId === 'file') {
      if (distMoved > 2 && loc.v < 0.12) {
        nail.roughness = Math.max(0, nail.roughness - 0.075);
        nail.excessLength = Math.max(0, nail.excessLength - 0.009);
        Audio.playFileScrape();
        if (Math.random() > 0.25) spawnDustGrain(sx, sy);
      }
    } else if (activeToolId === 'cream') {
      if (isTap || distMoved > 3) {
        nail.hydration = Math.min(1, nail.hydration + 0.075);
        nail.cuticle = Math.max(0, nail.cuticle - 0.035);
        Audio.playCreamMassage();
        if (nail.creamDrops.length < 12 && Math.random() > 0.4) {
          nail.creamDrops.push({ u: loc.u, v: loc.v, alpha: 0.9, r: 0.09 + Math.random() * 0.06 });
        }
      }
    } else if (activeToolId === 'pusher') {
      if (isTap || (distMoved > 2 && loc.v > -0.05)) {
        nail.cuticle = Math.max(0, nail.cuticle - 0.085);
        Audio.playCreamMassage();
        if (Math.random() > 0.5) spawnSparkle(sx, sy, '#fbcfe8');
      }
    } else if (activeToolId === 'remover') {
      if (isTap || distMoved > 2) {
        wipeNailLayers(nail, loc.u, loc.v, 30);
        Audio.playCottonWipe();
      }
    } else if (activeToolId === 'polish' || activeToolId === 'french') {
      if (isTap || distMoved > 1.5) {
        const prevLoc = stageToNailLocal(nail.index, prevSx, prevSy);
        let hex = activePolish.hex;
        if (hex === 'rainbow') {
          rainbowHue = (rainbowHue + 10) % 360;
          hex = `hsl(${rainbowHue}, 88%, 56%)`;
        }
        paintStrokeOnNail(nail, prevLoc.u, prevLoc.v, loc.u, loc.v, hex, activeToolId === 'french' ? 24 : 28, activeToolId === 'french');
        Audio.playBrushStroke();
      }
    } else if (activeToolId === 'dots') {
      if (isTap) {
        let hex = activePolish.hex;
        if (hex === 'rainbow') {
          rainbowHue = (rainbowHue + 40) % 360;
          hex = `hsl(${rainbowHue}, 88%, 56%)`;
        }
        paintStrokeOnNail(nail, loc.u, loc.v, loc.u, loc.v, hex, 16, false);
        Audio.playStickerPlace();
        spawnSparkle(sx, sy, hex);
      }
    } else if (activeToolId === 'glitter') {
      if (isTap || distMoved > 2) {
        sprinkleGlitterOnNail(nail, loc.u, loc.v, activeGlitter.colors);
        Audio.playGlitterSparkle();
        if (Math.random() > 0.45) spawnSparkle(sx, sy, activeGlitter.colors[0]);
      }
    } else if (activeToolId === 'sticker') {
      if (isTap && isInsideNailLocal(loc.u, loc.v, 0.02)) {
        nail.stickers.push({
          u: Math.max(-0.34, Math.min(0.34, loc.u)),
          v: Math.max(-0.42, Math.min(0.36, loc.v)),
          icon: activeSticker.icon,
          size: 0.42,
          rot: (Math.random() - 0.5) * 0.25
        });
        Audio.playStickerPlace();
        for (let k = 0; k < 5; k++) spawnSparkle(sx, sy, '#fef08a');
      }
    } else if (activeToolId === 'dryer') {
      nail.topCoat = Math.min(1, nail.topCoat + 0.05);
      Audio.playDryerBreeze();
      if (Math.random() > 0.3) spawnSparkle(sx, sy, '#bae6fd');
    }
  }

  // ================== DESENHO REALISTA DAS UNHAS E GUIAS TRACEJADOS ==================
  function traceNailContour(c, w, h, excess, roughness) {
    const hw = w * 0.5;
    const topY = -h * (0.5 + excess);
    const botY = h * 0.5;

    c.beginPath();
    c.moveTo(-hw, botY - h * 0.16);
    c.lineTo(-hw, topY + hw * 0.92);
    c.quadraticCurveTo(-hw, topY, 0, topY + (roughness > 0.25 ? roughness * 4.5 : 0));
    c.quadraticCurveTo(hw, topY, hw, topY + hw * 0.92);
    c.lineTo(hw, botY - h * 0.16);
    c.quadraticCurveTo(0, botY + h * 0.12, -hw, botY - h * 0.16);
    c.closePath();
  }

  function drawRingOnHand() {
    if (!activeRing) return;
    const r = currentHand.ring;
    const mirrored = handSide === 'left';
    const cx = (mirrored ? 1 - r.cx : r.cx) * S;
    const cy = r.cy * S;
    const rw = r.w * S;
    const angle = mirrored ? -r.angle : r.angle;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Aro dourado realista com reflexo
    const grad = ctx.createLinearGradient(-rw * 0.5, 0, rw * 0.5, 0);
    grad.addColorStop(0, '#b45309');
    grad.addColorStop(0.35, '#fef08a');
    grad.addColorStop(0.65, '#f59e0b');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;

    const rx = -rw * 0.52;
    const ry = -8;
    const w = rw * 1.04;
    const h = 16;
    ctx.beginPath();
    ctx.moveTo(rx + 6, ry);
    ctx.lineTo(rx + w - 6, ry);
    ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + 6);
    ctx.lineTo(rx + w, ry + h - 6);
    ctx.quadraticCurveTo(rx + w, ry + h, rx + w - 6, ry + h);
    ctx.lineTo(rx + 6, ry + h);
    ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - 6);
    ctx.lineTo(rx, ry + 6);
    ctx.quadraticCurveTo(rx, ry, rx + 6, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = `${Math.round(rw * 0.62)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeRing, 0, -2);
    ctx.restore();
  }

  function drawDashedGuideForNails(timeSec) {
    if (!showGuide) return;
    const pulse = 0.6 + Math.sin(timeSec * 5) * 0.32;

    nails.forEach((nail, idx) => {
      const g = getNailGeometry(idx);
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(g.angle);
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -timeSec * 24;
      ctx.lineWidth = 3.5;

      if (activeToolId === 'sponge' && nail.dirtyLevel > 0.05) {
        ctx.strokeStyle = `rgba(14, 165, 233, ${pulse})`;
        traceNailContour(ctx, g.w * 1.15, g.h * 1.1, nail.excessLength, 0);
        ctx.stroke();
      } else if (activeToolId === 'clipper' && nail.excessLength > 0.03) {
        ctx.strokeStyle = `rgba(244, 63, 94, ${pulse})`;
        const cutY = -g.h * 0.52;
        ctx.beginPath();
        ctx.moveTo(-g.w * 0.65, cutY);
        ctx.lineTo(g.w * 0.65, cutY);
        ctx.stroke();
      } else if (activeToolId === 'file' && nail.roughness > 0.05) {
        ctx.strokeStyle = `rgba(236, 72, 153, ${pulse})`;
        const tipY = -g.h * (0.5 + nail.excessLength) - 6;
        ctx.beginPath();
        ctx.arc(0, tipY + g.w * 0.5, g.w * 0.62, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      } else if ((activeToolId === 'cream' || activeToolId === 'pusher') && (nail.cuticle > 0.05 || nail.hydration < 0.85)) {
        ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, g.h * 0.34, g.w * 0.52, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (activeToolId === 'french') {
        ctx.strokeStyle = `rgba(219, 39, 119, ${pulse})`;
        const tipY = -g.h * (0.34 + nail.excessLength * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, tipY, g.w * 0.52, g.h * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (['polish', 'glitter', 'dots', 'sticker', 'dryer', 'remover'].includes(activeToolId)) {
        ctx.strokeStyle = `rgba(236, 72, 153, ${pulse * 0.78})`;
        traceNailContour(ctx, g.w * 1.08, g.h * 1.05, nail.excessLength, 0);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawAllNailsOverlay(timeSec) {
    nails.forEach((nail, idx) => {
      const g = getNailGeometry(idx);
      const nw = g.w;
      const nh = g.h;

      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(g.angle);

      // 1. Extensão crescida natural da ponta da unha (visível antes de cortar!)
      if (nail.excessLength > 0.01) {
        ctx.save();
        traceNailContour(ctx, nw, nh, nail.excessLength, nail.roughness);
        ctx.clip();
        const tipGrad = ctx.createLinearGradient(0, -nh * (0.5 + nail.excessLength), 0, -nh * 0.32);
        tipGrad.addColorStop(0, 'rgba(255, 250, 240, 0.92)');
        tipGrad.addColorStop(0.75, 'rgba(255, 244, 232, 0.78)');
        tipGrad.addColorStop(1, 'rgba(255, 244, 232, 0)');
        ctx.fillStyle = tipGrad;
        ctx.fillRect(-nw, -nh * 1.2, nw * 2, nh * 0.9);
        ctx.restore();
      }

      // 2. Camadas realistas de esmalte + glitter + adesivos + sujeira recortadas no formato exato da unha
      ctx.save();
      traceNailContour(ctx, nw, nh, nail.excessLength, nail.roughness);
      ctx.clip();

      // Esmalte com blend realista preservando iluminação 3D da mão!
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.78;
      ctx.drawImage(nail.paintCanvas, -nw * 0.5, -nh * 0.86, nw, nh * 1.36);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.58;
      ctx.drawImage(nail.paintCanvas, -nw * 0.5, -nh * 0.86, nw, nh * 1.36);
      ctx.restore();

      // Glitter cintilante
      ctx.drawImage(nail.glitterCanvas, -nw * 0.5, -nh * 0.86, nw, nh * 1.36);

      // Adesivos e Pedrinhas
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

      // Sujeirinha inicial (desaparece com a esponja)
      if (nail.dirtyLevel > 0.02) {
        ctx.fillStyle = `rgba(110, 74, 46, ${0.46 * nail.dirtyLevel})`;
        nail.spots.forEach(sp => {
          ctx.beginPath();
          ctx.arc(sp.u * nw, sp.v * nh, sp.r * nw, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Extra brilho vítreo do Secador/Top Coat
      const gloss = 0.14 + nail.topCoat * 0.58;
      ctx.fillStyle = `rgba(255, 255, 255, ${gloss})`;
      ctx.beginPath();
      ctx.ellipse(-nw * 0.2, -nh * 0.08, nw * 0.11, nh * 0.34, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 3. Cutícula ressecada sutil na base (some com espátula/creme)
      if (nail.cuticle > 0.05) {
        ctx.strokeStyle = `rgba(180, 120, 75, ${0.45 * nail.cuticle})`;
        ctx.lineWidth = 3.2 * nail.cuticle;
        ctx.beginPath();
        ctx.arc(0, nh * 0.36, nw * 0.45, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }

      // 4. Gotinhas cremosas sendo absorvidas
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
    });

    drawRingOnHand();
    drawDashedGuideForNails(timeSec);
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
        ctx.fillStyle = 'rgba(224, 242, 254, 0.58)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'dust') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'clip') {
        p.vy += 0.26;
        p.rot += p.vrot;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#fffbeb';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
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
        ctx.lineTo(s * 0.34, -s * 0.34);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.34, s * 0.34);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.34, s * 0.34);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.34, -s * 0.34);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ================== EVENTOS DE PONTEIRO ==================
  function clientToStage(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * S,
      y: ((e.clientY - rect.top) / rect.height) * S
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    Audio.init();
    if (ptr.activeId !== null && ptr.activeId !== e.pointerId) return;
    ptr.activeId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}

    const pt = clientToStage(e);
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
    const pt = clientToStage(e);
    const dx = pt.x - ptr.x;
    const dy = pt.y - ptr.y;
    ptr.moveSpeed = Math.hypot(dx, dy);
    if (ptr.moveSpeed > 0.5) ptr.moveAngle = Math.atan2(dy, dx);
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

  // ================== MENUS LATERAIS ==================
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
      const skinTitle = document.createElement('div');
      skinTitle.className = 'section-label';
      skinTitle.textContent = 'Modelo de Mão 3D:';
      contentEl.appendChild(skinTitle);

      const skinRow = document.createElement('div');
      skinRow.className = 'sub-row';
      HAND_MODELS.forEach(hm => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `skin-dot ${currentHand.id === hm.id ? 'active' : ''}`;
        b.style.background = hm.swatch;
        b.title = hm.name;
        b.addEventListener('click', () => {
          Audio.playUiSelect();
          currentHand = hm;
          renderSideMenus();
        });
        skinRow.appendChild(b);
      });
      ['right', 'left'].forEach(side => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mini-pill ${handSide === side ? 'active' : ''}`;
        b.textContent = side === 'right' ? '🖐️ Dir.' : '🤚 Esq.';
        b.addEventListener('click', () => {
          Audio.playUiSelect();
          handSide = side;
          renderSideMenus();
        });
        skinRow.appendChild(b);
      });
      contentEl.appendChild(skinRow);

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
    const prevGuide = showGuide;
    const prevVis = ptr.visible;
    showGuide = false;
    ptr.visible = false;
    flashOpacity = 0.9;

    nails.forEach((_, idx) => {
      const g = getNailGeometry(idx);
      for (let i = 0; i < 5; i++) spawnSparkle(g.cx, g.cy, '#fef08a');
    });

    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.download = `minha-manicure-${currentHand.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (_) {}
      showGuide = prevGuide;
      ptr.visible = prevVis;
    }, 60);
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const timeSec = now * 0.001;

    if (ptr.clipAnim > 0) ptr.clipAnim = Math.max(0, ptr.clipAnim - 0.12);
    if (ptr.pressAnim > 0 && !ptr.isDown) ptr.pressAnim = Math.max(0, ptr.pressAnim - 0.08);

    ctx.clearRect(0, 0, S, S);
    const img = loadedHands[currentHand.id];
    if (img) {
      ctx.save();
      if (handSide === 'left') {
        ctx.translate(S, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, 0, 0, S, S);
      ctx.restore();
    } else {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, S, S);
      return;
    }

    drawAllNailsOverlay(timeSec);
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
      ctx.fillRect(0, 0, S, S);
      flashOpacity *= 0.85;
    }
  }

  function init() {
    resetAllNails(true);
    renderSideMenus();
    updateToolHint();

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = Audio.setEnabled(!Audio.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) Audio.playUiSelect();
    });

    const guideBtn = document.getElementById('btn-guide');
    if (guideBtn) {
      guideBtn.classList.add('active');
      guideBtn.addEventListener('click', () => {
        Audio.playUiSelect();
        showGuide = !showGuide;
        guideBtn.classList.toggle('active', showGuide);
      });
    }

    document.getElementById('btn-new-hand').addEventListener('click', () => {
      Audio.playUiSelect();
      resetAllNails(true);
    });

    document.getElementById('btn-photo').addEventListener('click', takeSalonPhoto);

    requestAnimationFrame(animate);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
