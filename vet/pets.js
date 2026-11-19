// Clínica Veterinária 3D Kids - Bichinhos Calibrados, Ferramentas Articuladas e Guias
window.VetPets = (() => {
  const PETS = [
    {
      id: 'puppy',
      name: 'Pipoca',
      species: 'Cachorrinho',
      icon: '🐶',
      treatIcon: '🦴',
      treatName: 'Ossinho',
      src: 'assets/puppy.jpg',
      forehead: { x: 0.50, y: 0.19 },
      chest: { x: 0.50, y: 0.57 },
      mouth: { x: 0.50, y: 0.39 },
      scrape: { x: 0.40, y: 0.72, angle: -0.15 },
      mudZones: [
        { x: 0.42, y: 0.56, r: 0.062 },
        { x: 0.58, y: 0.62, r: 0.058 },
        { x: 0.58, y: 0.77, r: 0.054 }
      ],
      thorns: [
        { x: 0.31, y: 0.28, angle: -0.5 },
        { x: 0.68, y: 0.29, angle: 0.5 },
        { x: 0.43, y: 0.50, angle: -0.25 }
      ],
      furZone: { x: 0.50, y: 0.53, rx: 0.16, ry: 0.22 },
      collarPos: { x: 0.50, y: 0.47 },
      hatPos: { x: 0.50, y: 0.12 }
    },
    {
      id: 'kitten',
      name: 'Mimi',
      species: 'Gatinha',
      icon: '🐱',
      treatIcon: '🐟',
      treatName: 'Peixinho',
      src: 'assets/kitten.jpg',
      forehead: { x: 0.50, y: 0.26 },
      chest: { x: 0.50, y: 0.60 },
      mouth: { x: 0.50, y: 0.45 },
      scrape: { x: 0.42, y: 0.74, angle: -0.12 },
      mudZones: [
        { x: 0.41, y: 0.60, r: 0.058 },
        { x: 0.58, y: 0.66, r: 0.055 },
        { x: 0.68, y: 0.80, r: 0.052 }
      ],
      thorns: [
        { x: 0.36, y: 0.32, angle: -0.45 },
        { x: 0.64, y: 0.33, angle: 0.45 },
        { x: 0.58, y: 0.62, angle: 0.3 }
      ],
      furZone: { x: 0.50, y: 0.58, rx: 0.15, ry: 0.21 },
      collarPos: { x: 0.50, y: 0.52 },
      hatPos: { x: 0.50, y: 0.18 }
    },
    {
      id: 'bunny',
      name: 'Bolinha',
      species: 'Coelhinho',
      icon: '🐰',
      treatIcon: '🥕',
      treatName: 'Cenoura',
      src: 'assets/bunny.jpg',
      forehead: { x: 0.50, y: 0.36 },
      chest: { x: 0.50, y: 0.68 },
      mouth: { x: 0.50, y: 0.55 },
      scrape: { x: 0.43, y: 0.77, angle: -0.1 },
      mudZones: [
        { x: 0.40, y: 0.68, r: 0.058 },
        { x: 0.60, y: 0.72, r: 0.058 },
        { x: 0.38, y: 0.52, r: 0.048 }
      ],
      thorns: [
        { x: 0.38, y: 0.22, angle: -0.4 },
        { x: 0.62, y: 0.22, angle: 0.4 },
        { x: 0.59, y: 0.67, angle: 0.3 }
      ],
      furZone: { x: 0.50, y: 0.64, rx: 0.16, ry: 0.18 },
      collarPos: { x: 0.50, y: 0.60 },
      hatPos: { x: 0.50, y: 0.29 }
    },
    {
      id: 'panda',
      name: 'Bambu',
      species: 'Pandinha',
      icon: '🐼',
      treatIcon: '🎋',
      treatName: 'Bambu',
      src: 'assets/panda.jpg',
      forehead: { x: 0.50, y: 0.22 },
      chest: { x: 0.50, y: 0.62 },
      mouth: { x: 0.50, y: 0.47 },
      scrape: { x: 0.41, y: 0.72, angle: -0.14 },
      mudZones: [
        { x: 0.39, y: 0.24, r: 0.058 },
        { x: 0.60, y: 0.25, r: 0.058 },
        { x: 0.50, y: 0.70, r: 0.058 }
      ],
      thorns: [
        { x: 0.30, y: 0.18, angle: -0.5 },
        { x: 0.69, y: 0.18, angle: 0.5 },
        { x: 0.62, y: 0.58, angle: 0.3 }
      ],
      furZone: { x: 0.50, y: 0.54, rx: 0.19, ry: 0.22 },
      collarPos: { x: 0.50, y: 0.53 },
      hatPos: { x: 0.50, y: 0.13 }
    }
  ];

  const TOOLS = [
    { id: 'sponge', icon: '🫧', name: 'Banho', hint: 'Esfregue a esponja nas manchinhas de lama para limpar!' },
    { id: 'tweezers', icon: '📌', name: 'Pinça', hint: 'Toque nos espinhos para retirar com carinho!' },
    { id: 'thermometer', icon: '🌡️', name: 'Termômetro', hint: 'Segure na testinha para medir a temperatura!' },
    { id: 'stethoscope', icon: '🩺', name: 'Estetoscópio', hint: 'Encoste no peito para ouvir o coraçãozinho bater!' },
    { id: 'ointment', icon: '🧴', name: 'Pomada', hint: 'Passe a pomada calmante no machucadinho!' },
    { id: 'bandage', icon: '🩹', name: 'Curativo', hint: 'Toque no machucadinho para colar o curativo fofo!' },
    { id: 'brush', icon: '🪥', name: 'Escova', hint: 'Escove o pelinho para deixar brilhante e macio!' },
    { id: 'treat', icon: '🦴', name: 'Petisco', hint: 'Leve o petisco até a boquinha do bichinho!' }
  ];

  const BANDAGES = [
    { id: 'pink', name: 'Rosa', bg: '#f472b6', pad: '#fbcfe8', icon: '💖' },
    { id: 'sky', name: 'Azul', bg: '#38bdf8', pad: '#bae6fd', icon: '⭐' },
    { id: 'mint', name: 'Verde', bg: '#34d399', pad: '#a7f3d0', icon: '🐾' },
    { id: 'rainbow', name: 'Sol', bg: '#fbbf24', pad: '#fef08a', icon: '🌈' }
  ];

  const ACCESSORIES = [
    { id: 'none', icon: '🚫', name: 'Sem' },
    { id: 'bow', icon: '🎀', name: 'Lacinho' },
    { id: 'crown', icon: '👑', name: 'Coroa' },
    { id: 'bowtie', icon: '🎗️', name: 'Gravata' },
    { id: 'flower', icon: '🌸', name: 'Florzinha' }
  ];

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

  // Ferramentas veterinárias articuladas seguindo o dedo/mouse
  function drawVetToolCursor(ctx, opts) {
    const { x, y, toolId, isDown, treatIcon, bandageStyle, tempProgress, timeSec } = opts;
    ctx.save();
    ctx.translate(x, y);

    if (toolId === 'sponge') {
      ctx.rotate(isDown ? Math.sin(timeSec * 16) * 0.12 : -0.15);
      ctx.scale(isDown ? 1.08 : 1, isDown ? 0.84 : 1);
      ctx.fillStyle = '#fde047';
      roundRect(ctx, -32, -24, 64, 34, 12);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      roundRect(ctx, -32, 2, 64, 14, 7);
      ctx.fill();
    } else if (toolId === 'tweezers') {
      ctx.rotate(0.38);
      const pinch = isDown ? 2 : 9;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, -95);
      ctx.lineTo(-pinch, 0);
      ctx.moveTo(4, -95);
      ctx.lineTo(pinch, 0);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      roundRect(ctx, -8, -96, 16, 26, 6);
      ctx.fill();
    } else if (toolId === 'thermometer') {
      ctx.rotate(0.45);
      // Ponta metálica
      ctx.fillStyle = '#cbd5e1';
      roundRect(ctx, -5, -10, 10, 18, 4);
      ctx.fill();
      // Corpo digital branco e azul
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      roundRect(ctx, -15, -105, 30, 98, 12);
      ctx.fill();
      ctx.stroke();
      // Visor LCD
      ctx.fillStyle = '#bae6fd';
      roundRect(ctx, -10, -76, 20, 38, 4);
      ctx.fill();
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      const val = (36.5 + (tempProgress || 0) * 1.8).toFixed(1);
      ctx.fillText(val, 0, -54);
    } else if (toolId === 'stethoscope') {
      const pulse = isDown ? 1 + Math.sin(timeSec * 12) * 0.08 : 1;
      ctx.scale(pulse, pulse);
      // Tubo azul
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(26, -65, 6, -105);
      ctx.stroke();
      // Cabeçote metálico
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
    } else if (toolId === 'ointment') {
      ctx.rotate(0.45);
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(0, 8, isDown ? 11 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2.5;
      roundRect(ctx, -18, -76, 36, 64, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, -8, -12, 16, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', 0, -40);
    } else if (toolId === 'bandage') {
      const b = bandageStyle || BANDAGES[0];
      ctx.rotate(-0.18);
      ctx.fillStyle = b.bg;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      roundRect(ctx, -34, -14, 68, 28, 13);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.pad;
      roundRect(ctx, -14, -11, 28, 22, 5);
      ctx.fill();
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, 0, 1);
    } else if (toolId === 'brush') {
      ctx.rotate(0.35 + (isDown ? Math.sin(timeSec * 18) * 0.14 : 0));
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -14, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbcfe8';
      roundRect(ctx, -8, -88, 16, 52, 7);
      ctx.fill();
      ctx.stroke();
    } else if (toolId === 'treat') {
      const bob = Math.sin(timeSec * 8) * 4;
      ctx.font = '46px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(treatIcon || '🦴', 0, bob);
    }

    ctx.restore();
  }

  return {
    PETS,
    TOOLS,
    BANDAGES,
    ACCESSORIES,
    drawVetToolCursor
  };
})();
