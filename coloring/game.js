// Estúdio de Desenho & Colorir Kids - Motor Duas Camadas + Balde Scanline + Giz Realista
(() => {
  const { BASE_W, BASE_H, TEMPLATES } = window.ColoringTemplates;
  const Audio = window.ColoringAudio;

  const paintCanvas = document.getElementById('paint-canvas');
  const paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });

  const lineCanvas = document.getElementById('line-canvas');
  const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });

  paintCanvas.width = BASE_W;
  paintCanvas.height = BASE_H;
  lineCanvas.width = BASE_W;
  lineCanvas.height = BASE_H;

  const COLORS = [
    { name: 'Vermelho', hex: '#ef4444' },
    { name: 'Laranja', hex: '#f97316' },
    { name: 'Amarelo', hex: '#facc15' },
    { name: 'Verde Claro', hex: '#4ade80' },
    { name: 'Verde', hex: '#16a34a' },
    { name: 'Azul Céu', hex: '#38bdf8' },
    { name: 'Azul Royal', hex: '#2563eb' },
    { name: 'Roxo', hex: '#9333ea' },
    { name: 'Rosa', hex: '#ec4899' },
    { name: 'Rosa Claro', hex: '#f9a8d4' },
    { name: 'Marrom', hex: '#92400e' },
    { name: 'Pêssego', hex: '#fdba74' },
    { name: 'Preto', hex: '#1e293b' },
    { name: 'Branco', hex: '#ffffff' }
  ];

  const TOOLS = [
    { id: 'brush', icon: '🖌️', name: 'Pincel' },
    { id: 'crayon', icon: '🖍️', name: 'Giz de Cera' },
    { id: 'rainbow', icon: '🌈', name: 'Arco-Íris' },
    { id: 'sparkle', icon: '✨', name: 'Estrelas' },
    { id: 'bucket', icon: '🪣', name: 'Balde Tinta' },
    { id: 'eraser', icon: '🧽', name: 'Borracha' },
    { id: 'stamp', icon: '🌟', name: 'Carimbo' }
  ];

  const STAMPS = ['⭐', '❤️', '🦄', '🦕', '🦋', '🌸', '🌈', '☀️', '🚀', '🐱'];
  const SIZES = [
    { id: 'sm', label: 'P', radius: 7, stampPx: 40 },
    { id: 'md', label: 'M', radius: 15, stampPx: 58 },
    { id: 'lg', label: 'G', radius: 26, stampPx: 80 }
  ];

  let activeTemplateId = 'unicorn';
  let activeToolId = 'bucket';
  let activeColor = COLORS[8].hex;
  let activeSize = SIZES[1];
  let activeStamp = STAMPS[0];
  let rainbowHue = 0;

  const undoStack = [];
  const MAX_UNDO = 16;

  let activePointerId = null;
  let isDrawing = false;
  let lastPt = null;

  // ================== HISTÓRICO (DESFAZER) ==================
  function pushUndoSnapshot() {
    try {
      const snap = paintCtx.getImageData(0, 0, BASE_W, BASE_H);
      undoStack.push(snap);
      if (undoStack.length > MAX_UNDO) {
        undoStack.shift();
      }
      updateUndoButton();
    } catch (_) {}
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack.pop();
    paintCtx.putImageData(prev, 0, 0);
    Audio.playUiPop(420);
    updateUndoButton();
  }

  function updateUndoButton() {
    const btn = document.getElementById('btn-undo');
    if (btn) {
      btn.disabled = undoStack.length === 0;
      btn.style.opacity = undoStack.length === 0 ? '0.5' : '1';
    }
  }

  // ================== DESENHO DE MOLDES & FUNDO ==================
  function clearPaintLayer() {
    paintCtx.fillStyle = '#ffffff';
    paintCtx.fillRect(0, 0, BASE_W, BASE_H);
  }

  function renderTemplateOutline(templateId) {
    activeTemplateId = templateId;
    lineCtx.clearRect(0, 0, BASE_W, BASE_H);
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    lineCtx.save();
    lineCtx.strokeStyle = '#1e293b';
    lineCtx.fillStyle = '#1e293b';
    lineCtx.lineWidth = 6;
    lineCtx.lineCap = 'round';
    lineCtx.lineJoin = 'round';
    tpl.draw(lineCtx);
    lineCtx.restore();
  }

  function selectTemplate(templateId) {
    Audio.playUiPop(600);
    undoStack.length = 0;
    clearPaintLayer();
    renderTemplateOutline(templateId);
    updateUndoButton();
    renderTemplatesBar();
    // Auto-select brush on blank sheet or bucket on coloring pages if helpful
    if (templateId === 'blank' && activeToolId === 'bucket') {
      activeToolId = 'brush';
      renderToolsPanel();
    }
  }

  // ================== BALDE DE TINTA (SCANLINE FLOOD FILL RÁPIDO) ==================
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function floodFillAt(startX, startY, fillHex) {
    const sx = Math.floor(startX);
    const sy = Math.floor(startY);
    if (sx < 0 || sx >= BASE_W || sy < 0 || sy >= BASE_H) return false;

    const paintImg = paintCtx.getImageData(0, 0, BASE_W, BASE_H);
    const lineImg = lineCtx.getImageData(0, 0, BASE_W, BASE_H);
    const pData = paintImg.data;
    const lData = lineImg.data;

    const startIdx = (sy * BASE_W + sx) * 4;
    // Se clicou exatamente em cima do contorno preto, não faz nada
    if (lData[startIdx + 3] > 110) return false;

    const sr = pData[startIdx];
    const sg = pData[startIdx + 1];
    const sb = pData[startIdx + 2];

    const fillRgb = hexToRgb(fillHex);
    if (Math.abs(sr - fillRgb.r) <= 4 && Math.abs(sg - fillRgb.g) <= 4 && Math.abs(sb - fillRgb.b) <= 4) {
      return false;
    }

    const tol = 38;
    const visited = new Uint8Array(BASE_W * BASE_H);

    function isMatch(pixelIndex) {
      if (visited[pixelIndex]) return false;
      const idx4 = pixelIndex * 4;
      // Parede de contorno preto no lineCanvas
      if (lData[idx4 + 3] > 95) return false;
      const dr = pData[idx4] - sr;
      const dg = pData[idx4 + 1] - sg;
      const db = pData[idx4 + 2] - sb;
      return Math.abs(dr) <= tol && Math.abs(dg) <= tol && Math.abs(db) <= tol;
    }

    function paintPixel(pixelIndex) {
      visited[pixelIndex] = 1;
      const idx4 = pixelIndex * 4;
      pData[idx4] = fillRgb.r;
      pData[idx4 + 1] = fillRgb.g;
      pData[idx4 + 2] = fillRgb.b;
      pData[idx4 + 3] = 255;
    }

    const stack = [[sx, sy]];
    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      let lx = cx;
      while (lx >= 0 && isMatch(cy * BASE_W + lx)) {
        lx--;
      }
      lx++;

      let spanAbove = false;
      let spanBelow = false;

      while (lx < BASE_W && isMatch(cy * BASE_W + lx)) {
        const pIdx = cy * BASE_W + lx;
        paintPixel(pIdx);

        if (cy > 0) {
          const aboveOk = isMatch((cy - 1) * BASE_W + lx);
          if (!spanAbove && aboveOk) {
            stack.push([lx, cy - 1]);
            spanAbove = true;
          } else if (spanAbove && !aboveOk) {
            spanAbove = false;
          }
        }
        if (cy < BASE_H - 1) {
          const belowOk = isMatch((cy + 1) * BASE_W + lx);
          if (!spanBelow && belowOk) {
            stack.push([lx, cy + 1]);
            spanBelow = true;
          } else if (spanBelow && !belowOk) {
            spanBelow = false;
          }
        }
        lx++;
      }
    }

    paintCtx.putImageData(paintImg, 0, 0);
    return true;
  }

  // ================== PINCÉIS, GIZ, ARCO-ÍRIS & CARIMBO ==================
  function drawBrushSegment(from, to) {
    const r = activeSize.radius;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(2, r * 0.35)));

    if (activeToolId === 'brush' || activeToolId === 'eraser') {
      paintCtx.save();
      paintCtx.lineCap = 'round';
      paintCtx.lineJoin = 'round';
      paintCtx.lineWidth = r * 2;
      paintCtx.strokeStyle = activeToolId === 'eraser' ? '#ffffff' : activeColor;
      paintCtx.beginPath();
      paintCtx.moveTo(from.x, from.y);
      paintCtx.lineTo(to.x, to.y);
      paintCtx.stroke();
      paintCtx.restore();
    } else if (activeToolId === 'rainbow') {
      paintCtx.save();
      paintCtx.lineCap = 'round';
      paintCtx.lineWidth = r * 2;
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps;
        const t1 = (i + 1) / steps;
        const x0 = from.x + (to.x - from.x) * t0;
        const y0 = from.y + (to.y - from.y) * t0;
        const x1 = from.x + (to.x - from.x) * t1;
        const y1 = from.y + (to.y - from.y) * t1;
        rainbowHue = (rainbowHue + 4) % 360;
        paintCtx.strokeStyle = `hsl(${rainbowHue}, 90%, 56%)`;
        paintCtx.beginPath();
        paintCtx.moveTo(x0, y0);
        paintCtx.lineTo(x1, y1);
        paintCtx.stroke();
      }
      paintCtx.restore();
    } else if (activeToolId === 'crayon') {
      paintCtx.save();
      paintCtx.fillStyle = activeColor;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        const grains = Math.floor(r * 1.4);
        for (let g = 0; g < grains; g++) {
          const ang = Math.random() * Math.PI * 2;
          const rad = Math.random() * r;
          const gx = cx + Math.cos(ang) * rad;
          const gy = cy + Math.sin(ang) * rad;
          const dot = 1.4 + Math.random() * 2.5;
          paintCtx.globalAlpha = 0.35 + Math.random() * 0.45;
          paintCtx.fillRect(gx, gy, dot, dot);
        }
      }
      paintCtx.restore();
    } else if (activeToolId === 'sparkle') {
      paintCtx.save();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        for (let k = 0; k < 3; k++) {
          const ox = cx + (Math.random() - 0.5) * r * 2.2;
          const oy = cy + (Math.random() - 0.5) * r * 2.2;
          const sr = 2.5 + Math.random() * (r * 0.48);
          paintCtx.fillStyle = Math.random() > 0.35
            ? activeColor
            : `hsl(${Math.floor(Math.random() * 360)}, 92%, 62%)`;
          paintCtx.beginPath();
          paintCtx.moveTo(ox, oy - sr);
          paintCtx.lineTo(ox + sr * 0.32, oy - sr * 0.32);
          paintCtx.lineTo(ox + sr, oy);
          paintCtx.lineTo(ox + sr * 0.32, oy + sr * 0.32);
          paintCtx.lineTo(ox, oy + sr);
          paintCtx.lineTo(ox - sr * 0.32, oy + sr * 0.32);
          paintCtx.lineTo(ox - sr, oy);
          paintCtx.lineTo(ox - sr * 0.32, oy - sr * 0.32);
          paintCtx.closePath();
          paintCtx.fill();
        }
      }
      paintCtx.restore();
    }

    Audio.playStrokeTick(activeToolId);
  }

  function stampAt(pt) {
    paintCtx.save();
    paintCtx.font = `${activeSize.stampPx}px sans-serif`;
    paintCtx.textAlign = 'center';
    paintCtx.textBaseline = 'middle';
    paintCtx.translate(pt.x, pt.y);
    paintCtx.rotate((Math.random() - 0.5) * 0.25);
    paintCtx.fillText(activeStamp, 0, 0);
    paintCtx.restore();
    Audio.playStamp();
  }

  // ================== COORDENADAS & POINTER EVENTS ==================
  function clientToCanvasPoint(e) {
    const rect = paintCanvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * BASE_W,
      y: ((e.clientY - rect.top) / rect.height) * BASE_H
    };
  }

  paintCanvas.addEventListener('pointerdown', (e) => {
    Audio.init();
    if (activePointerId !== null && activePointerId !== e.pointerId) return;
    activePointerId = e.pointerId;
    try { paintCanvas.setPointerCapture(e.pointerId); } catch (_) {}

    const pt = clientToCanvasPoint(e);
    pushUndoSnapshot();

    if (activeToolId === 'bucket') {
      const filled = floodFillAt(pt.x, pt.y, activeColor);
      if (filled) {
        Audio.playBucketSplash();
      } else {
        undoStack.pop();
        updateUndoButton();
      }
      return;
    }

    if (activeToolId === 'stamp') {
      stampAt(pt);
      return;
    }

    isDrawing = true;
    lastPt = pt;
    drawBrushSegment(pt, { x: pt.x + 0.1, y: pt.y + 0.1 });
  });

  paintCanvas.addEventListener('pointermove', (e) => {
    if (!isDrawing || activePointerId !== e.pointerId || !lastPt) return;
    const pt = clientToCanvasPoint(e);
    drawBrushSegment(lastPt, pt);
    lastPt = pt;
  });

  function stopDrawing(e) {
    if (activePointerId !== e.pointerId) return;
    try { paintCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
    activePointerId = null;
    isDrawing = false;
    lastPt = null;
  }

  paintCanvas.addEventListener('pointerup', stopDrawing);
  paintCanvas.addEventListener('pointercancel', stopDrawing);

  // ================== SALVAR PNG & LIMPAR ==================
  function saveArtwork() {
    Audio.init();
    Audio.playSaveFanfare();

    const out = document.createElement('canvas');
    out.width = BASE_W;
    out.height = BASE_H;
    const octx = out.getContext('2d');
    octx.drawImage(paintCanvas, 0, 0);
    octx.drawImage(lineCanvas, 0, 0);

    const flash = document.getElementById('save-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 220);
    }

    try {
      const link = document.createElement('a');
      link.download = `meu-desenho-${activeTemplateId}.png`;
      link.href = out.toDataURL('image/png');
      link.click();
    } catch (_) {}
  }

  // ================== UI BUILDERS ==================
  function renderTemplatesBar() {
    const bar = document.getElementById('templates-bar');
    bar.innerHTML = '';
    TEMPLATES.forEach(tpl => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tpl-btn ${activeTemplateId === tpl.id ? 'active' : ''}`;
      btn.innerHTML = `<span>${tpl.icon}</span><span>${tpl.name}</span>`;
      btn.addEventListener('click', () => selectTemplate(tpl.id));
      bar.appendChild(btn);
    });
  }

  function renderToolsPanel() {
    const grid = document.getElementById('tools-grid');
    grid.innerHTML = '';
    TOOLS.forEach(tool => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tool-btn ${activeToolId === tool.id ? 'active' : ''}`;
      btn.innerHTML = `<span class="icon">${tool.icon}</span><span class="label">${tool.name}</span>`;
      btn.addEventListener('click', () => {
        Audio.init();
        Audio.playUiPop(540);
        activeToolId = tool.id;
        renderToolsPanel();
        renderContextSubOptions();
      });
      grid.appendChild(btn);
    });
  }

  function renderSizesRow() {
    const row = document.getElementById('sizes-row');
    row.innerHTML = '';
    SIZES.forEach(sz => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `size-btn ${activeSize.id === sz.id ? 'active' : ''}`;
      btn.textContent = sz.label;
      btn.addEventListener('click', () => {
        Audio.playUiPop(620);
        activeSize = sz;
        renderSizesRow();
      });
      row.appendChild(btn);
    });
  }

  function renderContextSubOptions() {
    const stampsWrap = document.getElementById('stamps-wrap');
    const colorsWrap = document.getElementById('colors-wrap');

    if (activeToolId === 'stamp') {
      stampsWrap.classList.remove('hidden');
      colorsWrap.classList.add('hidden');
      stampsWrap.innerHTML = '';
      STAMPS.forEach(emoji => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `stamp-btn ${activeStamp === emoji ? 'active' : ''}`;
        b.textContent = emoji;
        b.addEventListener('click', () => {
          Audio.playUiPop(680);
          activeStamp = emoji;
          renderContextSubOptions();
        });
        stampsWrap.appendChild(b);
      });
    } else {
      stampsWrap.classList.add('hidden');
      colorsWrap.classList.remove('hidden');
      colorsWrap.innerHTML = '';
      COLORS.forEach(col => {
        const b = document.createElement('button');
        b.type = 'button';
        b.title = col.name;
        b.className = `color-btn ${activeColor === col.hex ? 'active' : ''}`;
        b.style.background = col.hex;
        b.addEventListener('click', () => {
          Audio.init();
          Audio.playUiPop(580);
          activeColor = col.hex;
          if (activeToolId === 'eraser') {
            activeToolId = 'brush';
            renderToolsPanel();
          }
          renderContextSubOptions();
        });
        colorsWrap.appendChild(b);
      });
    }
  }

  function init() {
    clearPaintLayer();
    renderTemplateOutline(activeTemplateId);
    renderTemplatesBar();
    renderToolsPanel();
    renderSizesRow();
    renderContextSubOptions();
    updateUndoButton();

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = Audio.setEnabled(!Audio.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) Audio.playUiPop(620);
    });

    document.getElementById('btn-undo').addEventListener('click', performUndo);

    document.getElementById('btn-clear').addEventListener('click', () => {
      Audio.playUiPop(380);
      pushUndoSnapshot();
      clearPaintLayer();
    });

    document.getElementById('btn-save').addEventListener('click', saveArtwork);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
