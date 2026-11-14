// Procedural High-Detail PBR Textures & Studio Environment Reflections (Three.js r128)
window.PunchTextures = (() => {
  const cache = {};

  function makeCanvas(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    return c;
  }

  function createStudioEnvMap(renderer) {
    if (cache.envMap) return cache.envMap;
    const envCanvas = makeCanvas(512, 256, (ctx, w, h) => {
      // Soft realistic indoor/outdoor daylight studio gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.38, '#dceefb');
      grad.addColorStop(0.52, '#f8fafc');
      grad.addColorStop(0.75, '#cbd5e1');
      grad.addColorStop(1.0, '#64748b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Softbox studio highlights for crisp leather & chrome speculars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.ellipse(140, 62, 75, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(370, 74, 58, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(envCanvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    if (THREE.PMREMGenerator && renderer) {
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const rt = pmrem.fromEquirectangular(tex);
        pmrem.dispose();
        tex.dispose();
        cache.envMap = rt.texture;
        return cache.envMap;
      } catch (e) {
        cache.envMap = tex;
        return tex;
      }
    }
    cache.envMap = tex;
    return tex;
  }

  // Grainy Leather Bump Texture for the Boxing Glove
  function getLeatherBumpMap() {
    if (cache.leatherBump) return cache.leatherBump;
    const c = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4500; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const v = 105 + Math.floor(Math.random() * 50);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + Math.random() * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Subtle leather creases
      ctx.strokeStyle = 'rgba(70,70,70,0.25)';
      ctx.lineWidth = 1.5;
      for (let j = 0; j < 24; j++) {
        ctx.beginPath();
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + 20, sy + (Math.random() - 0.5) * 18, sx + 45, sy + (Math.random() - 0.5) * 20);
        ctx.stroke();
      }
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    cache.leatherBump = tex;
    return tex;
  }

  // Soft Plush / Velvet Fabric Bump for Ragdoll Characters
  function getPlushBumpMap() {
    if (cache.plushBump) return cache.plushBump;
    const c = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6500; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const v = 95 + Math.floor(Math.random() * 65);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 2, 2);
      }
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    cache.plushBump = tex;
    return tex;
  }

  // Realistic Tile Floor Texture (with grout bevel & subtle variation)
  function getTileTextures(colorA = '#f8fafc', colorB = '#f1f5f9', grout = '#94a3b8', tiles = 4) {
    const key = `tile_${colorA}_${colorB}_${grout}_${tiles}`;
    if (cache[key]) return cache[key];

    const albedoCanvas = makeCanvas(512, 512, (ctx, w, h) => {
      const step = w / tiles;
      for (let y = 0; y < tiles; y++) {
        for (let x = 0; x < tiles; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? colorA : colorB;
          ctx.fillRect(x * step, y * step, step, step);
          // Subtle tile sheen
          const grad = ctx.createLinearGradient(x * step, y * step, (x + 1) * step, (y + 1) * step);
          grad.addColorStop(0, 'rgba(255,255,255,0.22)');
          grad.addColorStop(1, 'rgba(0,0,0,0.04)');
          ctx.fillStyle = grad;
          ctx.fillRect(x * step, y * step, step, step);
        }
      }
      ctx.strokeStyle = grout;
      ctx.lineWidth = 6;
      for (let i = 0; i <= tiles; i++) {
        const p = i * step;
        ctx.beginPath();
        ctx.moveTo(p, 0); ctx.lineTo(p, h);
        ctx.moveTo(0, p); ctx.lineTo(w, p);
        ctx.stroke();
      }
    });

    const bumpCanvas = makeCanvas(512, 512, (ctx, w, h) => {
      const step = w / tiles;
      ctx.fillStyle = '#dadada';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#303030';
      ctx.lineWidth = 8;
      for (let i = 0; i <= tiles; i++) {
        const p = i * step;
        ctx.beginPath();
        ctx.moveTo(p, 0); ctx.lineTo(p, h);
        ctx.moveTo(0, p); ctx.lineTo(w, p);
        ctx.stroke();
      }
    });

    const map = new THREE.CanvasTexture(albedoCanvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(14, 14);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(14, 14);

    cache[key] = { map, bumpMap };
    return cache[key];
  }

  // Realistic Wood Plank / Grain Texture
  function getWoodTexture(baseHex = '#b45309', grainHex = '#78350f', planks = 6) {
    const key = `wood_${baseHex}_${grainHex}_${planks}`;
    if (cache[key]) return cache[key];

    const c = makeCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);

      const plankH = h / planks;
      for (let p = 0; p < planks; p++) {
        const py = p * plankH;
        // Slight tone shift per plank
        ctx.fillStyle = p % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
        ctx.fillRect(0, py, w, plankH);

        // Organic wood fibers
        ctx.strokeStyle = grainHex;
        ctx.globalAlpha = 0.25;
        for (let g = 0; g < 18; g++) {
          ctx.lineWidth = 1 + Math.random() * 2;
          ctx.beginPath();
          const gy = py + Math.random() * plankH;
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(w * 0.33, gy + (Math.random() - 0.5) * 14, w * 0.66, gy + (Math.random() - 0.5) * 14, w, gy);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Plank seam
        ctx.fillStyle = 'rgba(20, 10, 0, 0.38)';
        ctx.fillRect(0, py, w, 3);
      }
    });

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    cache[key] = tex;
    return tex;
  }

  // Grass / Turf Texture
  function getGrassTexture(baseHex = '#4ade80', darkHex = '#16a34a') {
    const key = `grass_${baseHex}_${darkHex}`;
    if (cache[key]) return cache[key];

    const c = makeCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = Math.random() > 0.45 ? darkHex : '#86efac';
        ctx.globalAlpha = 0.38;
        ctx.fillRect(x, y, 2, 5 + Math.random() * 5);
      }
      ctx.globalAlpha = 1.0;
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    cache[key] = tex;
    return tex;
  }

  // Beach Sand Texture
  function getSandTexture() {
    if (cache.sand) return cache.sand;
    const c = makeCanvas(512, 512, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#fde68a');
      grad.addColorStop(0.5, '#fcd34d');
      grad.addColorStop(1, '#fbbf24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(180,83,9,0.18)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    });
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    cache.sand = tex;
    return tex;
  }

  // Bowling Pin Stripe Texture
  function getBowlingPinTexture() {
    if (cache.bowlingPin) return cache.bowlingPin;
    const c = makeCanvas(128, 256, (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 74, w, 18);
      ctx.fillRect(0, 102, w, 12);
    });
    const tex = new THREE.CanvasTexture(c);
    cache.bowlingPin = tex;
    return tex;
  }

  // Beach Ball / Striped Texture
  function getStripedTexture(colors = ['#ef4444', '#ffffff', '#3b82f6', '#facc15']) {
    const key = 'stripe_' + colors.join('_');
    if (cache[key]) return cache[key];
    const c = makeCanvas(256, 256, (ctx, w, h) => {
      const sw = w / colors.length;
      colors.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(i * sw, 0, sw + 1, h);
      });
    });
    const tex = new THREE.CanvasTexture(c);
    cache[key] = tex;
    return tex;
  }

  return {
    createStudioEnvMap,
    getLeatherBumpMap,
    getPlushBumpMap,
    getTileTextures,
    getWoodTexture,
    getGrassTexture,
    getSandTexture,
    getBowlingPinTexture,
    getStripedTexture
  };
})();
