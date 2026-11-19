// Clínica Veterinária 3D Kids - Motor 1024x1024, Exames Interativos e Guia Tracejado
(() => {
  const Pets = window.VetPets;
  const Audio = window.VetAudio;

  const S = 1024;
  const canvas = document.getElementById('vet-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = S;
  canvas.height = S;

  const loadedImages = {};
  Pets.PETS.forEach(p => {
    const img = new Image();
    img.src = p.src;
    img.onload = () => { loadedImages[p.id] = img; };
  });

  // ================== ESTADO DA CONSULTA ==================
  let currentPet = Pets.PETS[0];
  let activeToolId = 'sponge';
  let activeBandage = Pets.BANDAGES[0];
  let activeAccessory = 'none';
  let showGuide = true;

  let petState = null;
  let particles = [];
  let flashOpacity = 0;
  let celebrated = false;

  const ptr = {
    x: -999,
    y: -999,
    prevX: -999,
    prevY: -999,
    isDown: false,
    visible: false,
    activeId: null
  };

  function resetPetConsultation() {
    petState = {
      mud: currentPet.mudZones.map(m => ({ ...m, level: 1 })),
      thorns: currentPet.thorns.map(t => ({ ...t, removed: false })),
      tempProgress: 0,      // 0..1
      heartProgress: 0,     // 0..1
      ointmentProgress: 0,  // 0..1
      bandageApplied: false,
      bandageStyle: activeBandage,
      brushProgress: 0,     // 0..1
      fed: false
    };
    activeAccessory = 'none';
    celebrated = false;
    particles = [];
    updateHealthUI();
    renderSidePanel();
    updateHint();
  }

  function isStepDone(stepId) {
    if (!petState) return false;
    if (stepId === 'sponge') return petState.mud.every(m => m.level <= 0.05);
    if (stepId === 'tweezers') return petState.thorns.every(t => t.removed);
    if (stepId === 'thermometer') return petState.tempProgress >= 1;
    if (stepId === 'stethoscope') return petState.heartProgress >= 1;
    if (stepId === 'ointment') return petState.ointmentProgress >= 1;
    if (stepId === 'bandage') return petState.bandageApplied;
    if (stepId === 'brush') return petState.brushProgress >= 1;
    if (stepId === 'treat') return petState.fed;
    return false;
  }

  function computeHealthPercent() {
    if (!petState) return 0;
    const mudDone = petState.mud.reduce((acc, m) => acc + (1 - m.level), 0) / petState.mud.length;
    const thornsDone = petState.thorns.filter(t => t.removed).length / petState.thorns.length;
    const total = (
      mudDone +
      thornsDone +
      petState.tempProgress +
      petState.heartProgress +
      petState.ointmentProgress +
      (petState.bandageApplied ? 1 : 0) +
      petState.brushProgress +
      (petState.fed ? 1 : 0)
    ) / 8;
    return Math.round(total * 100);
  }

  function updateHealthUI() {
    const pct = computeHealthPercent();
    const fill = document.getElementById('health-bar-fill');
    const txt = document.getElementById('health-percent');
    if (fill) fill.style.width = `${pct}%`;
    if (txt) txt.textContent = pct >= 100 ? `💖 ${currentPet.name} 100% Curado!` : `💖 Saúde: ${pct}%`;

    if (pct >= 100 && !celebrated) {
      celebrated = true;
      Audio.playHappyCureFanfare();
      for (let i = 0; i < 20; i++) {
        spawnFloatingEmoji(S * (0.25 + Math.random() * 0.5), S * (0.3 + Math.random() * 0.4), i % 2 === 0 ? '💖' : '⭐');
      }
      renderSidePanel();
    }
  }

  // ================== PARTÍCULAS ==================
  function spawnBubble(x, y) {
    particles.push({
      type: 'bubble',
      x: x + (Math.random() - 0.5) * 44,
      y: y + (Math.random() - 0.5) * 34,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -1.1 - Math.random() * 1.6,
      r: 8 + Math.random() * 13,
      life: 1,
      decay: 0.025
    });
  }

  function spawnSparkle(x, y, color = '#fef08a', count = 1) {
    for (let i = 0; i < count; i++) {
      particles.push({
        type: 'sparkle',
        x: x + (Math.random() - 0.5) * 56,
        y: y + (Math.random() - 0.5) * 56,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.0 - Math.random() * 1.5,
        r: 7 + Math.random() * 11,
        color,
        life: 1,
        decay: 0.026
      });
    }
  }

  function spawnFloatingEmoji(x, y, emoji) {
    particles.push({
      type: 'emoji',
      x: x + (Math.random() - 0.5) * 32,
      y,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -2.0 - Math.random() * 1.8,
      emoji,
      size: 32 + Math.random() * 14,
      life: 1,
      decay: 0.018
    });
  }

  function spawnPluckedThorn(x, y) {
    particles.push({
      type: 'thorn',
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: -5.5,
      rot: 0,
      vrot: 0.25,
      life: 1,
      decay: 0.022
    });
  }

  // ================== INTERAÇÃO DAS FERRAMENTAS ==================
  function applyVetTool(sx, sy, isTap = false) {
    if (!petState) return;
    const nx = sx / S;
    const ny = sy / S;
    let changed = false;

    if (activeToolId === 'sponge') {
      petState.mud.forEach(m => {
        if (m.level <= 0) return;
        if (Math.hypot(nx - m.x, ny - m.y) < m.r + 0.055) {
          m.level = Math.max(0, m.level - (isTap ? 0.22 : 0.055));
          Audio.playSoapScrub();
          if (Math.random() > 0.3) spawnBubble(sx, sy);
          changed = true;
        }
      });
    } else if (activeToolId === 'tweezers') {
      if (isTap) {
        petState.thorns.forEach(t => {
          if (t.removed) return;
          if (Math.hypot(nx - t.x, ny - t.y) < 0.075) {
            t.removed = true;
            Audio.playTweezerPluck();
            spawnPluckedThorn(t.x * S, t.y * S);
            spawnSparkle(t.x * S, t.y * S, '#fef08a', 5);
            changed = true;
          }
        });
      }
    } else if (activeToolId === 'thermometer') {
      const f = currentPet.forehead;
      if (Math.hypot(nx - f.x, ny - f.y) < 0.11) {
        if (petState.tempProgress < 1) {
          petState.tempProgress = Math.min(1, petState.tempProgress + (isTap ? 0.18 : 0.04));
          const justDone = petState.tempProgress >= 1;
          Audio.playThermometerBeep(justDone);
          if (justDone) {
            spawnFloatingEmoji(f.x * S, (f.y - 0.04) * S, '🌡️');
            spawnSparkle(f.x * S, f.y * S, '#38bdf8', 6);
          }
          changed = true;
        }
      }
    } else if (activeToolId === 'stethoscope') {
      const ch = currentPet.chest;
      if (Math.hypot(nx - ch.x, ny - ch.y) < 0.12) {
        Audio.playHeartbeat();
        if (Math.random() > 0.55) spawnFloatingEmoji(ch.x * S, ch.y * S, '💓');
        if (petState.heartProgress < 1) {
          petState.heartProgress = Math.min(1, petState.heartProgress + (isTap ? 0.2 : 0.038));
          if (petState.heartProgress >= 1) {
            Audio.playSparkleChime();
            spawnSparkle(ch.x * S, ch.y * S, '#f472b6', 6);
          }
          changed = true;
        }
      }
    } else if (activeToolId === 'ointment') {
      const sc = currentPet.scrape;
      if (Math.hypot(nx - sc.x, ny - sc.y) < 0.095) {
        if (petState.ointmentProgress < 1) {
          petState.ointmentProgress = Math.min(1, petState.ointmentProgress + (isTap ? 0.24 : 0.055));
          Audio.playSoftStroke(false);
          if (Math.random() > 0.45) spawnSparkle(sx, sy, '#a7f3d0', 2);
          if (petState.ointmentProgress >= 1) Audio.playSparkleChime();
          changed = true;
        }
      }
    } else if (activeToolId === 'bandage') {
      const sc = currentPet.scrape;
      if (isTap && Math.hypot(nx - sc.x, ny - sc.y) < 0.105) {
        petState.bandageApplied = true;
        petState.bandageStyle = activeBandage;
        Audio.playSparkleChime();
        spawnSparkle(sc.x * S, sc.y * S, '#fef08a', 7);
        changed = true;
      }
    } else if (activeToolId === 'brush') {
      const fz = currentPet.furZone;
      const dx = (nx - fz.x) / fz.rx;
      const dy = (ny - fz.y) / fz.ry;
      if (dx * dx + dy * dy <= 1.25) {
        Audio.playSoftStroke(true);
        if (Math.random() > 0.45) spawnSparkle(sx, sy, '#fef08a', 1);
        if (petState.brushProgress < 1) {
          petState.brushProgress = Math.min(1, petState.brushProgress + (isTap ? 0.14 : 0.032));
          if (petState.brushProgress >= 1) Audio.playSparkleChime();
          changed = true;
        }
      }
    } else if (activeToolId === 'treat') {
      const m = currentPet.mouth;
      if (Math.hypot(nx - m.x, ny - m.y) < 0.105) {
        if (!petState.fed || isTap) {
          petState.fed = true;
          Audio.playMunchTreat();
          for (let i = 0; i < 6; i++) spawnFloatingEmoji(m.x * S, (m.y - 0.03) * S, i % 2 === 0 ? '💖' : '😋');
          changed = true;
        }
      }
    }

    if (changed) {
      updateHealthUI();
      renderSidePanel();
    }
  }

  // ================== DESENHO DE CONDIÇÕES, ACESSÓRIOS E GUIA TRACEJADO ==================
  function drawPetConditions(timeSec) {
    // 1. Manchinhas de lama (esfregáveis com a esponja)
    petState.mud.forEach(m => {
      if (m.level <= 0.02) return;
      const mx = m.x * S;
      const my = m.y * S;
      const mr = m.r * S;
      const grad = ctx.createRadialGradient(mx, my, mr * 0.15, mx, my, mr);
      grad.addColorStop(0, `rgba(101, 67, 33, ${0.72 * m.level})`);
      grad.addColorStop(0.65, `rgba(120, 81, 45, ${0.46 * m.level})`);
      grad.addColorStop(1, 'rgba(120, 81, 45, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Espinhos/galhinhos fofos (retiráveis com pinça)
    petState.thorns.forEach(t => {
      if (t.removed) return;
      ctx.save();
      ctx.translate(t.x * S, t.y * S);
      ctx.rotate(t.angle + Math.sin(timeSec * 3) * 0.04);
      ctx.fillStyle = '#573b26';
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-9, -24);
      ctx.lineTo(9, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Folhinha verde no galhinho
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(8, -16, 10, 5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 3. Machucadinho + Pomada calmante + Curativo colorido
    const sc = currentPet.scrape;
    const scx = sc.x * S;
    const scy = sc.y * S;

    if (!petState.bandageApplied) {
      ctx.save();
      ctx.translate(scx, scy);
      ctx.rotate(sc.angle);
      const redness = Math.max(0.25, 1 - petState.ointmentProgress * 0.65);
      ctx.fillStyle = `rgba(244, 63, 94, ${0.52 * redness})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(190, 18, 60, ${0.7 * redness})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(14, 4);
      ctx.moveTo(-10, 6);
      ctx.lineTo(12, -5);
      ctx.stroke();

      // Brilho calmante da pomada
      if (petState.ointmentProgress > 0.05) {
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
        g.addColorStop(0, `rgba(167, 243, 208, ${0.75 * petState.ointmentProgress})`);
        g.addColorStop(1, 'rgba(167, 243, 208, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Curativo bonito colado
      const b = petState.bandageStyle || Pets.BANDAGES[0];
      ctx.save();
      ctx.translate(scx, scy);
      ctx.rotate(sc.angle);
      ctx.fillStyle = b.bg;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-30, -18);
      ctx.lineTo(30, -18);
      ctx.quadraticCurveTo(46, -18, 46, 0);
      ctx.quadraticCurveTo(46, 18, 30, 18);
      ctx.lineTo(-30, 18);
      ctx.quadraticCurveTo(-46, 18, -46, 0);
      ctx.quadraticCurveTo(-46, -18, -30, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.pad;
      ctx.fillRect(-16, -14, 32, 28);
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.icon, 0, 1);
      ctx.restore();
    }

    // 4. Balãozinho de temperatura OK quando terminar termômetro
    if (petState.tempProgress >= 1) {
      const f = currentPet.forehead;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      const bx = (f.x + 0.16) * S;
      const by = (f.y - 0.04) * S;
      ctx.beginPath();
      ctx.ellipse(bx, by, 72, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 22px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌡️ 38.3° OK', bx, by + 1);
      ctx.restore();
    }

    // 5. Brilho sedoso após escovar o pelo
    if (petState.brushProgress > 0.2) {
      const fz = currentPet.furZone;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(fz.x * S, fz.y * S, 10, fz.x * S, fz.y * S, fz.rx * S);
      g.addColorStop(0, `rgba(255, 251, 235, ${0.22 * petState.brushProgress})`);
      g.addColorStop(1, 'rgba(255, 251, 235, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fz.x * S, fz.y * S, fz.rx * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Acessório Pós-Consulta
    if (activeAccessory && activeAccessory !== 'none') {
      ctx.save();
      if (activeAccessory === 'bowtie') {
        const c = currentPet.collarPos;
        ctx.font = '82px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎀', c.x * S, c.y * S);
      } else {
        const h = currentPet.hatPos;
        const icon = activeAccessory === 'crown' ? '👑' : (activeAccessory === 'flower' ? '🌸' : '🎀');
        ctx.font = '94px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, h.x * S, h.y * S);
      }
      ctx.restore();
    }
  }

  // Guia tracejado animado mostrando exatamente onde usar a ferramenta escolhida
  function drawVetToolGuide(timeSec) {
    if (!showGuide || !petState) return;
    const pulse = 0.68 + Math.sin(timeSec * 5) * 0.28;
    const dashOff = -timeSec * 28;

    function dashedCircle(x, y, rx, ry, color) {
      ctx.save();
      ctx.setLineDash([12, 9]);
      ctx.lineDashOffset = dashOff;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(x * S, y * S, rx * S, ry * S, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(15, 23, 42, ${0.42 * pulse})`;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.restore();
    }

    if (activeToolId === 'sponge') {
      petState.mud.forEach(m => {
        if (m.level > 0.05) dashedCircle(m.x, m.y, m.r + 0.015, m.r + 0.015, `rgba(125, 211, 252, ${pulse})`);
      });
    } else if (activeToolId === 'tweezers') {
      petState.thorns.forEach(t => {
        if (!t.removed) dashedCircle(t.x, t.y, 0.048, 0.048, `rgba(253, 224, 71, ${pulse})`);
      });
    } else if (activeToolId === 'thermometer' && petState.tempProgress < 1) {
      dashedCircle(currentPet.forehead.x, currentPet.forehead.y, 0.068, 0.052, `rgba(56, 189, 248, ${pulse})`);
    } else if (activeToolId === 'stethoscope' && petState.heartProgress < 1) {
      dashedCircle(currentPet.chest.x, currentPet.chest.y, 0.085, 0.085, `rgba(244, 114, 182, ${pulse})`);
    } else if (activeToolId === 'ointment' && petState.ointmentProgress < 1) {
      dashedCircle(currentPet.scrape.x, currentPet.scrape.y, 0.062, 0.046, `rgba(110, 231, 183, ${pulse})`);
    } else if (activeToolId === 'bandage' && !petState.bandageApplied) {
      dashedCircle(currentPet.scrape.x, currentPet.scrape.y, 0.068, 0.048, `rgba(251, 191, 36, ${pulse})`);
    } else if (activeToolId === 'brush' && petState.brushProgress < 1) {
      dashedCircle(currentPet.furZone.x, currentPet.furZone.y, currentPet.furZone.rx, currentPet.furZone.ry, `rgba(249, 168, 212, ${pulse})`);
    } else if (activeToolId === 'treat' && !petState.fed) {
      dashedCircle(currentPet.mouth.x, currentPet.mouth.y, 0.072, 0.058, `rgba(254, 240, 138, ${pulse})`);
    }
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
        ctx.fillStyle = 'rgba(224, 242, 254, 0.58)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        const r = p.r * p.life;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.34, -r * 0.34);
        ctx.lineTo(r, 0);
        ctx.lineTo(r * 0.34, r * 0.34);
        ctx.lineTo(0, r);
        ctx.lineTo(-r * 0.34, r * 0.34);
        ctx.lineTo(-r, 0);
        ctx.lineTo(-r * 0.34, -r * 0.34);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'emoji') {
        ctx.font = `${Math.round(p.size)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
      } else if (p.type === 'thorn') {
        p.vy += 0.32;
        p.rot += p.vrot;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#573b26';
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(-8, -18);
        ctx.lineTo(8, -14);
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
    ptr.isDown = true;
    ptr.visible = true;
    applyVetTool(pt.x, pt.y, true);
  });

  canvas.addEventListener('pointermove', (e) => {
    const pt = clientToStage(e);
    ptr.x = pt.x;
    ptr.y = pt.y;
    ptr.visible = true;
    if (ptr.isDown && ptr.activeId === e.pointerId) {
      applyVetTool(pt.x, pt.y, false);
    }
  });

  function stopPtr(e) {
    if (ptr.activeId !== e.pointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    ptr.activeId = null;
    ptr.isDown = false;
  }

  canvas.addEventListener('pointerup', stopPtr);
  canvas.addEventListener('pointercancel', stopPtr);
  canvas.addEventListener('pointerleave', () => {
    if (!ptr.isDown) ptr.visible = false;
  });

  // ================== UI SELETOR DE BICHINHOS E FERRAMENTAS ==================
  function updateHint() {
    const tool = Pets.TOOLS.find(t => t.id === activeToolId);
    const el = document.getElementById('tool-hint');
    if (el && tool) {
      const icon = tool.id === 'treat' ? currentPet.treatIcon : tool.icon;
      const name = tool.id === 'treat' ? currentPet.treatName : tool.name;
      el.textContent = `${icon} ${name}: ${tool.hint}`;
    }
  }

  function renderPetSwitcher() {
    const wrap = document.getElementById('pet-switcher');
    wrap.innerHTML = '';
    Pets.PETS.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `pet-pill ${currentPet.id === p.id ? 'active' : ''}`;
      b.innerHTML = `<span>${p.icon}</span><span>${p.name}</span>`;
      b.addEventListener('click', () => {
        Audio.init();
        Audio.playUiSelect(640);
        if (currentPet.id !== p.id) {
          currentPet = p;
          resetPetConsultation();
          renderPetSwitcher();
        }
      });
      wrap.appendChild(b);
    });
  }

  function renderSidePanel() {
    const toolsGrid = document.getElementById('vet-tools-grid');
    const extrasWrap = document.getElementById('vet-extras');
    toolsGrid.innerHTML = '';
    extrasWrap.innerHTML = '';

    Pets.TOOLS.forEach(tool => {
      const done = isStepDone(tool.id);
      const icon = tool.id === 'treat' ? currentPet.treatIcon : tool.icon;
      const name = tool.id === 'treat' ? currentPet.treatName : tool.name;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tool-card ${activeToolId === tool.id ? 'active' : ''} ${done ? 'done' : ''}`;
      btn.innerHTML = `<span class="t-icon">${icon}</span><span class="t-name">${name}</span>${done ? '<span class="check">✅</span>' : ''}`;
      btn.addEventListener('click', () => {
        Audio.init();
        Audio.playUiSelect(580);
        activeToolId = tool.id;
        renderSidePanel();
        updateHint();
      });
      toolsGrid.appendChild(btn);
    });

    // Se curativo selecionado, mostrar cores de curativo
    if (activeToolId === 'bandage') {
      const lbl = document.createElement('div');
      lbl.className = 'sub-title';
      lbl.textContent = '🩹 Cor do Curativo:';
      extrasWrap.appendChild(lbl);

      const row = document.createElement('div');
      row.className = 'sub-row';
      Pets.BANDAGES.forEach(bd => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mini-pill ${activeBandage.id === bd.id ? 'active' : ''}`;
        b.innerHTML = `${bd.icon} ${bd.name}`;
        b.addEventListener('click', () => {
          Audio.playUiSelect(640);
          activeBandage = bd;
          if (petState && petState.bandageApplied) petState.bandageStyle = bd;
          renderSidePanel();
        });
        row.appendChild(b);
      });
      extrasWrap.appendChild(row);
    }

    // Acessórios de recompensa fofos
    const accLbl = document.createElement('div');
    accLbl.className = 'sub-title';
    accLbl.textContent = '🎀 Enfeite de Recompensa:';
    extrasWrap.appendChild(accLbl);

    const accRow = document.createElement('div');
    accRow.className = 'sub-row';
    Pets.ACCESSORIES.forEach(acc => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `mini-pill ${activeAccessory === acc.id ? 'active' : ''}`;
      b.innerHTML = `${acc.icon} ${acc.name}`;
      b.addEventListener('click', () => {
        Audio.init();
        Audio.playSparkleChime();
        activeAccessory = acc.id;
        spawnSparkle(S * 0.5, S * 0.25, '#fef08a', 6);
        renderSidePanel();
      });
      accRow.appendChild(b);
    });
    extrasWrap.appendChild(accRow);
  }

  // ================== FOTO DA CLÍNICA & LOOP ==================
  function takeClinicPhoto() {
    Audio.init();
    Audio.playHappyCureFanfare();
    const prevGuide = showGuide;
    const prevVis = ptr.visible;
    showGuide = false;
    ptr.visible = false;
    flashOpacity = 0.9;
    spawnSparkle(S * 0.5, S * 0.45, '#fef08a', 14);

    setTimeout(() => {
      try {
        const link = document.createElement('a');
        link.download = `clinica-vet-${currentPet.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (_) {}
      showGuide = prevGuide;
      ptr.visible = prevVis;
    }, 60);
  }

  function renderFrame(now) {
    requestAnimationFrame(renderFrame);
    const timeSec = now * 0.001;

    ctx.clearRect(0, 0, S, S);
    const img = loadedImages[currentPet.id];
    if (img) {
      ctx.drawImage(img, 0, 0, S, S);
    } else {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 34px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Preparando consulta...', S / 2, S / 2);
      return;
    }

    drawPetConditions(timeSec);
    drawVetToolGuide(timeSec);
    drawParticles();

    if (ptr.visible) {
      Pets.drawVetToolCursor(ctx, {
        x: ptr.x,
        y: ptr.y,
        toolId: activeToolId,
        isDown: ptr.isDown,
        treatIcon: currentPet.treatIcon,
        bandageStyle: activeBandage,
        tempProgress: petState ? petState.tempProgress : 0,
        timeSec
      });
    }

    if (flashOpacity > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, S, S);
      flashOpacity *= 0.86;
    }
  }

  function init() {
    resetPetConsultation();
    renderPetSwitcher();

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = Audio.setEnabled(!Audio.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) Audio.playUiSelect(620);
    });

    const guideBtn = document.getElementById('btn-guide');
    guideBtn.classList.toggle('active', showGuide);
    guideBtn.addEventListener('click', () => {
      Audio.playUiSelect(590);
      showGuide = !showGuide;
      guideBtn.classList.toggle('active', showGuide);
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      Audio.playUiSelect(440);
      resetPetConsultation();
    });

    document.getElementById('btn-photo').addEventListener('click', takeClinicPhoto);

    requestAnimationFrame(renderFrame);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
