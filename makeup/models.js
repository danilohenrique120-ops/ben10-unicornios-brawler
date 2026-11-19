// Salão de Maquiagem Realista Kids - Modelos 3D Calibradas, Máscaras Anatômicas e Acessórios HD
window.MakeupModels = (() => {
  const MODELS = [
    {
      id: 'sofia',
      name: 'Sofia',
      badge: '🌸',
      src: 'assets/sofia.jpg',
      theme: '#f472b6',
      face: { cx: 0.50, cy: 0.515, rx: 0.212, ry: 0.252 },
      eyes: {
        left:  { ix: 0.402, iy: 0.500, ir: 0.029, x1: 0.346, y1: 0.498, tx: 0.398, ty: 0.466, x2: 0.448, y2: 0.505, bx: 0.398, by: 0.530, lidTop: 0.432 },
        right: { ix: 0.598, iy: 0.500, ir: 0.029, x1: 0.552, y1: 0.505, tx: 0.602, ty: 0.466, x2: 0.654, y2: 0.498, bx: 0.602, by: 0.530, lidTop: 0.432 }
      },
      brows: {
        left:  [[0.322, 0.448], [0.376, 0.422], [0.456, 0.434]],
        right: [[0.544, 0.434], [0.624, 0.422], [0.678, 0.448]]
      },
      cheeks: {
        left:  { x: 0.358, y: 0.585, rx: 0.068, ry: 0.052 },
        right: { x: 0.642, y: 0.585, rx: 0.068, ry: 0.052 }
      },
      nose: { x: 0.500, y: 0.578 },
      lips: {
        x1: 0.415, y1: 0.652, x2: 0.585, y2: 0.652,
        cupidL: [0.478, 0.643], cupidC: [0.500, 0.648], cupidR: [0.522, 0.643],
        bottomY: 0.694, midY: 0.660
      },
      ears: { left: [0.290, 0.598], right: [0.710, 0.598] },
      neck: { x1: 0.405, y1: 0.785, cx: 0.500, cy: 0.842, x2: 0.595, y2: 0.785 },
      tiara: { cx: 0.500, cy: 0.165, w: 0.35 }
    },
    {
      id: 'maya',
      name: 'Maya',
      badge: '💜',
      src: 'assets/maya.jpg',
      theme: '#a855f7',
      face: { cx: 0.50, cy: 0.528, rx: 0.184, ry: 0.232 },
      eyes: {
        left:  { ix: 0.414, iy: 0.506, ir: 0.027, x1: 0.366, y1: 0.506, tx: 0.412, ty: 0.476, x2: 0.453, y2: 0.511, bx: 0.412, by: 0.530, lidTop: 0.446 },
        right: { ix: 0.586, iy: 0.506, ir: 0.027, x1: 0.547, y1: 0.511, tx: 0.588, ty: 0.476, x2: 0.634, y2: 0.506, bx: 0.588, by: 0.530, lidTop: 0.446 }
      },
      brows: {
        left:  [[0.352, 0.455], [0.398, 0.435], [0.458, 0.442]],
        right: [[0.542, 0.442], [0.602, 0.435], [0.648, 0.455]]
      },
      cheeks: {
        left:  { x: 0.376, y: 0.586, rx: 0.062, ry: 0.048 },
        right: { x: 0.624, y: 0.586, rx: 0.062, ry: 0.048 }
      },
      nose: { x: 0.500, y: 0.578 },
      lips: {
        x1: 0.412, y1: 0.638, x2: 0.588, y2: 0.638,
        cupidL: [0.475, 0.628], cupidC: [0.500, 0.634], cupidR: [0.525, 0.628],
        bottomY: 0.694, midY: 0.652
      },
      ears: { left: [0.314, 0.594], right: [0.686, 0.594] },
      neck: { x1: 0.395, y1: 0.805, cx: 0.500, cy: 0.860, x2: 0.605, y2: 0.805 },
      tiara: { cx: 0.500, cy: 0.210, w: 0.34 }
    },
    {
      id: 'luna',
      name: 'Luna',
      badge: '🌿',
      src: 'assets/luna.jpg',
      theme: '#10b981',
      face: { cx: 0.50, cy: 0.508, rx: 0.194, ry: 0.232 },
      eyes: {
        left:  { ix: 0.411, iy: 0.484, ir: 0.028, x1: 0.358, y1: 0.484, tx: 0.406, ty: 0.454, x2: 0.450, y2: 0.489, bx: 0.406, by: 0.514, lidTop: 0.424 },
        right: { ix: 0.589, iy: 0.484, ir: 0.028, x1: 0.550, y1: 0.489, tx: 0.594, ty: 0.454, x2: 0.642, y2: 0.484, bx: 0.594, by: 0.514, lidTop: 0.424 }
      },
      brows: {
        left:  [[0.340, 0.436], [0.395, 0.414], [0.458, 0.424]],
        right: [[0.542, 0.424], [0.605, 0.414], [0.660, 0.436]]
      },
      cheeks: {
        left:  { x: 0.368, y: 0.570, rx: 0.064, ry: 0.050 },
        right: { x: 0.632, y: 0.570, rx: 0.064, ry: 0.050 }
      },
      nose: { x: 0.500, y: 0.562 },
      lips: {
        x1: 0.418, y1: 0.625, x2: 0.582, y2: 0.625,
        cupidL: [0.478, 0.616], cupidC: [0.500, 0.622], cupidR: [0.522, 0.616],
        bottomY: 0.668, midY: 0.635
      },
      ears: { left: [0.304, 0.574], right: [0.696, 0.574] },
      neck: { x1: 0.405, y1: 0.775, cx: 0.500, cy: 0.830, x2: 0.595, y2: 0.775 },
      tiara: { cx: 0.500, cy: 0.165, w: 0.35 }
    }
  ];

  // Traça o contorno anatômico dos lábios
  function traceLipsPath(ctx, model, S) {
    const l = model.lips;
    ctx.beginPath();
    ctx.moveTo(l.x1 * S, l.y1 * S);
    ctx.quadraticCurveTo(((l.x1 + l.cupidL[0]) * 0.5) * S, (l.cupidL[1] + 0.002) * S, l.cupidL[0] * S, l.cupidL[1] * S);
    ctx.quadraticCurveTo(l.cupidC[0] * S, (l.cupidC[1] + 0.003) * S, l.cupidR[0] * S, l.cupidR[1] * S);
    ctx.quadraticCurveTo(((l.x2 + l.cupidR[0]) * 0.5) * S, (l.cupidR[1] + 0.002) * S, l.x2 * S, l.y2 * S);
    ctx.bezierCurveTo(
      (l.x2 - 0.025) * S, (l.bottomY - 0.004) * S,
      (l.x1 + 0.025) * S, (l.bottomY - 0.004) * S,
      l.x1 * S, l.y1 * S
    );
    ctx.closePath();
  }

  // Traça a abertura do globo ocular (para proteger os olhos da sombra e da máscara spa)
  function traceEyeOpeningPath(ctx, eye, S, pad = 0) {
    ctx.beginPath();
    ctx.moveTo((eye.x1 - pad) * S, eye.y1 * S);
    ctx.quadraticCurveTo(eye.tx * S, (eye.ty - pad) * S, (eye.x2 + pad) * S, eye.y2 * S);
    ctx.quadraticCurveTo(eye.bx * S, (eye.by + pad) * S, (eye.x1 - pad) * S, eye.y1 * S);
    ctx.closePath();
  }

  // Traça a zona da pálpebra superior (sombra realista esfumada acima do olho)
  function traceEyelidPath(ctx, eye, S, isRight) {
    const outerPad = 0.024;
    const innerPad = 0.01;
    const lx = (eye.x1 - (isRight ? innerPad : outerPad)) * S;
    const rx = (eye.x2 + (isRight ? outerPad : innerPad)) * S;
    ctx.beginPath();
    ctx.moveTo(lx, (eye.y1 + 0.005) * S);
    ctx.quadraticCurveTo(eye.tx * S, (eye.lidTop - 0.012) * S, rx, (eye.y2 + 0.005) * S);
    ctx.quadraticCurveTo(eye.tx * S, (eye.ty + 0.006) * S, lx, (eye.y1 + 0.005) * S);
    ctx.closePath();
  }

  // Traça o oval do rosto (para máscara facial spa e blush)
  function traceFaceOvalPath(ctx, model, S) {
    const f = model.face;
    ctx.beginPath();
    ctx.ellipse(f.cx * S, f.cy * S, f.rx * S, f.ry * S, 0, 0, Math.PI * 2);
    ctx.closePath();
  }

  // Desenha Lentes Coloridas mantendo a pupila e reflexos de estúdio reais!
  function drawContactLenses(ctx, model, S, lensColor) {
    if (!lensColor || lensColor === 'natural') return;
    ['left', 'right'].forEach(side => {
      const eye = model.eyes[side];
      ctx.save();
      traceEyeOpeningPath(ctx, eye, S, -0.002);
      ctx.clip();

      const cx = eye.ix * S;
      const cy = eye.iy * S;
      const r = eye.ir * S;

      // Anel da íris (deixando a pupila central escura intacta!)
      const grad = ctx.createRadialGradient(cx, cy, r * 0.38, cx, cy, r * 1.05);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.45, lensColor);
      grad.addColorStop(0.88, lensColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // Brilho luminoso sutil na íris
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.restore();
    });
  }

  // Desenha Delineado Gatinho realista acompanhando o contorno exato dos olhos
  function drawEyeliner(ctx, model, S, linerState) {
    if (!linerState || !linerState.color || linerState.progress <= 0.02) return;
    const p = Math.min(1, linerState.progress);

    ['left', 'right'].forEach(side => {
      const eye = model.eyes[side];
      const isRight = side === 'right';
      ctx.save();
      ctx.strokeStyle = linerState.color;
      ctx.fillStyle = linerState.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.88 * p;

      const xStart = (isRight ? eye.x1 : eye.x2) * S;
      const yStart = (isRight ? eye.y1 : eye.y2) * S;
      const xEnd = (isRight ? eye.x2 : eye.x1) * S;
      const yEnd = (isRight ? eye.y2 : eye.y1) * S;
      const wingDir = isRight ? 1 : -1;

      // Linha superior elegante
      ctx.lineWidth = (3.5 + p * 3.8) * (S / 1024);
      ctx.beginPath();
      ctx.moveTo(xStart, yStart - 1);
      ctx.quadraticCurveTo(eye.tx * S, (eye.ty - 0.002) * S, xEnd, yEnd - 1);
      ctx.stroke();

      // Puxadinho gatinho na ponta externa quando progress > 0.35
      if (p > 0.35) {
        const wingLen = (p - 0.35) / 0.65;
        const wx = xEnd + wingDir * (0.026 * wingLen) * S;
        const wy = yEnd - (0.019 * wingLen) * S;
        ctx.beginPath();
        ctx.moveTo(xEnd - wingDir * 0.006 * S, yEnd - 4 * (S / 1024));
        ctx.quadraticCurveTo(xEnd + wingDir * 0.01 * S, yEnd - 3 * (S / 1024), wx, wy);
        ctx.quadraticCurveTo(xEnd + wingDir * 0.008 * S, yEnd + 3 * (S / 1024), xEnd - wingDir * 0.004 * S, yEnd + 2 * (S / 1024));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Desenha Cílios curvados fio-a-fio com Rímel
  function drawMascaraLashes(ctx, model, S, mascaraState) {
    if (!mascaraState || mascaraState.level <= 0.02) return;
    const lvl = Math.min(1, mascaraState.level);
    const col = mascaraState.color || '#111827';

    ['left', 'right'].forEach(side => {
      const eye = model.eyes[side];
      const isRight = side === 'right';
      const lashCount = 13;

      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85 * lvl;

      for (let i = 0; i < lashCount; i++) {
        const t = i / (lashCount - 1);
        // Ponto na curva quadrática superior do olho
        const u = 1 - t;
        const px = (u * u * eye.x1 + 2 * u * t * eye.tx + t * t * eye.x2) * S;
        const py = (u * u * eye.y1 + 2 * u * t * eye.ty + t * t * eye.y2) * S;

        // Cílios mais longos no canto externo
        const outerFactor = isRight ? t : (1 - t);
        const len = (0.010 + outerFactor * 0.018) * lvl * S;
        const spreadAngle = -Math.PI * 0.5 + (t - 0.5) * 1.15;
        const tipX = px + Math.cos(spreadAngle) * len;
        const tipY = py + Math.sin(spreadAngle) * len;
        const ctrlX = px + Math.cos(spreadAngle - (isRight ? -0.15 : 0.15)) * len * 0.55;
        const ctrlY = py + Math.sin(spreadAngle) * len * 0.45;

        ctx.lineWidth = (1.6 + outerFactor * 1.4) * (S / 1024);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // Sobrancelhas estilizadas/definidas
  function drawBrowTint(ctx, model, S, browState) {
    if (!browState || !browState.color || browState.level <= 0.02) return;
    ctx.save();
    ctx.strokeStyle = browState.color;
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.48 * Math.min(1, browState.level);
    ctx.lineWidth = 0.022 * S;

    ['left', 'right'].forEach(side => {
      const pts = model.brows[side];
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * S, pts[0][1] * S);
      ctx.quadraticCurveTo(pts[1][0] * S, pts[1][1] * S, pts[2][0] * S, pts[2][1] * S);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Brilho úmido realista de Gloss nos lábios
  function drawLipGlossShine(ctx, model, S, glossLevel) {
    if (glossLevel <= 0.02) return;
    const l = model.lips;
    const g = Math.min(1, glossLevel);
    ctx.save();
    traceLipsPath(ctx, model, S);
    ctx.clip();

    // Reflexo principal no lábio inferior (efeito molhado 3D)
    const cx = 0.50 * S;
    const cy = ((l.midY + l.bottomY) * 0.5) * S;
    const grad = ctx.createRadialGradient(cx - 0.01 * S, cy - 0.002 * S, 2, cx, cy, 0.065 * S);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.72 * g})`);
    grad.addColorStop(0.55, `rgba(255, 255, 255, ${0.26 * g})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 0.056 * S, 0.012 * S, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pontinho luminoso no arco do cupido
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 * g})`;
    ctx.beginPath();
    ctx.ellipse(l.cupidL[0] * S, (l.cupidL[1] + 0.006) * S, 0.015 * S, 0.004 * S, -0.1, 0, Math.PI * 2);
    ctx.ellipse(l.cupidR[0] * S, (l.cupidR[1] + 0.006) * S, 0.015 * S, 0.004 * S, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Desenha Acessórios HD (Coroa/Tiara, Brincos, Colares)
  function drawAccessories(ctx, model, S, acc, timeSec) {
    const shimmer = 0.7 + Math.sin(timeSec * 4) * 0.3;

    // 1. Tiara / Coroa
    if (acc.tiara && acc.tiara !== 'none') {
      const t = model.tiara;
      const cx = t.cx * S;
      const cy = t.cy * S;
      const w = t.w * S;
      ctx.save();
      ctx.translate(cx, cy);

      if (acc.tiara === 'crown') {
        const grad = ctx.createLinearGradient(0, -w * 0.34, 0, w * 0.08);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 3 * (S / 1024);

        ctx.beginPath();
        ctx.moveTo(-w * 0.42, w * 0.05);
        ctx.lineTo(-w * 0.46, -w * 0.20);
        ctx.lineTo(-w * 0.22, -w * 0.06);
        ctx.lineTo(0, -w * 0.32);
        ctx.lineTo(w * 0.22, -w * 0.06);
        ctx.lineTo(w * 0.46, -w * 0.20);
        ctx.lineTo(w * 0.42, w * 0.05);
        ctx.quadraticCurveTo(0, w * 0.14, -w * 0.42, w * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Joias na coroa
        [[-0.24, -0.02, '#ec4899'], [0, -0.11, '#38bdf8'], [0.24, -0.02, '#ec4899']].forEach(([gx, gy, gc]) => {
          ctx.fillStyle = gc;
          ctx.beginPath();
          ctx.arc(gx * w, gy * w, w * 0.042, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${shimmer})`;
          ctx.beginPath();
          ctx.arc((gx - 0.01) * w, (gy - 0.01) * w, w * 0.016, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (acc.tiara === 'flowers') {
        const flowers = [
          [-0.36, 0.05, '🌸', 0.14],
          [-0.18, -0.04, '🌺', 0.16],
          [0, -0.08, '🌼', 0.18],
          [0.18, -0.04, '🌺', 0.16],
          [0.36, 0.05, '🌸', 0.14]
        ];
        flowers.forEach(([fx, fy, emoji, sz]) => {
          ctx.font = `${Math.round(w * sz)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, fx * w, fy * w);
        });
      } else if (acc.tiara === 'unicorn') {
        // Chifre dourado + orelhinhas fofas
        ctx.fillStyle = '#fbcfe8';
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 3 * (S / 1024);
        [-1, 1].forEach(dir => {
          ctx.beginPath();
          ctx.moveTo(dir * w * 0.14, w * 0.02);
          ctx.lineTo(dir * w * 0.34, -w * 0.25);
          ctx.lineTo(dir * w * 0.38, w * 0.06);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        const hGrad = ctx.createLinearGradient(0, -w * 0.42, 0, 0);
        hGrad.addColorStop(0, '#fef08a');
        hGrad.addColorStop(0.5, '#f472b6');
        hGrad.addColorStop(1, '#a855f7');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.08, w * 0.02);
        ctx.lineTo(0, -w * 0.40);
        ctx.lineTo(w * 0.08, w * 0.02);
        ctx.closePath();
        ctx.fill();
      } else if (acc.tiara === 'bow') {
        ctx.font = `${Math.round(w * 0.34)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎀', 0, -w * 0.06);
      }
      ctx.restore();
    }

    // 2. Brincos (Orelhas esquerda e direita)
    if (acc.earrings && acc.earrings !== 'none') {
      ['left', 'right'].forEach(side => {
        const [ex, ey] = model.ears[side];
        const px = ex * S;
        const py = ey * S;
        ctx.save();
        ctx.translate(px, py);

        if (acc.earrings === 'pearls') {
          const pGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 0.018 * S);
          pGrad.addColorStop(0, '#ffffff');
          pGrad.addColorStop(0.7, '#f1f5f9');
          pGrad.addColorStop(1, '#cbd5e1');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(0, 0.012 * S, 0.016 * S, 0, Math.PI * 2);
          ctx.fill();
        } else if (acc.earrings === 'hoops') {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 4.5 * (S / 1024);
          ctx.beginPath();
          ctx.arc(0, 0.022 * S, 0.022 * S, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const icon = acc.earrings === 'stars' ? '⭐' : (acc.earrings === 'hearts' ? '💖' : '💎');
          ctx.font = `${Math.round(0.042 * S)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, 0, 0.016 * S);
        }
        ctx.restore();
      });
    }

    // 3. Colares no pescoço/colo
    if (acc.necklace && acc.necklace !== 'none') {
      const n = model.neck;
      ctx.save();
      if (acc.necklace === 'pearls') {
        const count = 13;
        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const u = 1 - t;
          const x = (u * u * n.x1 + 2 * u * t * n.cx + t * t * n.x2) * S;
          const y = (u * u * n.y1 + 2 * u * t * n.cy + t * t * n.y2) * S;
          const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 0.012 * S);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.7, '#f8fafc');
          g.addColorStop(1, '#94a3b8');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 0.011 * S, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = acc.necklace === 'rainbow' ? '#ec4899' : '#facc15';
        ctx.lineWidth = 4.5 * (S / 1024);
        ctx.beginPath();
        ctx.moveTo(n.x1 * S, n.y1 * S);
        ctx.quadraticCurveTo(n.cx * S, n.cy * S, n.x2 * S, n.y2 * S);
        ctx.stroke();

        const charm = acc.necklace === 'heart' ? '💖' : (acc.necklace === 'star' ? '⭐' : '💎');
        ctx.font = `${Math.round(0.046 * S)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(charm, n.cx * S, (n.cy + 0.012) * S);
      }
      ctx.restore();
    }
  }

  return {
    MODELS,
    traceLipsPath,
    traceEyeOpeningPath,
    traceEyelidPath,
    traceFaceOvalPath,
    drawContactLenses,
    drawEyeliner,
    drawMascaraLashes,
    drawBrowTint,
    drawLipGlossShine,
    drawAccessories
  };
})();
