// Main 2.5D Arcade Beat 'em Up Engine (True 16-Bit Pixel-Art Edition)
// Ben 10 & Unicórnios Mágicos - Built for Mobile, Tablet & Desktop

class HeroBrawlerGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.selectedCharIndex = 0; // Default: Chama
    this.currentStageIndex = 0; // Default: Stage 1 (Cidade)
    this.running = false;
    this.paused = false;
    this.time = 0;

    // Camera & Stage State
    this.cameraX = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.screenShake = 0;
    this.goArrowTimer = 0;

    // Close-Up Transformation Cutscene Timer (Like 00:16-00:33 in the video!)
    this.transformFlash = 0;
    this.maxTransformFlash = 1.05;

    // Player Entity
    this.player = {
      x: 240,
      y: 565,
      z: 0,
      vz: 0,
      vx: 0,
      vy: 0,
      facing: 1,
      hp: 6,
      maxHp: 6,
      energy: 100,
      maxEnergy: 100,
      action: 'idle',
      actionTimer: 0,
      animTime: 0,
      invulnTimer: 0,
      dashVx: 0
    };

    // World Collections
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.popups = [];
    this.pickups = [];
    this.spawnTriggerX = 450;
    this.bossSpawned = false;

    // Input State
    this.input = {
      x: 0,
      y: 0,
      keys: {}
    };

    // Offscreen Portrait Cache for HUD
    this.hudPortraitCanvas = document.createElement('canvas');
    this.hudPortraitCanvas.width = 76;
    this.hudPortraitCanvas.height = 76;

    this.avatarCanvases = [];

    this.initMenuUI();
    this.initControls();

    // Initialize 16-Bit Pixel Art Engine & refresh portraits once ready
    window.pixelEngine.init(() => {
      this.refreshAllPortraits();
      this.updateCharacterHUDButtons();
    });

    this.lastFrameTime = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  get currentChar() {
    return window.CHARACTERS[this.selectedCharIndex];
  }

  get currentStage() {
    return window.STAGES[this.currentStageIndex];
  }

  refreshAllPortraits() {
    this.avatarCanvases.forEach(({ cvs, char }) => {
      window.drawCharacterPortrait(cvs.getContext('2d'), char, cvs.width, cvs.height);
    });
  }

  initMenuUI() {
    const ben10Grid = document.getElementById('roster-ben10');
    const unicornGrid = document.getElementById('roster-unicorns');
    const quickGrid = document.getElementById('quick-roster-grid');
    const stagePills = document.getElementById('stage-pills');

    const renderCard = (char, index, isQuick = false) => {
      const card = document.createElement('div');
      card.className = 'char-card' + (index === this.selectedCharIndex ? ' selected' : '');
      card.dataset.index = index;

      const cvs = document.createElement('canvas');
      cvs.className = 'char-avatar-canvas';
      cvs.width = 68;
      cvs.height = 68;
      this.avatarCanvases.push({ cvs, char });

      const info = document.createElement('div');
      info.className = 'char-info';
      info.innerHTML = `
        <div class="char-name">${char.name}</div>
        <div class="char-power">${char.attackEmoji} ${char.attackName}</div>
      `;

      card.appendChild(cvs);
      card.appendChild(info);

      card.addEventListener('click', () => {
        window.arcadeAudio.init();
        this.selectCharacter(index, isQuick);
        document.querySelectorAll('.char-card').forEach((el) => {
          el.classList.toggle('selected', Number(el.dataset.index) === index);
        });
        if (isQuick) {
          document.getElementById('quick-picker-overlay').classList.add('hidden');
          this.paused = false;
        }
      });

      return card;
    };

    window.CHARACTERS.forEach((char, idx) => {
      const card = renderCard(char, idx, false);
      if (char.group === 'ben10') ben10Grid.appendChild(card);
      else unicornGrid.appendChild(card);

      quickGrid.appendChild(renderCard(char, idx, true));
    });

    window.STAGES.forEach((st, idx) => {
      const pill = document.createElement('button');
      pill.className = 'stage-pill' + (idx === this.currentStageIndex ? ' selected' : '');
      pill.textContent = `${st.icon} ${st.number}. ${st.name}`;
      pill.addEventListener('click', () => {
        this.currentStageIndex = idx;
        document.querySelectorAll('.stage-pill').forEach((p, i) => {
          p.classList.toggle('selected', i === idx);
        });
      });
      stagePills.appendChild(pill);
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      window.arcadeAudio.init();
      document.getElementById('menu-overlay').classList.add('hidden');
      this.startStage(this.currentStageIndex);
    });

    document.getElementById('btn-quick-roster').addEventListener('click', () => {
      if (!this.running) return;
      this.paused = true;
      document.getElementById('quick-picker-overlay').classList.remove('hidden');
    });

    document.getElementById('btn-close-picker').addEventListener('click', () => {
      document.getElementById('quick-picker-overlay').classList.add('hidden');
      this.paused = false;
    });

    document.getElementById('btn-next-stage').addEventListener('click', () => {
      document.getElementById('stage-clear-overlay').classList.add('hidden');
      const nextIdx = (this.currentStageIndex + 1) % window.STAGES.length;
      this.startStage(nextIdx);
    });

    document.getElementById('btn-sound').addEventListener('click', () => {
      const muted = window.arcadeAudio.toggleMute();
      document.getElementById('sound-icon').textContent = muted ? '🔇' : '🔊';
    });

    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      const elem = document.documentElement;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    });
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      if (!this.running || this.paused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerJump();
      } else if (e.code === 'KeyJ' || e.code === 'KeyZ') {
        this.triggerAttack();
      } else if (e.code === 'KeyK' || e.code === 'KeyX') {
        this.triggerSpecial();
      } else if (e.code === 'KeyL' || e.code === 'KeyC') {
        this.cycleCharacter();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    const joyBase = document.getElementById('joystick-base');
    const joyStick = document.getElementById('joystick-stick');
    let activePointerId = null;

    const handleJoystickMove = (clientX, clientY) => {
      const rect = joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const maxRadius = rect.width * 0.38;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.x = Math.abs(dx / maxRadius) > 0.15 ? dx / maxRadius : 0;
      this.input.y = Math.abs(dy / maxRadius) > 0.15 ? dy / maxRadius : 0;
    };

    const resetJoystick = () => {
      activePointerId = null;
      joyStick.style.transform = 'translate(0px, 0px)';
      this.input.x = 0;
      this.input.y = 0;
    };

    joyBase.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      window.arcadeAudio.init();
      activePointerId = e.pointerId;
      joyBase.setPointerCapture(e.pointerId);
      handleJoystickMove(e.clientX, e.clientY);
    });

    joyBase.addEventListener('pointermove', (e) => {
      if (e.pointerId === activePointerId) {
        handleJoystickMove(e.clientX, e.clientY);
      }
    });

    joyBase.addEventListener('pointerup', (e) => {
      if (e.pointerId === activePointerId) resetJoystick();
    });

    joyBase.addEventListener('pointercancel', (e) => {
      if (e.pointerId === activePointerId) resetJoystick();
    });

    const bindActionBtn = (id, fn) => {
      const btn = document.getElementById(id);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        window.arcadeAudio.init();
        btn.classList.add('pressed');
        if (this.running && !this.paused) fn();
      });
      const release = () => btn.classList.remove('pressed');
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('pointerleave', release);
    };

    bindActionBtn('btn-attack', () => this.triggerAttack());
    bindActionBtn('btn-special', () => this.triggerSpecial());
    bindActionBtn('btn-jump', () => this.triggerJump());
    bindActionBtn('btn-swap', () => this.cycleCharacter());
  }

  selectCharacter(index, playEffect = false) {
    this.selectedCharIndex = index;
    this.updateCharacterHUDButtons();

    if (playEffect && this.running) {
      window.arcadeAudio.sfxTransform();
      this.transformFlash = this.maxTransformFlash;
      this.player.invulnTimer = 1.3;
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 35);

      const char = this.currentChar;
      this.addPopup(
        this.player.x,
        this.player.y - 135,
        char.group === 'ben10' ? `⌚ ${char.name.toUpperCase()}!` : `🦄 ${char.name.toUpperCase()}!`,
        '#fde047',
        26
      );

      this.spawnBurst(this.player.x, this.player.y - 60, char.secondaryColor, 26);
      this.enemies.forEach((en) => {
        if (Math.hypot(en.x - this.player.x, en.y - this.player.y) < 230) {
          en.vx = en.x >= this.player.x ? 9 : -9;
          en.vz = 6;
          en.hitStun = 0.45;
          en.hp -= 16;
        }
      });
    }
  }

  cycleCharacter() {
    const next = (this.selectedCharIndex + 1) % window.CHARACTERS.length;
    this.selectCharacter(next, true);
  }

  updateCharacterHUDButtons() {
    const char = this.currentChar;
    document.getElementById('attack-btn-emoji').textContent = char.attackEmoji;
    document.getElementById('attack-btn-text').textContent =
      char.group === 'unicorn' ? 'CHIFRADA' : 'GOLPE';
    document.getElementById('special-btn-emoji').textContent = char.specialEmoji;
    document.getElementById('special-btn-text').textContent = 'PODER!';

    window.drawCharacterPortrait(
      this.hudPortraitCanvas.getContext('2d'),
      char,
      76,
      76
    );
  }

  startStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    this.running = true;
    this.paused = false;

    this.cameraX = 0;
    this.player.x = 260;
    this.player.y = 565;
    this.player.z = 0;
    this.player.vz = 0;
    this.player.hp = this.player.maxHp;
    this.player.energy = 100;
    this.player.action = 'idle';

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.popups = [];
    this.pickups = [];

    this.spawnTriggerX = 420;
    this.bossSpawned = false;

    this.updateCharacterHUDButtons();
    window.arcadeAudio.startMusic(stageIndex);

    this.spawnEnemyWave(580);
    this.addPopup(380, 420, `FASE ${this.currentStage.number}: ${this.currentStage.name.toUpperCase()}`, '#fde047', 28);
  }

  spawnEnemyWave(centerX) {
    const st = this.currentStage;
    const count = 3 + Math.min(2, Math.floor(this.currentStageIndex * 0.5));
    for (let i = 0; i < count; i++) {
      const type = st.enemyTypes[i % st.enemyTypes.length];
      const side = i % 2 === 0 ? 1 : -0.55;
      const ex = Math.max(140, centerX + side * (290 + i * 80));
      const ey = 505 + ((i * 43) % 115);
      this.enemies.push(window.createEnemy(type, ex, ey, false));
    }
  }

  spawnStageBoss() {
    this.bossSpawned = true;
    const st = this.currentStage;
    const boss = window.createEnemy(st.bossType, this.cameraX + 980, 565, true);
    this.enemies.push(boss);
    this.screenShake = 14;
    this.addPopup(this.player.x + 220, 410, `⚠️ CHEFÃO: ${st.bossName}!`, '#ef4444', 30);
    window.arcadeAudio.sfxSpecial('smash');
  }

  triggerJump() {
    if (this.player.z <= 1) {
      this.player.vz = 15;
      window.arcadeAudio.sfxJump();
    }
  }

  triggerAttack() {
    if (this.player.actionTimer > 0.12) return;
    const char = this.currentChar;
    this.player.action = 'attack';
    this.player.actionTimer = 0.28;

    if (char.group === 'unicorn') {
      window.arcadeAudio.sfxHornCharge();
      this.player.dashVx = this.player.facing * 10;
      this.spawnBurst(
        this.player.x + this.player.facing * 60,
        this.player.y - this.player.z - 65,
        char.secondaryColor,
        14
      );
      this.performMeleeHit(145, 62, 24, 'CHIFRADA! 🦄', char.secondaryColor);
    } else {
      window.arcadeAudio.sfxPunch();
      this.player.dashVx = this.player.facing * 5.5;

      if (char.id === 'chama') {
        this.spawnProjectile({
          x: this.player.x + this.player.facing * 50,
          y: this.player.y,
          z: this.player.z + 65,
          vx: this.player.facing * 13,
          color: '#f97316',
          coreColor: '#fde047',
          radius: 17,
          damage: 22,
          life: 0.45,
          label: 'FOGO! 🔥'
        });
      } else if (char.id === 'diamante') {
        this.spawnProjectile({
          x: this.player.x + this.player.facing * 50,
          y: this.player.y,
          z: this.player.z + 65,
          vx: this.player.facing * 14,
          color: '#06b6d4',
          coreColor: '#cffafe',
          radius: 15,
          damage: 22,
          life: 0.45,
          label: 'CRISTAL! 💎'
        });
      } else if (char.id === 'xlr8') {
        this.player.dashVx = this.player.facing * 13.5;
      }

      this.performMeleeHit(135, 60, 24, `${char.attackEmoji} POW!`, char.secondaryColor);
    }
  }

  triggerSpecial() {
    const char = this.currentChar;
    this.player.action = 'special';
    this.player.actionTimer = 0.44;
    this.screenShake = 11;

    window.arcadeAudio.sfxSpecial(char.powerType);

    if (char.group === 'unicorn') {
      this.player.dashVx = this.player.facing * 17;
      this.player.invulnTimer = 0.6;
      this.addPopup(this.player.x, this.player.y - 130, `✨ ${char.specialName}`, char.secondaryColor, 26);

      [-28, 0, 28].forEach((offsetY) => {
        this.spawnProjectile({
          x: this.player.x + this.player.facing * 55,
          y: Math.max(495, Math.min(630, this.player.y + offsetY)),
          z: this.player.z + 60,
          vx: this.player.facing * 16,
          color: char.primaryColor,
          coreColor: char.secondaryColor,
          radius: 22,
          damage: 36,
          life: 0.75,
          label: 'SUPER CHIFRADA! 🌟',
          pierce: true
        });
      });

      this.performMeleeHit(185, 90, 40, 'SUPER CHIFRADA! 🦄', char.secondaryColor);
    } else if (char.id === 'chama') {
      this.addPopup(this.player.x, this.player.y - 130, '🔥 SUPER CHAMA!', '#fde047', 26);
      [-26, 0, 26].forEach((oy) => {
        this.spawnProjectile({
          x: this.player.x + this.player.facing * 50,
          y: Math.max(495, Math.min(630, this.player.y + oy)),
          z: this.player.z + 62,
          vx: this.player.facing * 15,
          color: '#ea580c',
          coreColor: '#fde047',
          radius: 24,
          damage: 38,
          life: 0.8,
          label: 'KABOOM! 🔥',
          pierce: true
        });
      });
    } else if (char.id === 'quatrobracos') {
      this.addPopup(this.player.x, this.player.y - 130, '💥 TERREMOTO QUATRO BRAÇOS!', '#facc15', 26);
      this.spawnBurst(this.player.x, this.player.y, '#facc15', 34);
      this.performMeleeHit(250, 125, 48, 'SMASH! 💥', '#facc15', true);
    } else if (char.id === 'xlr8') {
      this.addPopup(this.player.x, this.player.y - 130, '⚡ TURBO XLR8!', '#38bdf8', 26);
      this.player.dashVx = this.player.facing * 24;
      this.player.invulnTimer = 0.65;
      this.performMeleeHit(230, 98, 40, 'ZAP! ⚡', '#38bdf8', true);
    } else if (char.id === 'diamante') {
      this.addPopup(this.player.x, this.player.y - 130, '💎 CHUVA DE DIAMANTES!', '#67e8f9', 26);
      for (let i = 1; i <= 4; i++) {
        this.spawnProjectile({
          x: this.player.x + this.player.facing * (i * 62),
          y: this.player.y,
          z: 45,
          vx: this.player.facing * 12,
          color: '#06b6d4',
          coreColor: '#ecfeff',
          radius: 24,
          damage: 36,
          life: 0.7,
          label: 'CRISTAL! 💎',
          pierce: true
        });
      }
    }
  }

  performMeleeHit(rangeX, rangeY, damage, popupText, color, areaAllAround = false) {
    let hitAny = false;
    this.enemies.forEach((en) => {
      const dx = en.x - this.player.x;
      const dy = Math.abs(en.y - this.player.y);
      const inFront = areaAllAround
        ? Math.abs(dx) <= rangeX
        : (this.player.facing === 1 ? dx >= -30 && dx <= rangeX : dx <= 30 && dx >= -rangeX);

      if (inFront && dy <= rangeY) {
        this.damageEnemy(en, damage, popupText, color);
        hitAny = true;
      }
    });

    if (hitAny) {
      this.screenShake = Math.max(this.screenShake, 6);
    }
  }

  damageEnemy(en, damage, label, color) {
    en.hp -= damage;
    en.hitStun = 0.34;
    en.vx = this.player.facing * (en.isBoss ? 4.5 : 8.5);
    en.vz = en.isBoss ? 3.5 : 6.5;

    this.score += 25;
    this.combo++;
    this.comboTimer = 2.5;
    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 12);

    this.spawnBurst(en.x, en.y - 60, color, 14);
    this.addPopup(en.x, en.y - 115, label, color, 22);
  }

  spawnProjectile(proj) {
    this.projectiles.push(proj);
  }

  spawnBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 2.5 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        size: 6 + Math.floor(Math.random() * 6),
        color,
        life: 0.35 + Math.random() * 0.25
      });
    }
  }

  addPopup(x, y, text, color = '#fde047', size = 22) {
    this.popups.push({
      x,
      y,
      text,
      color,
      size,
      life: 0.85
    });
  }

  update(dt) {
    if (!this.running || this.paused) return;

    this.time += dt;
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 35);
    if (this.transformFlash > 0) this.transformFlash = Math.max(0, this.transformFlash - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    let moveX = this.input.x;
    let moveY = this.input.y;

    if (this.input.keys['ArrowLeft'] || this.input.keys['KeyA']) moveX = -1;
    if (this.input.keys['ArrowRight'] || this.input.keys['KeyD']) moveX = 1;
    if (this.input.keys['ArrowUp'] || this.input.keys['KeyW']) moveY = -1;
    if (this.input.keys['ArrowDown'] || this.input.keys['KeyS']) moveY = 1;

    const spd = this.currentChar.speed;
    if (Math.abs(moveX) > 0.05) {
      this.player.facing = moveX > 0 ? 1 : -1;
    }

    this.player.x += moveX * spd + this.player.dashVx;
    this.player.y += moveY * (spd * 0.72);
    this.player.dashVx *= 0.82;

    // Clamp player within the cobblestone street walkway depth
    this.player.y = Math.max(495, Math.min(632, this.player.y));
    this.player.x = Math.max(this.cameraX + 60, Math.min(this.currentStage.length - 60, this.player.x));

    if (this.player.z > 0 || this.player.vz !== 0) {
      this.player.z += this.player.vz;
      this.player.vz -= 0.8;
      if (this.player.z <= 0) {
        this.player.z = 0;
        this.player.vz = 0;
      }
    }

    if (this.player.actionTimer > 0) {
      this.player.actionTimer -= dt;
    } else {
      this.player.action = Math.hypot(moveX, moveY) > 0.1 ? 'walk' : 'idle';
    }
    this.player.animTime += dt;
    if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;

    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + dt * 14);

    // Camera Scrolling
    const targetCamX = Math.max(
      this.cameraX,
      Math.min(this.currentStage.length - this.canvas.width, this.player.x - 420)
    );
    if (this.enemies.length <= 1) {
      this.cameraX += (targetCamX - this.cameraX) * 0.12;
      this.goArrowTimer += dt;
    } else {
      this.goArrowTimer = 0;
    }

    if (this.player.x > this.spawnTriggerX && this.spawnTriggerX < this.currentStage.length - 750) {
      this.spawnEnemyWave(this.player.x + 420);
      this.spawnTriggerX += 580;
    }

    if (!this.bossSpawned && this.player.x > this.currentStage.length - 680) {
      this.spawnStageBoss();
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.life -= dt;

      for (let j = 0; j < this.enemies.length; j++) {
        const en = this.enemies[j];
        if (Math.abs(en.x - p.x) < p.radius + 38 && Math.abs(en.y - p.y) < 48) {
          this.damageEnemy(en, p.damage, p.label, p.coreColor);
          if (!p.pierce) {
            p.life = 0;
            break;
          }
        }
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      en.animTime += dt;

      if (en.z > 0 || en.vz !== 0) {
        en.z += en.vz;
        en.vz -= 0.75;
        if (en.z <= 0) {
          en.z = 0;
          en.vz = 0;
        }
      }

      en.x += en.vx;
      en.vx *= 0.82;

      if (en.hitStun > 0) {
        en.hitStun -= dt;
      } else {
        const dx = this.player.x - en.x;
        const dy = this.player.y - en.y;
        en.facing = dx >= 0 ? 1 : -1;

        if (Math.abs(dx) > 74) {
          en.x += Math.sign(dx) * en.speed;
        }
        if (Math.abs(dy) > 14) {
          en.y += Math.sign(dy) * (en.speed * 0.65);
        }

        if (Math.abs(dx) <= 84 && Math.abs(dy) <= 38 && this.player.z < 30) {
          en.attackCooldown -= dt * 60;
          if (en.attackCooldown <= 20) en.attackWindup = 1;
          if (en.attackCooldown <= 0) {
            en.attackCooldown = 95 + Math.random() * 45;
            en.attackWindup = 0;
            if (this.player.invulnTimer <= 0) {
              this.player.hp -= 1;
              this.player.invulnTimer = 1.2;
              this.screenShake = 8;
              this.addPopup(this.player.x, this.player.y - 110, 'AI!', '#f87171', 22);

              if (this.player.hp <= 0) {
                this.player.hp = this.player.maxHp;
                window.arcadeAudio.sfxTransform();
                this.transformFlash = 0.9;
                this.spawnBurst(this.player.x, this.player.y - 60, '#4ade80', 30);
                this.addPopup(
                  this.player.x,
                  this.player.y - 135,
                  '💖 ENERGIA MÁGICA RECUPERADA!',
                  '#4ade80',
                  26
                );
              }
            }
          }
        } else {
          en.attackWindup = 0;
        }
      }

      if (en.hp <= 0) {
        window.arcadeAudio.sfxEnemyDefeat();
        this.score += en.isBoss ? 500 : 100;
        this.spawnBurst(en.x, en.y - 55, '#fde047', en.isBoss ? 36 : 16);

        if (Math.random() < 0.55 || en.isBoss) {
          this.pickups.push({
            x: en.x,
            y: en.y,
            type: Math.random() < 0.65 ? 'heart' : 'smoothie',
            bob: 0
          });
        }

        const wasBoss = en.isBoss;
        this.enemies.splice(i, 1);

        if (wasBoss) {
          this.completeStage();
        }
      }
    }

    // Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      item.bob += dt * 5;
      if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 66) {
        window.arcadeAudio.sfxPickup();
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 2);
        this.score += 150;
        this.addPopup(item.x, item.y - 65, '❤️ +VIDA!', '#4ade80', 22);
        this.pickups.splice(i, 1);
      }
    }

    // Update Pixel Particles & Popups
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y -= dt * 42;
      pop.life -= dt;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }
  }

  completeStage() {
    window.arcadeAudio.sfxVictory();
    setTimeout(() => {
      this.paused = true;
      const overlay = document.getElementById('stage-clear-overlay');
      const st = this.currentStage;
      document.getElementById('victory-title').textContent = `${st.icon} ${st.name.toUpperCase()} SALVA!`;
      document.getElementById('victory-desc').textContent =
        `Parabéns! ${this.currentChar.name} derrotou ${st.bossName}!`;
      document.getElementById('victory-stats').innerHTML = `
        <div class="stat-box">🏆 PONTOS: ${this.score}</div>
        <div class="stat-box">🌟 FASE ${st.number} DE ${window.STAGES.length}</div>
      `;
      overlay.classList.remove('hidden');
    }, 900);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.screenShake > 0) {
      const sx = Math.round((Math.random() - 0.5) * this.screenShake);
      const sy = Math.round((Math.random() - 0.5) * this.screenShake);
      ctx.translate(sx, sy);
    }

    // 1. Draw True 16-Bit Stage Environment
    window.drawStageEnvironment(ctx, this.currentStage, this.cameraX, w, h, this.time);

    // 2. Y-Sorted World Entities
    const renderList = [];

    this.pickups.forEach((item) => {
      renderList.push({
        y: item.y,
        draw: () => {
          const sx = Math.round(item.x - this.cameraX);
          const sy = Math.round(item.y - Math.abs(Math.sin(item.bob)) * 10);
          ctx.font = '34px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.type === 'heart' ? '❤️' : '🧁', sx, sy);
        }
      });
    });

    this.enemies.forEach((en) => {
      renderList.push({
        y: en.y,
        draw: () => {
          ctx.save();
          ctx.translate(-Math.round(this.cameraX), 0);
          window.drawEnemySprite(ctx, en);
          ctx.restore();
        }
      });
    });

    renderList.push({
      y: this.player.y,
      draw: () => {
        ctx.save();
        ctx.translate(-Math.round(this.cameraX), 0);

        if (this.player.invulnTimer <= 0 || Math.floor(this.time * 16) % 2 === 0) {
          window.drawCharacterSprite(ctx, this.currentChar, {
            x: this.player.x,
            y: this.player.y,
            z: this.player.z,
            facing: this.player.facing,
            animTime: this.player.animTime,
            action: this.player.action,
            scale: 1.0
          });
        }
        ctx.restore();
      }
    });

    this.projectiles.forEach((p) => {
      renderList.push({
        y: p.y + 1,
        draw: () => {
          const sx = Math.round(p.x - this.cameraX);
          const sy = Math.round(p.y - p.z);
          ctx.save();
          // 16-bit Pixel Energy Orb
          const r = Math.round(p.radius);
          ctx.fillStyle = '#111827';
          ctx.fillRect(sx - r - 2, sy - r - 2, r * 2 + 4, r * 2 + 4);
          ctx.fillStyle = p.color;
          ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
          ctx.fillStyle = p.coreColor;
          ctx.fillRect(sx - Math.round(r * 0.55), sy - Math.round(r * 0.55), Math.round(r * 1.1), Math.round(r * 1.1));
          ctx.restore();
        }
      });
    });

    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach((item) => item.draw());

    // 3. 16-Bit Square Pixel Particles & Comic Popups
    this.particles.forEach((pt) => {
      const px = Math.round(pt.x - this.cameraX);
      const py = Math.round(pt.y);
      ctx.fillStyle = '#111827';
      ctx.fillRect(px - 1, py - 1, pt.size + 2, pt.size + 2);
      ctx.fillStyle = pt.color;
      ctx.fillRect(px, py, pt.size, pt.size);
    });

    this.popups.forEach((pop) => {
      ctx.save();
      ctx.font = `900 ${pop.size}px 'Trebuchet MS', Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#111827';
      ctx.strokeText(pop.text, Math.round(pop.x - this.cameraX), Math.round(pop.y));
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, Math.round(pop.x - this.cameraX), Math.round(pop.y));
      ctx.restore();
    });

    ctx.restore();

    // 4. Draw Retro 16-Bit Arcade HUD (Matching 00:01 & 00:35 of the video!)
    this.drawArcadeHUD(ctx, w, h);

    // 5. Close-Up Transformation Cutscene Showcase (Matching 00:16-00:33 of the video!)
    if (this.transformFlash > 0) {
      window.drawTransformationShowcase(
        ctx,
        this.currentChar,
        this.transformFlash,
        this.maxTransformFlash,
        w,
        h
      );
    }
  }

  drawArcadeHUD(ctx, w, h) {
    // Top-Left Portrait Frame (Just like 00:01 & 00:35 in the video!)
    window.drawOutlinedRect(ctx, 18, 16, 84, 84, 10, '#1e293b', '#facc15', 4);
    ctx.drawImage(this.hudPortraitCanvas, 22, 20, 76, 76);

    // Character Name Banner
    window.drawOutlinedRect(ctx, 112, 16, 250, 30, 6, 'rgba(15, 23, 42, 0.88)', '#111827', 3);
    ctx.fillStyle = '#fde047';
    ctx.font = '900 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.currentChar.name.toUpperCase()} - FASE ${this.currentStage.number}`, 122, 36);

    // Pixel Art Hearts Row (With white specular highlight just like 00:01 in the video!)
    for (let i = 0; i < this.player.maxHp; i++) {
      const hx = 114 + i * 36;
      const hy = 56;
      this.drawPixelHeart(ctx, hx, hy, i < this.player.hp);
    }

    // Vertical Energy Canister / Bottle under Portrait on Left Side (Just like 00:01 & 00:35 in the video!)
    const tubeX = 24;
    const tubeY = 116;
    const tubeW = 30;
    const tubeH = 152;
    // Metal bottle neck cap
    window.drawOutlinedRect(ctx, tubeX + 5, tubeY - 10, 20, 12, 3, '#94a3b8', '#111827', 3);
    window.drawOutlinedRect(ctx, tubeX, tubeY, tubeW, tubeH, 10, '#1e293b', '#facc15', 3.5);

    const fillRatio = this.player.energy / this.player.maxEnergy;
    const fillH = Math.max(0, Math.round((tubeH - 8) * fillRatio));
    const barColor = this.currentChar.group === 'ben10' ? '#4ade80' : '#f472b6';
    ctx.fillStyle = barColor;
    ctx.fillRect(tubeX + 4, tubeY + tubeH - 4 - fillH, tubeW - 8, fillH);
    // Glass reflection streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(tubeX + 7, tubeY + 8, 4, tubeH - 16);

    // Score Plaque (Styled like the [382] red/white arcade score box in the video!)
    const scoreBoxX = w * 0.5 - 92;
    window.drawOutlinedRect(ctx, scoreBoxX, 14, 184, 44, 8, '#fffbeb', '#b91c1c', 4);
    ctx.fillStyle = '#b91c1c';
    ctx.font = '900 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`★ ${String(this.score).padStart(4, '0')}`, scoreBoxX + 92, 43);

    // Boss Health Bar
    const boss = this.enemies.find((e) => e.isBoss);
    if (boss) {
      const bw = 420;
      const bx = (w - bw) * 0.5;
      const by = 68;
      window.drawOutlinedRect(ctx, bx, by, bw, 26, 8, '#111827', '#fde047', 3.5);
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx + 4, by + 4, (bw - 8) * ratio, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`👑 ${boss.name}`, w * 0.5, by + 18);
    } else if (this.enemies.length === 0 && Math.floor(this.goArrowTimer * 3) % 2 === 0) {
      window.drawOutlinedRect(ctx, w - 210, 95, 180, 48, 12, '#22c55e', '#111827', 4);
      ctx.fillStyle = '#052e16';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AVANCE! ➔', w - 120, 127);
    }
  }

  // Draws a crisp 16-bit Pixel Art Heart with black outline and white specular shine
  drawPixelHeart(ctx, x, y, filled) {
    const p = 3; // 3px per pixel-art block
    const grid = [
      ' 111 111 ',
      '122212221',
      '123222221',
      '122222221',
      ' 1222221 ',
      '  12221  ',
      '   121   ',
      '    1    '
    ];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const ch = grid[r][c];
        if (ch === ' ') continue;
        if (ch === '1') ctx.fillStyle = '#111827';
        else if (ch === '2') ctx.fillStyle = filled ? '#ef4444' : '#334155';
        else if (ch === '3') ctx.fillStyle = filled ? '#ffffff' : '#64748b';
        ctx.fillRect(x + c * p, y + r * p, p, p);
      }
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((ts) => this.loop(ts));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new HeroBrawlerGame();
});
