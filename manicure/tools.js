// Salão de Manicure Kids - Catálogo de Ferramentas, Cores e Desenho Realista Animado
window.ManicureTools = (() => {
  const SKIN_TONES = [
    { id: 'fair', name: 'Clara', base: '#fbd5c0', mid: '#f3be9f', shadow: '#dd9f7e', highlight: '#ffeadc', nailBed: '#f6c0b8' },
    { id: 'peach', name: 'Média', base: '#eec09d', mid: '#e0a97f', shadow: '#c5875c', highlight: '#fbd8bc', nailBed: '#e8ab9e' },
    { id: 'tan', name: 'Dourada', base: '#d49a6a', mid: '#bf804f', shadow: '#9c6036', highlight: '#e7b58a', nailBed: '#cf9183' },
    { id: 'deep', name: 'Negra', base: '#8c5535', mid: '#764326', shadow: '#572d16', highlight: '#aa6f4c', nailBed: '#a66b60' }
  ];

  const POLISH_COLORS = [
    { id: 'pink', name: 'Rosa Chiclete', hex: '#ec4899', shine: '#fbcfe8' },
    { id: 'red', name: 'Vermelho Cereja', hex: '#dc2626', shine: '#fecaca' },
    { id: 'lilac', name: 'Lilás Pastel', hex: '#a855f7', shine: '#e9d5ff' },
    { id: 'sky', name: 'Azul Céu', hex: '#0ea5e9', shine: '#bae6fd' },
    { id: 'mint', name: 'Verde Menta', hex: '#10b981', shine: '#a7f3d0' },
    { id: 'yellow', name: 'Amarelo Sol', hex: '#facc15', shine: '#fef9c3' },
    { id: 'coral', name: 'Coral Pêssego', hex: '#fb7185', shine: '#ffe4e6' },
    { id: 'grape', name: 'Roxo Uva', hex: '#6d28d9', shine: '#ddd6fe' },
    { id: 'white', name: 'Branco Leite', hex: '#f8fafc', shine: '#ffffff' },
    { id: 'gold', name: 'Dourado Festa', hex: '#eab308', shine: '#fef08a' },
    { id: 'black', name: 'Preto Estrela', hex: '#1e293b', shine: '#94a3b8' },
    { id: 'rainbow', name: 'Arco-Íris', hex: 'rainbow', shine: '#ffffff' }
  ];

  const GLITTER_OPTIONS = [
    { id: 'silver', name: 'Prata Brilho', colors: ['#ffffff', '#e2e8f0', '#cbd5e1', '#bae6fd'] },
    { id: 'gold', name: 'Ouro Estrela', colors: ['#fef08a', '#facc15', '#fde047', '#ffffff'] },
    { id: 'pink', name: 'Rosa Fada', colors: ['#fbcfe8', '#f472b6', '#ec4899', '#ffffff'] },
    { id: 'holo', name: 'Holográfico', colors: ['#f472b6', '#38bdf8', '#a855f7', '#4ade80', '#facc15'] }
  ];

  const STICKERS = [
    { id: 'flower', icon: '🌸', name: 'Flor' },
    { id: 'butterfly', icon: '🦋', name: 'Borboleta' },
    { id: 'gem', icon: '💎', name: 'Diamante' },
    { id: 'star', icon: '⭐', name: 'Estrela' },
    { id: 'heart', icon: '❤️', name: 'Coração' },
    { id: 'unicorn', icon: '🦄', name: 'Unicórnio' },
    { id: 'berry', icon: '🍓', name: 'Morango' },
    { id: 'bow', icon: '🎀', name: 'Lacinho' },
    { id: 'rainbow', icon: '🌈', name: 'Arco-Íris' },
    { id: 'crown', icon: '👑', name: 'Coroa' }
  ];

  const CARE_TOOLS = [
    { id: 'sponge', icon: '🫧', name: 'Esponja', hint: 'Esfregue nas unhas para limpar com espuma!' },
    { id: 'clipper', icon: '✂️', name: 'Cortador', hint: 'Toque na ponta da unha crescida para cortar!' },
    { id: 'file', icon: '📏', name: 'Lixa', hint: 'Passe vai-e-vem na ponta da unha para alisar!' },
    { id: 'cream', icon: '🧴', name: 'Creme', hint: 'Massageie ao redor das unhas para hidratar!' },
    { id: 'pusher', icon: '🧹', name: 'Espátula', hint: 'Deslize na base da unha para cuidar da cutícula!' },
    { id: 'remover', icon: '🧼', name: 'Algodão', hint: 'Esfregue para remover esmalte, glitter e adesivos!' }
  ];

  const ART_TOOLS = [
    { id: 'polish', icon: '💅', name: 'Pincel Esmalte', hint: 'Deslize o pincel pela unha para pintar de verdade!' },
    { id: 'glitter', icon: '✨', name: 'Pincel Glitter', hint: 'Espalhe brilho mágico por cima do esmalte!' },
    { id: 'dots', icon: '🎨', name: 'Boleador', hint: 'Toque na unha para fazer bolinhas coloridas!' },
    { id: 'french', icon: '🌙', name: 'Francesinha', hint: 'Passe na pontinha da unha para fazer francesinha!' },
    { id: 'sticker', icon: '💎', name: 'Pinça Adesivo', hint: 'Toque na unha com a pinça para colar o enfeite!' },
    { id: 'dryer', icon: '💨', name: 'Secador', hint: 'Segure sobre as unhas para secar e dar extra brilho!' }
  ];

  // Desenha ferramenta realista articulada seguindo o ponteiro
  function drawActiveToolCursor(ctx, opts) {
    const {
      x, y, toolId, isDown, moveAngle, moveSpeed,
      polishColor, glitterOption, stickerIcon, clipAnim, pressAnim, timeSec
    } = opts;

    ctx.save();
    ctx.translate(x, y);

    const speedTilt = Math.max(-0.35, Math.min(0.35, moveAngle * 0.15));
    const pressScale = isDown ? 0.94 : 1.0;

    if (toolId === 'sponge') {
      ctx.rotate(-0.2 + Math.sin(timeSec * 14) * (isDown ? 0.08 : 0));
      ctx.scale(1 + (isDown ? 0.08 : 0), isDown ? 0.84 : 1);
      // Sponge body
      ctx.fillStyle = '#facc15';
      roundRect(ctx, -28, -22, 56, 30, 10);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Scrub pad bottom
      ctx.fillStyle = '#38bdf8';
      roundRect(ctx, -28, 2, 56, 12, 6);
      ctx.fill();
      // Pores
      ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
      [[-14, -12], [0, -14], [14, -10], [-8, -4], [9, -5]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (toolId === 'clipper') {
      ctx.rotate(-0.45);
      const jawOpen = isDown ? (1 - clipAnim) * 0.32 : 0.32;
      // Bottom chrome jaw
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(48, -6);
      ctx.lineTo(48, 8);
      ctx.lineTo(-4, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Upper hinged jaw
      ctx.save();
      ctx.rotate(-jawOpen);
      ctx.fillStyle = '#f43f5e';
      roundRect(ctx, -6, -15, 56, 12, 5);
      ctx.fill();
      ctx.strokeStyle = '#be123c';
      ctx.stroke();
      // Cutting tip
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-8, -3);
      ctx.lineTo(2, -13);
      ctx.lineTo(2, 1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (toolId === 'file') {
      const rub = isDown ? Math.sin(timeSec * 28) * 10 : 0;
      ctx.translate(rub, 0);
      ctx.rotate(-0.35 + speedTilt * 0.4);
      // Wooden core + pink emery grip
      ctx.fillStyle = '#f472b6';
      roundRect(ctx, -10, -76, 20, 90, 9);
      ctx.fill();
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Grit texture strip
      ctx.fillStyle = '#e2e8f0';
      roundRect(ctx, -6, -70, 12, 52, 5);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      for (let gy = -66; gy < -20; gy += 6) {
        ctx.fillRect(-4, gy, 8, 2);
      }
    } else if (toolId === 'cream') {
      ctx.rotate(0.45);
      ctx.scale(pressScale, pressScale);
      // Nozzle drop
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 6, isDown ? 9 : 6, 0, Math.PI * 2);
      ctx.fill();
      // Tube cap & body
      ctx.fillStyle = '#f9a8d4';
      roundRect(ctx, -16, -64, 32, 56, 8);
      ctx.fill();
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -7, -8, 14, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#be185d';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPA', 0, -32);
    } else if (toolId === 'pusher') {
      ctx.rotate(0.38);
      ctx.scale(pressScale, pressScale);
      // Chrome handle
      const grad = ctx.createLinearGradient(-6, -85, 6, 0);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.5, '#94a3b8');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      roundRect(ctx, -5, -88, 10, 78, 4);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Spoon tip
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(-7, 4);
      ctx.quadraticCurveTo(0, 10, 7, 4);
      ctx.lineTo(4, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (toolId === 'remover') {
      ctx.rotate(Math.sin(timeSec * 12) * (isDown ? 0.1 : 0));
      ctx.scale(pressScale, isDown ? 0.88 : 1);
      // Fluffy cotton pad
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -4, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
      ctx.beginPath();
      ctx.ellipse(2, 2, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (toolId === 'polish' || toolId === 'glitter') {
      const flex = isDown ? Math.max(-0.28, Math.min(0.28, (moveSpeed || 0) * 0.01)) : 0;
      ctx.rotate(0.42 + flex);

      const paintCol = toolId === 'glitter'
        ? (glitterOption ? glitterOption.colors[Math.floor(timeSec * 8) % glitterOption.colors.length] : '#facc15')
        : (polishColor && polishColor.hex !== 'rainbow'
          ? polishColor.hex
          : `hsl(${Math.floor(timeSec * 160) % 360}, 88%, 58%)`);

      // Bristles bending on pressure
      ctx.save();
      ctx.scale(1, isDown ? 0.85 : 1);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-5, -24);
      ctx.lineTo(-8, -2);
      ctx.quadraticCurveTo(0, 12, 8, -2);
      ctx.lineTo(5, -24);
      ctx.closePath();
      ctx.fill();
      // Wet polish tip
      ctx.fillStyle = paintCol;
      ctx.beginPath();
      ctx.moveTo(-6.5, -8);
      ctx.quadraticCurveTo(0, 11, 6.5, -8);
      ctx.quadraticCurveTo(0, -4, -6.5, -8);
      ctx.fill();
      ctx.restore();

      // Stem + Cap
      ctx.fillStyle = '#334155';
      ctx.fillRect(-3.5, -52, 7, 30);
      ctx.fillStyle = toolId === 'glitter' ? '#c084fc' : paintCol;
      roundRect(ctx, -13, -96, 26, 46, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (toolId === 'dots' || toolId === 'french') {
      ctx.rotate(0.36);
      const tipColor = polishColor && polishColor.hex !== 'rainbow'
        ? polishColor.hex
        : `hsl(${Math.floor(timeSec * 160) % 360}, 88%, 58%)`;
      ctx.fillStyle = '#f472b6';
      roundRect(ctx, -5, -92, 10, 74, 5);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = tipColor;
      ctx.beginPath();
      ctx.arc(0, 2, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (toolId === 'sticker') {
      ctx.rotate(0.32);
      const pinch = isDown ? 2 : 7;
      // Tweezers prongs
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, -84);
      ctx.lineTo(-pinch, -4);
      ctx.moveTo(4, -84);
      ctx.lineTo(pinch, -4);
      ctx.stroke();
      // Sticker held at tip
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stickerIcon || '💎', 0, 2);
    } else if (toolId === 'dryer') {
      ctx.rotate(0.25);
      // Animated warm air / UV shimmer cone
      if (isDown || pressAnim > 0) {
        const glowGrad = ctx.createRadialGradient(0, 26, 4, 0, 32, 46);
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 26, 46, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          const offset = (timeSec * 60 + i * 15) % 28;
          ctx.beginPath();
          ctx.moveTo(i * 10, 6 + offset);
          ctx.lineTo(i * 12, 16 + offset);
          ctx.stroke();
        }
      }
      // Cute Pastel Hair/Nail Dryer
      ctx.fillStyle = '#f472b6';
      roundRect(ctx, -22, -52, 44, 34, 14);
      ctx.fill();
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Nozzle pointing down
      ctx.fillStyle = '#334155';
      roundRect(ctx, -11, -20, 22, 16, 4);
      ctx.fill();
      // Handle
      ctx.fillStyle = '#fbcfe8';
      roundRect(ctx, 10, -28, 12, 30, 5);
      ctx.fill();
    }

    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return {
    SKIN_TONES,
    POLISH_COLORS,
    GLITTER_OPTIONS,
    STICKERS,
    CARE_TOOLS,
    ART_TOOLS,
    drawActiveToolCursor
  };
})();
