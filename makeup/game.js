// Salão de Maquiagem Realista Kids - Motor Multicamadas PBR-Blend 1024x1024
(() => {
  const Models = window.MakeupModels;
  const Tools = window.MakeupTools;
  const Audio = window.MakeupAudio;

  const S = 1024; // Resolução interna HD alinhada às fotos 1024x1024
  const canvas = document.getElementById('makeup-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = S;
  canvas.height = S;

  // Cria camadas offscreen separadas para blend modes realistas!
  function makeLayer() {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    return { canvas: c, ctx: c.getContext('2d') };
  }

  const spaLayer = makeLayer();
  const blushLayer = makeLayer();
  const highlightLayer = makeLayer();
  const shadowLayer = makeLayer();
  const lipsLayer = makeLayer();
  const glitterLayer = makeLayer();

  // Pré-carregamento das 3 modelos 3D
  const loadedImages = {};
  Models.MODELS.forEach(m => {
    const img = new Image();
    img.src = m.src;
    img.onload = () => { loadedImages[m.id] = img; };
  });

  // ================== ESTADO DO SALÃO ==================
  let currentModel = Models.MODELS[0];
  let activeTab = 'spa'; // 'spa' | 'face' | 'eyes' | 'lips' | 'glam' | 'acc'
  let activeToolId = 'spa_mask';

  let activeSpaMask = Tools.SPA_MASKS[0];
  let activeBlush = Tools.BLUSH_COLORS[0];
  let activeEyeshadow = Tools.EYESHADOW_COLORS[0];
  let activeLinerColor = Tools.LINER_COLORS[0];
  let activeLens = Tools.LENS_COLORS[0];
  let activeLipstick = Tools.LIPSTICK_COLORS[0];
  let activeGlitter = Tools.GLITTER_SETS[2];
  let activeGem = Tools.FACE_GEMS[0];

  let skinGlow = 0; // Aumenta quando a criança enxágua a máscara facial!
  let linerState = { color: '#111827', progress: 0 };
  let mascaraState = { color: '#111827', level: 0 };
  let browState = { color: '#5c3a21', level: 0 };
  let glossLevel = 0;
  let faceStickers = []; // { x, y, icon, size, rot }
  let accessories = { tiara: 'none', earrings: 'none', necklace: 'none' };

  let showBeforeMode = false;
  let flashOpacity = 0;
  let particles = [];

  // Histórico Undo (até 10 estados)
  const undoStack = [];
  const MAX_UNDO = 10;

  const ptr = {
    x: -999,
    y: -999,
    prevX: -999,
    prevY: -999,
    isDown: false,
    visible: false,
    moveSpeed: 0,
    activeId: null
  };

  function clearAllMakeup(keepAccessories = false) {
    [spaLayer, blushLayer, highlightLayer, shadowLayer, lipsLayer, glitterLayer].forEach(l => {
      l.ctx.clearRect(0, 0, S, S);
    });
    skinGlow = 0;
    linerState = { color: activeLinerColor.hex, progress: 0 };
    mascaraState = { color: activeLinerColor.hex, level: 0 };
    browState = { color: '#5c3a21', level: 0 };
    glossLevel = 0;
    faceStickers = [];
    if (!keepAccessories) {
      activeLens = Tools.LENS_COLORS[0];
      accessories = { tiara: 'none', earrings: 'none', necklace: 'none' };
    }
    particles = [];
    undoStack.length = 0;
    updateUndoBtn();
  }

  function cloneCanvasImage(layer) {
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    c.getContext('2d').drawImage(layer.canvas, 0, 0);
    return c;
  }

  function pushUndo() {
    undoStack.push({
      spa: cloneCanvasImage(spaLayer),
      blush: cloneCanvasImage(blushLayer),
      highlight: cloneCanvasImage(highlightLayer),
      shadow: cloneCanvasImage(shadowLayer),
      lips: cloneCanvasImage(lipsLayer),
      glitter: cloneCanvasImage(glitterLayer),
      skinGlow,
      linerState: { ...linerState },
      mascaraState: { ...mascaraState },
      browState: { ...browState },
      glossLevel,
      faceStickers: faceStickers.map(s => ({ ...s }))
    });
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    updateUndoBtn();
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    const snap = undoStack.pop();
    const restore = (layer, img) => {
      layer.ctx.clearRect(0, 0, S, S);
      layer.ctx.drawImage(img, 0, 0);
    };
    restore(spaLayer, snap.spa);
    restore(blushLayer, snap.blush);
    restore(highlightLayer, snap.highlight);
    restore(shadowLayer, snap.shadow);
    restore(lipsLayer, snap.lips);
    restore(glitterLayer, snap.glitter);
    skinGlow = snap.skinGlow;
    linerState = snap.linerState;
    mascaraState = snap.mascaraState;
    browState = snap.browState;
    glossLevel = snap.glossLevel;
    faceStickers = snap.faceStickers;
    Audio.playUiSelect(430);
    updateUndoBtn();
  }

  function updateUndoBtn() {
    const b = document.getElementById('btn-undo');
    if (b) {
      b.disabled = undoStack.length === 0;
      b.style.opacity = undoStack.length === 0 ? '0.5' : '1';
    }
  }

  // ================== PARTÍCULAS (BOLHAS, PÓ, BRILHOS) ==================
  function spawnBubble(x, y) {
    particles.push({
      type: 'bubble',
      x: x + (Math.random() - 0.5) * 44,
      y: y + (Math.random() - 0.5) * 32,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -1.1 - Math.random() * 1.6,
      r: 8 + Math.random() * 14,
      life: 1,
      decay: 0.025
    });
  }

  function spawnSparkle(x, y, color = '#fef08a', count = 1) {
    for (let i = 0; i < count; i++) {
      particles.push({
        type: 'sparkle',
        x: x + (Math.random() - 0.5) * 52,
        y: y + (Math.random() - 0.5) * 52,
        vx: (Math.random() - 0.5) * 1.6,
        vy: -0.9 - Math.random() * 1.6,
        r: 7 + Math.random() * 11,
        color,
        life: 1,
        decay: 0.026
      });
    }
  }

  function spawnPowderPuff(x, y, color) {
    particles.push({
      type: 'powder',
      x: x + (Math.random() - 0.5) * 38,
      y: y + (Math.random() - 0.5) * 38,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -0.4 - Math.random() * 0.8,
      r: 10 + Math.random() * 16,
      color,
      life: 0.7,
      decay: 0.032
    });
  }

  // ================== PINTURA COM MÁSCARAS ANATÔMICAS ==================
  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function softDab(targetCtx, x, y, radius, hex, alpha) {
    const grad = targetCtx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    grad.addColorStop(0, hexToRgba(hex, alpha));
    grad.addColorStop(0.6, hexToRgba(hex, alpha * 0.45));
    grad.addColorStop(1, hexToRgba(hex, 0));
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(x, y, radius, 0, Math.PI * 2);
    targetCtx.fill();
  }

  // Recorta rosto deixando olhos e boca protegidos para máscara spa
  function applySpaMaskStroke(x, y) {
    const c = spaLayer.ctx;
    c.save();
    Models.traceFaceOvalPath(c, currentModel, S);
    c.clip();
    softDab(c, x, y, 52, activeSpaMask.hex, 0.36);

    // Mantém olhos e lábios limpos da máscara facial
    c.globalCompositeOperation = 'destination-out';
    ['left', 'right'].forEach(side => {
      Models.traceEyeOpeningPath(c, currentModel.eyes[side], S, 0.012);
      c.fill();
    });
    Models.traceLipsPath(c, currentModel, S);
    c.fill();
    c.restore();
  }

  function applySpaSpongeWipe(x, y) {
    const c = spaLayer.ctx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    const grad = c.createRadialGradient(x, y, 12, x, y, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(x, y, 64, 0, Math.PI * 2);
    c.fill();
    c.restore();

    skinGlow = Math.min(1, skinGlow + 0.018);
    if (Math.random() > 0.3) spawnBubble(x, y);
  }

  function applyBlushStroke(x, y) {
    const c = blushLayer.ctx;
    c.save();
    Models.traceFaceOvalPath(c, currentModel, S);
    c.clip();
    softDab(c, x, y, 62, activeBlush.hex, 0.14);
    c.restore();
    if (Math.random() > 0.55) spawnPowderPuff(x, y, activeBlush.hex);
  }

  function applyHighlighterStroke(x, y) {
    const c = highlightLayer.ctx;
    c.save();
    Models.traceFaceOvalPath(c, currentModel, S);
    c.clip();
    softDab(c, x, y, 42, '#fffbeb', 0.16);
    c.restore();
    if (Math.random() > 0.6) spawnSparkle(x, y, '#ffffff', 1);
  }

  function applyEyeshadowStroke(x, y) {
    const c = shadowLayer.ctx;
    ['left', 'right'].forEach(side => {
      const eye = currentModel.eyes[side];
      const dist = Math.hypot(x - eye.tx * S, y - (eye.lidTop + 0.02) * S);
      if (dist > 140) return;

      c.save();
      Models.traceEyelidPath(c, eye, S, side === 'right');
      c.clip();
      softDab(c, x, y, 34, activeEyeshadow.hex, 0.24);

      // Nunca pinta dentro do olho!
      c.globalCompositeOperation = 'destination-out';
      Models.traceEyeOpeningPath(c, eye, S, 0.002);
      c.fill();
      c.restore();
    });
    if (Math.random() > 0.5) spawnPowderPuff(x, y, activeEyeshadow.hex);
  }

  function applyLipstickStroke(x, y) {
    const c = lipsLayer.ctx;
    c.save();
    Models.traceLipsPath(c, currentModel, S);
    c.clip();
    softDab(c, x, y, 28, activeLipstick.hex, 0.34);
    c.restore();
  }

  function applyGlitterStroke(x, y) {
    const c = glitterLayer.ctx;
    const palette = activeGlitter.colors;
    for (let i = 0; i < 4; i++) {
      const gx = x + (Math.random() - 0.5) * 46;
      const gy = y + (Math.random() - 0.5) * 46;
      const r = 2.5 + Math.random() * 5.2;
      c.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      c.beginPath();
      if (Math.random() > 0.35) {
        c.arc(gx, gy, r * 0.7, 0, Math.PI * 2);
      } else {
        c.moveTo(gx, gy - r * 1.5);
        c.lineTo(gx + r * 0.45, gy - r * 0.45);
        c.lineTo(gx + r * 1.5, gy);
        c.lineTo(gx + r * 0.45, gy + r * 0.45);
        c.lineTo(gx, gy + r * 1.5);
        c.lineTo(gx - r * 0.45, gy + r * 0.45);
        c.lineTo(gx - r * 1.5, gy);
        c.lineTo(gx - r * 0.45, gy - r * 0.45);
        c.closePath();
      }
      c.fill();
    }
    if (Math.random() > 0.5) spawnSparkle(x, y, palette[0], 1);
  }

  function applyMakeupRemover(x, y) {
    [spaLayer, blushLayer, highlightLayer, shadowLayer, lipsLayer, glitterLayer].forEach(layer => {
      const c = layer.ctx;
      c.save();
      c.globalCompositeOperation = 'destination-out';
      const grad = c.createRadialGradient(x, y, 8, x, y, 52);
      grad.addColorStop(0, 'rgba(0,0,0,0.92)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(x, y, 52, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });

    // Também remove delineador/rímel/gloss se esfregar sobre olhos/lábios
    const nx = x / S;
    const ny = y / S;
    ['left', 'right'].forEach(side => {
      const eye = currentModel.eyes[side];
      if (Math.hypot(nx - eye.ix, ny - eye.iy) < 0.08) {
        linerState.progress = Math.max(0, linerState.progress - 0.12);
        mascaraState.level = Math.max(0, mascaraState.level - 0.12);
        browState.level = Math.max(0, browState.level - 0.12);
      }
    });
    if (Math.hypot(nx - 0.5, ny - currentModel.lips.midY) < 0.09) {
      glossLevel = Math.max(0, glossLevel - 0.12);
    }
    faceStickers = faceStickers.filter(st => Math.hypot(st.x - nx, st.y - ny) > 0.055);
  }

  function isNearEyes(nx, ny, radius = 0.095) {
    return ['left', 'right'].some(side => {
      const e = currentModel.eyes[side];
      return Math.hypot(nx - e.ix, ny - e.iy) < radius;
    });
  }

  function isNearBrows(nx, ny) {
    return ['left', 'right'].some(side => {
      const b = currentModel.brows[side][1];
      return Math.hypot(nx - b[0], ny - b[1]) < 0.085;
    });
  }

  function isNearLips(nx, ny) {
    return Math.hypot(nx - 0.5, ny - currentModel.lips.midY) < 0.11;
  }

  function applyActiveTool(x, y, prevX, prevY, isTap = false) {
    if (showBeforeMode) return;
    const dist = Math.hypot(x - prevX, y - prevY);
    const steps = Math.max(1, Math.ceil(dist / 12));
    const nx = x / S;
    const ny = y / S;

    if (activeToolId === 'gems') {
      if (isTap) {
        faceStickers.push({
          x: nx,
          y: ny,
          icon: activeGem,
          size: 0.044,
          rot: (Math.random() - 0.5) * 0.25
        });
        Audio.playGemSparkle();
        spawnSparkle(x, y, '#fef08a', 5);
      }
      return;
    }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = prevX + (x - prevX) * t;
      const sy = prevY + (y - prevY) * t;

      if (activeToolId === 'spa_mask') {
        applySpaMaskStroke(sx, sy);
        Audio.playSpaCream();
      } else if (activeToolId === 'spa_sponge') {
        applySpaSpongeWipe(sx, sy);
        Audio.playRinseWipe();
      } else if (activeToolId === 'blush') {
        applyBlushStroke(sx, sy);
        Audio.playPowderBrush();
      } else if (activeToolId === 'highlighter') {
        applyHighlighterStroke(sx, sy);
        Audio.playPowderBrush();
      } else if (activeToolId === 'eyeshadow') {
        applyEyeshadowStroke(sx, sy);
        Audio.playPowderBrush();
      } else if (activeToolId === 'lipstick') {
        applyLipstickStroke(sx, sy);
        Audio.playLipstickGlide();
      } else if (activeToolId === 'glitter') {
        applyGlitterStroke(sx, sy);
        Audio.playGlitterTick();
      } else if (activeToolId === 'remover') {
        applyMakeupRemover(sx, sy);
        Audio.playRinseWipe();
      }
    }

    // Ferramentas progressivas de precisão (Delineador, Rímel, Sobrancelha, Gloss)
    if (activeToolId === 'eyeliner' && isNearEyes(nx, ny, 0.105)) {
      linerState.color = activeLinerColor.hex;
      linerState.progress = Math.min(1, linerState.progress + (isTap ? 0.25 : 0.06));
      Audio.playPrecisionStroke();
      if (linerState.progress > 0.92 && Math.random() > 0.7) spawnSparkle(x, y, '#ffffff', 1);
    } else if (activeToolId === 'mascara' && isNearEyes(nx, ny, 0.105)) {
      mascaraState.color = activeLinerColor.hex;
      mascaraState.level = Math.min(1, mascaraState.level + (isTap ? 0.22 : 0.055));
      Audio.playPrecisionStroke();
    } else if (activeToolId === 'brows' && isNearBrows(nx, ny)) {
      browState.color = activeLinerColor.hex;
      browState.level = Math.min(1, browState.level + (isTap ? 0.22 : 0.055));
      Audio.playPrecisionStroke();
    } else if (activeToolId === 'gloss' && isNearLips(nx, ny)) {
      glossLevel = Math.min(1, glossLevel + (isTap ? 0.25 : 0.065));
      Audio.playLipstickGlide();
      if (Math.random() > 0.55) spawnSparkle(x, y, '#ffffff', 1);
    }
  }

  // ================== COMPOSIÇÃO REALISTA NO CANVAS PRINCIPAL ==================
  function renderFrame(now) {
    requestAnimationFrame(renderFrame);
    const timeSec = now * 0.001;

    ctx.clearRect(0, 0, S, S);

    // 1. Retrato Base 3D Pixar
    const baseImg = loadedImages[currentModel.id];
    if (baseImg) {
      ctx.drawImage(baseImg, 0, 0, S, S);
    } else {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#db2777';
      ctx.font = 'bold 36px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Carregando camarim...', S / 2, S / 2);
      return;
    }

    // Se modo "Antes" estiver ativo, mostra apenas a foto natural!
    if (!showBeforeMode) {
      // 2. Viço radiante após máscara spa
      if (skinGlow > 0.02) {
        ctx.save();
        Models.traceFaceOvalPath(ctx, currentModel, S);
        ctx.clip();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = `rgba(255, 248, 240, ${skinGlow * 0.28})`;
        ctx.fillRect(0, 0, S, S);
        ctx.restore();
      }

      // 3. Lentes Coloridas (Íris realista)
      Models.drawContactLenses(ctx, currentModel, S, activeLens.hex);

      // 4. Blush (Multiply + Soft-Light suave para fundir na pele 3D)
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.65;
      ctx.drawImage(blushLayer.canvas, 0, 0);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(blushLayer.canvas, 0, 0);
      ctx.restore();

      // 5. Iluminador (Screen glow)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.72;
      ctx.drawImage(highlightLayer.canvas, 0, 0);
      ctx.restore();

      // 6. Sombra de Olhos (Multiply + leve brilho acetinado Screen)
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.74;
      ctx.drawImage(shadowLayer.canvas, 0, 0);
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.24;
      ctx.drawImage(shadowLayer.canvas, 0, 0);
      ctx.restore();

      // 7. Sobrancelha, Delineador Gatinho e Cílios com Rímel
      Models.drawBrowTint(ctx, currentModel, S, browState);
      Models.drawEyeliner(ctx, currentModel, S, linerState);
      Models.drawMascaraLashes(ctx, currentModel, S, mascaraState);

      // 8. Batom (Multiply + Soft-Light preservando textura real dos lábios!) + Gloss
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.62;
      ctx.drawImage(lipsLayer.canvas, 0, 0);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.46;
      ctx.drawImage(lipsLayer.canvas, 0, 0);
      ctx.restore();

      Models.drawLipGlossShine(ctx, currentModel, S, glossLevel);

      // 9. Máscara Facial Spa Cremosa (por cima da pele até ser enxaguada)
      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.drawImage(spaLayer.canvas, 0, 0);
      ctx.restore();

      // 10. Glitter & Pedrinhas Faciais
      ctx.drawImage(glitterLayer.canvas, 0, 0);
      faceStickers.forEach(st => {
        ctx.save();
        ctx.translate(st.x * S, st.y * S);
        ctx.rotate(st.rot);
        ctx.font = `${Math.round(st.size * S)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.icon, 0, 0);
        ctx.restore();
      });

      // 11. Acessórios (Tiara/Coroa, Brincos, Colar)
      Models.drawAccessories(ctx, currentModel, S, accessories, timeSec);
    }

    // 12. Partículas (Espuma, Pó, Brilhos)
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
        ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'powder') {
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
        g.addColorStop(0, hexToRgba(p.color, 0.45));
        g.addColorStop(1, hexToRgba(p.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        const r = p.r * p.life;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.32, -r * 0.32);
        ctx.lineTo(r, 0);
        ctx.lineTo(r * 0.32, r * 0.32);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.32, r * 0.32);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.32, -r * 0.32);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 13. Ferramenta Articulada Seguindo o Dedo/Mouse
    if (ptr.visible && !showBeforeMode) {
      Tools.drawMakeupToolCursor(ctx, {
        x: ptr.x,
        y: ptr.y,
        toolId: activeToolId,
        color: getCurrentToolColor(),
        gemIcon: activeGem,
        isDown: ptr.isDown,
        moveSpeed: ptr.moveSpeed,
        timeSec
      });
    }

    // 14. Flash da Foto Glam
    if (flashOpacity > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, S, S);
      flashOpacity *= 0.86;
    }
  }

  function getCurrentToolColor() {
    if (activeToolId === 'spa_mask') return activeSpaMask.hex;
    if (activeToolId === 'blush') return activeBlush.hex;
    if (activeToolId === 'eyeshadow') return activeEyeshadow.hex;
    if (['eyeliner', 'mascara', 'brows'].includes(activeToolId)) return activeLinerColor.hex;
    if (activeToolId === 'lipstick') return activeLipstick.hex;
    if (activeToolId === 'glitter') return activeGlitter.colors[0];
    return '#f472b6';
  }

  // ================== EVENTOS DE PONTEIRO UNIFICADOS ==================
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

    if (!showBeforeMode) {
      pushUndo();
      applyActiveTool(pt.x, pt.y, pt.x, pt.y, true);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const pt = clientToStage(e);
    ptr.moveSpeed = Math.hypot(pt.x - ptr.x, pt.y - ptr.y);
    ptr.prevX = ptr.x;
    ptr.prevY = ptr.y;
    ptr.x = pt.x;
    ptr.y = pt.y;
    ptr.visible = true;

    if (ptr.isDown && ptr.activeId === e.pointerId) {
      applyActiveTool(pt.x, pt.y, ptr.prevX, ptr.prevY, false);
    }
  });

  function releasePtr(e) {
    if (ptr.activeId !== e.pointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    ptr.activeId = null;
    ptr.isDown = false;
  }

  canvas.addEventListener('pointerup', releasePtr);
  canvas.addEventListener('pointercancel', releasePtr);
  canvas.addEventListener('pointerleave', () => {
    if (!ptr.isDown) ptr.visible = false;
  });

  // ================== UI DOS MENUS LATERAIS & MODELOS ==================
  function updateHint() {
    const el = document.getElementById('tool-hint');
    if (!el) return;
    el.textContent = showBeforeMode
      ? '👀 Visualizando o rosto natural (Antes) — toque novamente para voltar!'
      : (Tools.TOOL_HINTS[activeToolId] || '✨ Deslize o dedo sobre o rosto para maquiar!');
  }

  function renderModelSwitcher() {
    const wrap = document.getElementById('model-switcher');
    wrap.innerHTML = '';
    Models.MODELS.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `model-pill ${currentModel.id === m.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${m.badge}</span><span>${m.name}</span>`;
      btn.addEventListener('click', () => {
        Audio.init();
        Audio.playUiSelect(640);
        if (currentModel.id !== m.id) {
          currentModel = m;
          clearAllMakeup(false);
          renderModelSwitcher();
          renderSidePanel();
        }
      });
      wrap.appendChild(btn);
    });
  }

  function setTool(toolId) {
    Audio.init();
    Audio.playUiSelect(580);
    activeToolId = toolId;
    showBeforeMode = false;
    document.getElementById('btn-before').classList.remove('active');
    renderSidePanel();
    updateHint();
  }

  function renderSidePanel() {
    const tabsEl = document.getElementById('menu-tabs');
    const bodyEl = document.getElementById('menu-body');
    tabsEl.innerHTML = '';
    bodyEl.innerHTML = '';

    const tabs = [
      { id: 'spa', icon: '🫧', label: 'Spa', defaultTool: 'spa_mask' },
      { id: 'face', icon: '🌸', label: 'Pele', defaultTool: 'blush' },
      { id: 'eyes', icon: '👁️', label: 'Olhos', defaultTool: 'eyeshadow' },
      { id: 'lips', icon: '💄', label: 'Lábios', defaultTool: 'lipstick' },
      { id: 'glam', icon: '✨', label: 'Glam', defaultTool: 'glitter' },
      { id: 'acc', icon: '👑', label: 'Joias', defaultTool: null }
    ];

    tabs.forEach(tb => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `tab-btn ${activeTab === tb.id ? 'active' : ''}`;
      b.innerHTML = `<span>${tb.icon}</span><span>${tb.label}</span>`;
      b.addEventListener('click', () => {
        Audio.init();
        Audio.playUiSelect(520);
        activeTab = tb.id;
        if (tb.defaultTool) activeToolId = tb.defaultTool;
        renderSidePanel();
        updateHint();
      });
      tabsEl.appendChild(b);
    });

    function addToolRow(items) {
      const row = document.createElement('div');
      row.className = 'sub-tools-row';
      items.forEach(([id, icon, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `sub-pill ${activeToolId === id ? 'active' : ''}`;
        b.innerHTML = `${icon} ${label}`;
        b.addEventListener('click', () => setTool(id));
        row.appendChild(b);
      });
      bodyEl.appendChild(row);
    }

    function addSectionTitle(txt) {
      const d = document.createElement('div');
      d.className = 'section-title';
      d.textContent = txt;
      bodyEl.appendChild(d);
    }

    function addColorGrid(list, activeItem, onPick) {
      const grid = document.createElement('div');
      grid.className = 'swatch-grid';
      list.forEach(item => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = item.name;
        b.className = `color-swatch ${activeItem.id === item.id ? 'active' : ''}`;
        b.style.background = item.swatch || item.hex;
        b.addEventListener('click', () => {
          Audio.init();
          Audio.playUiSelect(620);
          onPick(item);
          renderSidePanel();
          updateHint();
        });
        grid.appendChild(b);
      });
      bodyEl.appendChild(grid);
    }

    if (activeTab === 'spa') {
      addToolRow([
        ['spa_mask', '🫧', 'Máscara'],
        ['spa_sponge', '🧽', 'Enxaguar'],
        ['remover', '🧼', 'Demaquilar']
      ]);
      addSectionTitle('Escolha a Máscara Facial:');
      addColorGrid(Tools.SPA_MASKS, activeSpaMask, item => {
        activeSpaMask = item;
        activeToolId = 'spa_mask';
      });
    } else if (activeTab === 'face') {
      addToolRow([
        ['blush', '🌸', 'Blush'],
        ['highlighter', '✨', 'Iluminador'],
        ['remover', '🧼', 'Apagar']
      ]);
      addSectionTitle('Tons de Blush:');
      addColorGrid(Tools.BLUSH_COLORS, activeBlush, item => {
        activeBlush = item;
        activeToolId = 'blush';
      });
    } else if (activeTab === 'eyes') {
      addToolRow([
        ['eyeshadow', '🎨', 'Sombra'],
        ['eyeliner', '✏️', 'Delineador'],
        ['mascara', '👁️', 'Rímel'],
        ['brows', '🖌️', 'Sobranc.']
      ]);

      if (activeToolId === 'eyeshadow') {
        addSectionTitle('Paleta de Sombras:');
        addColorGrid(Tools.EYESHADOW_COLORS, activeEyeshadow, item => {
          activeEyeshadow = item;
        });
      } else {
        addSectionTitle('Cor de Delineador / Rímel:');
        addColorGrid(Tools.LINER_COLORS, activeLinerColor, item => {
          activeLinerColor = item;
        });
      }

      addSectionTitle('Lentes Coloridas (Cor dos Olhos):');
      addColorGrid(Tools.LENS_COLORS, activeLens, item => {
        activeLens = item;
        Audio.playGemSparkle();
      });
    } else if (activeTab === 'lips') {
      addToolRow([
        ['lipstick', '💄', 'Batom'],
        ['gloss', '✨', 'Gloss Brilho'],
        ['remover', '🧼', 'Remover']
      ]);
      addSectionTitle('Cores de Batom:');
      addColorGrid(Tools.LIPSTICK_COLORS, activeLipstick, item => {
        activeLipstick = item;
        activeToolId = 'lipstick';
      });
    } else if (activeTab === 'glam') {
      addToolRow([
        ['glitter', '🌟', 'Glitter'],
        ['gems', '💎', 'Pedrinhas'],
        ['remover', '🧼', 'Limpar']
      ]);
      if (activeToolId === 'glitter') {
        addSectionTitle('Brilho Mágico:');
        const row = document.createElement('div');
        row.className = 'sub-tools-row';
        Tools.GLITTER_SETS.forEach(gl => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `sub-pill ${activeGlitter.id === gl.id ? 'active' : ''}`;
          b.textContent = `✨ ${gl.name}`;
          b.addEventListener('click', () => {
            Audio.playUiSelect(650);
            activeGlitter = gl;
            renderSidePanel();
          });
          row.appendChild(b);
        });
        bodyEl.appendChild(row);
      } else {
        addSectionTitle('Toque no rosto para colar:');
        const grid = document.createElement('div');
        grid.className = 'gem-grid';
        Tools.FACE_GEMS.forEach(emoji => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `gem-btn ${activeGem === emoji && activeToolId === 'gems' ? 'active' : ''}`;
          b.textContent = emoji;
          b.addEventListener('click', () => {
            Audio.playUiSelect(700);
            activeGem = emoji;
            activeToolId = 'gems';
            renderSidePanel();
            updateHint();
          });
          grid.appendChild(b);
        });
        bodyEl.appendChild(grid);
      }
    } else if (activeTab === 'acc') {
      function addAccRow(title, items, propName) {
        addSectionTitle(title);
        const row = document.createElement('div');
        row.className = 'sub-tools-row';
        items.forEach(item => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `sub-pill ${accessories[propName] === item.id ? 'active' : ''}`;
          b.innerHTML = `${item.icon} ${item.name}`;
          b.addEventListener('click', () => {
            Audio.init();
            Audio.playGemSparkle();
            accessories[propName] = item.id;
            spawnSparkle(S * 0.5, S * (propName === 'tiara' ? 0.18 : (propName === 'necklace' ? 0.82 : 0.58)), '#fef08a', 6);
            renderSidePanel();
          });
          row.appendChild(b);
        });
        bodyEl.appendChild(row);
      }
      addAccRow('👑 Tiara / Coroa:', Tools.TIARAS, 'tiara');
      addAccRow('💎 Brincos:', Tools.EARRINGS, 'earrings');
      addAccRow('📿 Colar:', Tools.NECKLACES, 'necklace');
    }
  }

  // ================== FOTO GLAM FINAL ==================
  function takeGlamPhoto() {
    Audio.init();
    Audio.playCameraGlam();
    showBeforeMode = false;
    document.getElementById('btn-before').classList.remove('active');
    flashOpacity = 0.92;
    spawnSparkle(S * 0.5, S * 0.48, '#fef08a', 14);
    spawnSparkle(S * 0.5, S * 0.55, '#f472b6', 10);

    // Exporta imagem limpa sem o cursor de ferramenta
    const wasVisible = ptr.visible;
    ptr.visible = false;
    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.download = `maquiagem-${currentModel.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (_) {}
      ptr.visible = wasVisible;
    }, 60);
  }

  // ================== INICIALIZAÇÃO ==================
  function init() {
    renderModelSwitcher();
    renderSidePanel();
    updateHint();
    updateUndoBtn();

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = Audio.setEnabled(!Audio.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) Audio.playUiSelect(620);
    });

    document.getElementById('btn-undo').addEventListener('click', performUndo);

    document.getElementById('btn-clear').addEventListener('click', () => {
      Audio.playUiSelect(400);
      clearAllMakeup(false);
      renderSidePanel();
    });

    const beforeBtn = document.getElementById('btn-before');
    beforeBtn.addEventListener('click', () => {
      Audio.playUiSelect(560);
      showBeforeMode = !showBeforeMode;
      beforeBtn.classList.toggle('active', showBeforeMode);
      updateHint();
    });

    document.getElementById('btn-photo').addEventListener('click', takeGlamPhoto);

    requestAnimationFrame(renderFrame);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
