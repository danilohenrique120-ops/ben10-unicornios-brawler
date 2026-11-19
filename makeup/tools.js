// Salão de Maquiagem Realista Kids - Catálogo Completo de Cosméticos e Ferramentas Animadas
window.MakeupTools = (() => {
  const SPA_MASKS = [
    { id: 'pink_clay', name: 'Argila Rosa', hex: '#f9a8d4' },
    { id: 'cucumber', name: 'Pepino Spa', hex: '#86efac' },
    { id: 'gold', name: 'Ouro 24k', hex: '#fde047' },
    { id: 'lavender', name: 'Lavanda', hex: '#d8b4fe' }
  ];

  const BLUSH_COLORS = [
    { id: 'doll', name: 'Rosa Boneca', hex: '#f472b6' },
    { id: 'peach', name: 'Pêssego', hex: '#fb923c' },
    { id: 'coral', name: 'Coral', hex: '#fb7185' },
    { id: 'berry', name: 'Framboesa', hex: '#db2777' },
    { id: 'mauve', name: 'Malva', hex: '#c084fc' },
    { id: 'cherry', name: 'Cereja', hex: '#e11d48' },
    { id: 'bronze', name: 'Bronzeado', hex: '#d97706' },
    { id: 'petal', name: 'Pétala', hex: '#fda4af' }
  ];

  const EYESHADOW_COLORS = [
    { id: 'rose_gold', name: 'Rosa Gold', hex: '#f472b6' },
    { id: 'lilac', name: 'Lilás Fada', hex: '#a855f7' },
    { id: 'sky', name: 'Azul Céu', hex: '#38bdf8' },
    { id: 'mint', name: 'Verde Menta', hex: '#34d399' },
    { id: 'gold', name: 'Dourado', hex: '#facc15' },
    { id: 'sunset', name: 'Coral Sol', hex: '#fb7185' },
    { id: 'violet', name: 'Roxo Noite', hex: '#7c3aed' },
    { id: 'ocean', name: 'Azul Mar', hex: '#2563eb' },
    { id: 'emerald', name: 'Esmeralda', hex: '#059669' },
    { id: 'champagne', name: 'Champagne', hex: '#fde68a' },
    { id: 'berry', name: 'Ameixa', hex: '#be185d' },
    { id: 'cocoa', name: 'Cacau', hex: '#92400e' }
  ];

  const LINER_COLORS = [
    { id: 'black', name: 'Preto', hex: '#111827' },
    { id: 'navy', name: 'Azul', hex: '#1d4ed8' },
    { id: 'purple', name: 'Roxo', hex: '#7e22ce' },
    { id: 'pink', name: 'Rosa', hex: '#db2777' },
    { id: 'gold', name: 'Dourado', hex: '#ca8a04' }
  ];

  const LENS_COLORS = [
    { id: 'natural', name: 'Natural', hex: 'natural', swatch: 'linear-gradient(135deg,#e2e8f0,#94a3b8)' },
    { id: 'sapphire', name: 'Azul', hex: '#0284c7', swatch: '#0284c7' },
    { id: 'emerald', name: 'Verde', hex: '#10b981', swatch: '#10b981' },
    { id: 'violet', name: 'Violeta', hex: '#8b5cf6', swatch: '#8b5cf6' },
    { id: 'amber', name: 'Mel', hex: '#d97706', swatch: '#d97706' },
    { id: 'aqua', name: 'Turquesa', hex: '#06b6d4', swatch: '#06b6d4' }
  ];

  const LIPSTICK_COLORS = [
    { id: 'bubblegum', name: 'Rosa Chiclete', hex: '#ec4899' },
    { id: 'classic_red', name: 'Vermelho', hex: '#dc2626' },
    { id: 'coral', name: 'Coral', hex: '#fb7185' },
    { id: 'strawberry', name: 'Morango', hex: '#e11d48' },
    { id: 'nude_pink', name: 'Rosa Nude', hex: '#f472b6' },
    { id: 'peach', name: 'Pêssego', hex: '#f97316' },
    { id: 'plum', name: 'Uva', hex: '#9333ea' },
    { id: 'magenta', name: 'Fúcsia', hex: '#d946ef' },
    { id: 'wine', name: 'Cereja Escuro', hex: '#9f1239' },
    { id: 'lilac', name: 'Lilás Pop', hex: '#a855f7' },
    { id: 'gold', name: 'Ouro Pop', hex: '#eab308' },
    { id: 'rose', name: 'Pétala', hex: '#fda4af' }
  ];

  const GLITTER_SETS = [
    { id: 'gold', name: 'Ouro', colors: ['#fef08a', '#facc15', '#ffffff'] },
    { id: 'silver', name: 'Cristal', colors: ['#ffffff', '#e0f2fe', '#cbd5e1'] },
    { id: 'pink', name: 'Rosa Fada', colors: ['#fbcfe8', '#f472b6', '#ffffff'] },
    { id: 'holo', name: 'Arco-Íris', colors: ['#f472b6', '#38bdf8', '#a855f7', '#4ade80', '#facc15'] }
  ];

  const FACE_GEMS = ['💎', '⭐', '✨', '🦋', '🌸', '💖', '👑', '🌈', '🌙', '🦄'];

  const TIARAS = [
    { id: 'none', icon: '🚫', name: 'Sem' },
    { id: 'crown', icon: '👑', name: 'Coroa' },
    { id: 'flowers', icon: '🌸', name: 'Flores' },
    { id: 'unicorn', icon: '🦄', name: 'Unicórnio' },
    { id: 'bow', icon: '🎀', name: 'Laço' }
  ];

  const EARRINGS = [
    { id: 'none', icon: '🚫', name: 'Sem' },
    { id: 'pearls', icon: '⚪', name: 'Pérola' },
    { id: 'stars', icon: '⭐', name: 'Estrela' },
    { id: 'hearts', icon: '💖', name: 'Coração' },
    { id: 'gems', icon: '💎', name: 'Joia' },
    { id: 'hoops', icon: '🟡', name: 'Argola' }
  ];

  const NECKLACES = [
    { id: 'none', icon: '🚫', name: 'Sem' },
    { id: 'pearls', icon: '📿', name: 'Pérolas' },
    { id: 'heart', icon: '💖', name: 'Coração' },
    { id: 'star', icon: '⭐', name: 'Estrela' },
    { id: 'gem', icon: '💎', name: 'Diamante' }
  ];

  const TOOL_HINTS = {
    spa_mask: '🫧 Pincel Spa: Passe no rosto para aplicar a máscara cremosa!',
    spa_sponge: '🧽 Esponja Úmida: Esfregue suavemente para enxaguar a máscara!',
    blush: '🌸 Pincel de Blush: Passe nas bochechas para dar cor saudável!',
    highlighter: '✨ Iluminador: Passe nas maçãs e pontinha do nariz para brilhar!',
    eyeshadow: '🎨 Sombra: Passe suavemente nas pálpebras acima dos olhos!',
    eyeliner: '✏️ Delineador: Passe em volta dos olhos para o delineado gatinho!',
    mascara: '👁️ Rímel: Escove os cílios para deixar longos e curvados!',
    brows: '🖌️ Sobrancelhas: Penteie e realce as sobrancelhas!',
    lipstick: '💄 Batom: Deslize nos lábios para colorir com precisão!',
    gloss: '✨ Gloss: Passe nos lábios para dar efeito molhado brilhante!',
    glitter: '🌟 Glitter: Espalhe estrelinhas cintilantes onde quiser no rosto!',
    gems: '💎 Pedrinhas: Toque no rosto com a pinça para colar enfeites!',
    remover: '🧼 Lenço Demaquilante: Passe onde quiser apagar a maquiagem!'
  };

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

  // Renderização detalhada de cada pincel/cosmético seguindo o dedo/mouse
  function drawMakeupToolCursor(ctx, opts) {
    const { x, y, toolId, color, gemIcon, isDown, moveSpeed, timeSec } = opts;
    ctx.save();
    ctx.translate(x, y);

    const flex = isDown ? Math.max(-0.24, Math.min(0.24, (moveSpeed || 0) * 0.012)) : 0;

    if (toolId === 'blush' || toolId === 'highlighter' || toolId === 'glitter') {
      ctx.rotate(0.45 + flex);
      // Cerdas fofas em leque
      const bGrad = ctx.createRadialGradient(0, -10, 4, 0, -8, 22);
      bGrad.addColorStop(0, color || '#f472b6');
      bGrad.addColorStop(0.65, '#475569');
      bGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(0, -12, isDown ? 21 : 18, isDown ? 17 : 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Virola dourada + cabo rosa
      ctx.fillStyle = '#fbbf24';
      roundRect(ctx, -9, -46, 18, 20, 3);
      ctx.fill();
      ctx.fillStyle = toolId === 'glitter' ? '#a855f7' : '#ec4899';
      roundRect(ctx, -7, -110, 14, 66, 6);
      ctx.fill();
    } else if (toolId === 'lipstick') {
      ctx.rotate(0.42 + flex * 0.5);
      // Bala do batom chanfrada na cor escolhida
      ctx.fillStyle = color || '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-10, -28);
      ctx.lineTo(-9, -4);
      ctx.quadraticCurveTo(0, 8, 9, -8);
      ctx.lineTo(10, -28);
      ctx.closePath();
      ctx.fill();
      // Reflexo brilhante na bala
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(-3, -14, 2.5, 8, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Tubo dourado luxuoso
      const gGrad = ctx.createLinearGradient(-13, 0, 13, 0);
      gGrad.addColorStop(0, '#b45309');
      gGrad.addColorStop(0.5, '#fef08a');
      gGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = gGrad;
      roundRect(ctx, -13, -72, 26, 46, 4);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, -14, -104, 28, 34, 6);
      ctx.fill();
    } else if (toolId === 'gloss') {
      ctx.rotate(0.42 + flex);
      // Aplicador espuminha molhada
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(0, -4, 6.5, 11, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(-2, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-2.5, -56, 5, 44);
      ctx.fillStyle = '#f472b6';
      roundRect(ctx, -11, -100, 22, 46, 7);
      ctx.fill();
    } else if (toolId === 'eyeshadow') {
      ctx.rotate(0.4 + flex);
      // Pontinha esponja com sombra
      ctx.fillStyle = color || '#a855f7';
      ctx.beginPath();
      ctx.ellipse(0, -4, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3.5, -34, 7, 20);
      ctx.fillStyle = '#db2777';
      roundRect(ctx, -5, -102, 10, 70, 5);
      ctx.fill();
    } else if (toolId === 'eyeliner' || toolId === 'brows') {
      ctx.rotate(0.38);
      ctx.fillStyle = color || '#111827';
      ctx.beginPath();
      ctx.moveTo(-3.5, -18);
      ctx.lineTo(0, 2);
      ctx.lineTo(3.5, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, -5, -105, 10, 88, 5);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-5, -34, 10, 7);
    } else if (toolId === 'mascara') {
      ctx.rotate(0.4 + flex);
      // Escovinha (spoolie) de rímel
      ctx.fillStyle = color || '#111827';
      for (let i = -24; i <= 0; i += 4) {
        ctx.fillRect(-7, i, 14, 2.2);
      }
      ctx.fillRect(-2, -55, 4, 56);
      ctx.fillStyle = '#ec4899';
      roundRect(ctx, -11, -102, 22, 48, 8);
      ctx.fill();
    } else if (toolId === 'spa_mask') {
      ctx.rotate(0.36 + flex);
      // Espátula/Pincel de silicone spa com creme colorido
      ctx.fillStyle = color || '#f9a8d4';
      roundRect(ctx, -14, -22, 28, 24, 8);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, -6, -98, 12, 78, 6);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (toolId === 'spa_sponge' || toolId === 'remover') {
      const wobble = isDown ? Math.sin(timeSec * 16) * 0.1 : 0;
      ctx.rotate(wobble);
      ctx.scale(isDown ? 1.06 : 1, isDown ? 0.86 : 1);
      ctx.fillStyle = toolId === 'spa_sponge' ? '#fde047' : '#ffffff';
      ctx.strokeStyle = toolId === 'spa_sponge' ? '#eab308' : '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -4, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (toolId === 'gems') {
      ctx.rotate(0.32);
      const pinch = isDown ? 2 : 7;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, -84);
      ctx.lineTo(-pinch, -4);
      ctx.moveTo(4, -84);
      ctx.lineTo(pinch, -4);
      ctx.stroke();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gemIcon || '💎', 0, 2);
    }

    ctx.restore();
  }

  return {
    SPA_MASKS,
    BLUSH_COLORS,
    EYESHADOW_COLORS,
    LINER_COLORS,
    LENS_COLORS,
    LIPSTICK_COLORS,
    GLITTER_SETS,
    FACE_GEMS,
    TIARAS,
    EARRINGS,
    NECKLACES,
    TOOL_HINTS,
    drawMakeupToolCursor
  };
})();
