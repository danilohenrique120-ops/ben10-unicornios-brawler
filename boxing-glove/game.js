// Super Punch 3D - Fluid Spring Boxing & Realistic Ragdoll Engine
// Seamless automatic stage progression, sculpted leather glove, fluid dynamic spring arm,
// interactive physics props, and tablet/mobile adaptive framing.

let scene, camera, renderer, floorMesh;
let gloveRig, gloveMesh, gloveLeatherMat, springBodyGroup, springCoils = [], springInnerRod;
let gloveBasePos = new THREE.Vector3(0.75, 0.72, 4.95);
let currentGloveWorldPos = new THREE.Vector3();
let currentGloveTargetLook = new THREE.Vector3(0, 1.2, -1.8);

let currentScenario = null;
let enemies = [];
let dynamicProps = [];
let isPunching = false;
let isTransitioning = false;
let currentLevel = 1;
let coins = 50;
let currentMode = 'normal'; // normal, gold, turbo, heavy, gravity, giant

let audioCtx = null;
let isMuted = false;
let screenShake = 0;
let hitStopUntil = 0;

// ================== WEB AUDIO SYNTHESIZER ==================
function initAudio() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playSpringWhoosh(fast = false) {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const dur = fast ? 0.1 : 0.16;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(190, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + dur);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

function playHeavyImpact(heavy = false) {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // Deep punch thud
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(heavy ? 115 : 155, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.28);
  gain.gain.setValueAtTime(heavy ? 0.8 : 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  // Leather slap crack
  const len = Math.floor(audioCtx.sampleRate * 0.12);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 1100;
  const nGain = audioCtx.createGain();
  nGain.gain.setValueAtTime(0.55, now);
  nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

  src.connect(filt);
  filt.connect(nGain);
  nGain.connect(audioCtx.destination);
  src.start(now);
}

function playPropClatter() {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(420 + Math.random() * 180, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

function playLevelClearChime() {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const t = audioCtx.currentTime + i * 0.08;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  });
}

// ================== INITIALIZATION ==================
function initGame() {
  const container = document.getElementById('game-container');

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  // Studio reflection environment for realistic leather, chrome & porcelain highlights
  scene.environment = window.PunchTextures.createStudioEnvMap(renderer);

  // Three-point natural daylight setup
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 0.78);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
  keyLight.position.set(6, 13, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 36;
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.5);
  rimLight.position.set(-7, 6, -5);
  scene.add(rimLight);

  // Ground Plane (material swapped dynamically per scenario!)
  floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  buildSculptedBoxingGloveAndSpring();
  updateResponsiveCamera();
  loadLevel(currentLevel);

  window.addEventListener('resize', () => {
    onWindowResize();
  });

  setupTouchAndInteraction();
  setupModes();

  document.getElementById('btn-sound').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('btn-sound').textContent = isMuted ? '🔇' : '🔊';
  });

  requestAnimationFrame(animate);
}

// Responsive Framing for Portrait Phones, Tablets (iPad/Android), and Desktops
function updateResponsiveCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect < 0.75) {
    // Portrait phone / narrow tablet
    camera.fov = 56;
    camera.position.set(0, 2.55, 8.2);
    gloveBasePos.set(0.62, 0.65, 5.7);
  } else if (aspect < 1.15) {
    // Portrait / square-ish tablet (like iPad in video!)
    camera.fov = 50;
    camera.position.set(0, 2.4, 7.5);
    gloveBasePos.set(0.72, 0.72, 5.15);
  } else {
    // Landscape tablet / desktop
    camera.fov = 44;
    camera.position.set(0, 2.25, 7.0);
    gloveBasePos.set(0.85, 0.75, 4.75);
  }
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 1.22, -1.6);

  if (!isPunching) {
    currentGloveWorldPos.copy(gloveBasePos);
  }
}

// ================== SCULPTED LEATHER GLOVE & FLUID SEGMENTED SPRING ==================
function buildSculptedBoxingGloveAndSpring() {
  gloveRig = new THREE.Group();

  const leatherBump = window.PunchTextures.getLeatherBumpMap();
  gloveLeatherMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.26,
    metalness: 0.08,
    bumpMap: leatherBump,
    bumpScale: 0.018
  });

  const whiteLeatherMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.05,
    bumpMap: leatherBump,
    bumpScale: 0.012
  });

  const darkStrapMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.48,
    metalness: 0.1
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4
  });

  gloveMesh = new THREE.Group();

  // 1. Main Padded Fist Shell (smooth sculpted profile)
  const fistGeo = new THREE.SphereGeometry(0.46, 32, 26);
  fistGeo.scale(1.12, 1.06, 1.32);
  const fist = new THREE.Mesh(fistGeo, gloveLeatherMat);
  fist.position.set(0, 0.03, -0.14);
  fist.castShadow = true;
  gloveMesh.add(fist);

  // 2. Folded Fingers Padding Cushion at Front-Bottom
  const foldGeo = new THREE.SphereGeometry(0.32, 24, 18);
  foldGeo.scale(1.25, 0.65, 0.82);
  const fold = new THREE.Mesh(foldGeo, gloveLeatherMat);
  fold.position.set(0, -0.22, -0.34);
  fold.rotation.x = 0.25;
  fold.castShadow = true;
  gloveMesh.add(fold);

  // 3. Curved Padded Thumb tucked on the side
  const thumbGroup = new THREE.Group();
  const thumbBase = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 16), gloveLeatherMat);
  thumbBase.scale.set(0.85, 1.15, 1.35);
  thumbBase.castShadow = true;
  const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), gloveLeatherMat);
  thumbTip.scale.set(0.9, 1.0, 1.1);
  thumbTip.position.set(0.06, -0.1, -0.2);
  thumbGroup.add(thumbBase, thumbTip);
  thumbGroup.position.set(-0.42, -0.04, -0.02);
  thumbGroup.rotation.set(0.28, -0.25, 0.35);
  gloveMesh.add(thumbGroup);

  // 4. White Stitched Seam Piping around glove edge
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.018, 10, 32), seamMat);
  seam.rotation.y = Math.PI / 2;
  seam.scale.set(1.1, 0.96, 1.0);
  seam.position.set(-0.08, 0.02, -0.12);
  gloveMesh.add(seam);

  // 5. Padded White Wrist Cuff & Black Velcro Strap
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.37, 0.36, 26), whiteLeatherMat);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.set(0, 0, 0.36);
  cuff.castShadow = true;
  gloveMesh.add(cuff);

  const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.365, 0.38, 0.16, 26), darkStrapMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.set(0, 0, 0.42);
  strap.castShadow = true;
  gloveMesh.add(strap);

  // Gold/Orange mechanical wrist ring connecting cleanly into the spring
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
  const wristRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 12, 24), collarMat);
  wristRing.position.set(0, 0, 0.55);
  gloveMesh.add(wristRing);

  scene.add(gloveMesh);

  // 6. Dynamic Segmented Spring Coils + Telescoping Elastic Core
  // Built with individual 3D rings distributed evenly between the launcher base and wrist every frame!
  // This guarantees ZERO weird scaling distortion and silky-smooth curvature when stretching!
  springBodyGroup = new THREE.Group();
  const coilMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.72,
    roughness: 0.22
  });
  const coilGeo = new THREE.TorusGeometry(0.16, 0.038, 10, 22);

  const NUM_COILS = 22;
  for (let i = 0; i < NUM_COILS; i++) {
    const ring = new THREE.Mesh(coilGeo, coilMat);
    ring.castShadow = true;
    springCoils.push(ring);
    springBodyGroup.add(ring);
  }

  // Sleek metallic inner piston shaft
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    metalness: 0.55,
    roughness: 0.25
  });
  springInnerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1, 14), innerMat);
  springInnerRod.castShadow = true;
  springBodyGroup.add(springInnerRod);

  scene.add(springBodyGroup);

  currentGloveWorldPos.copy(gloveBasePos);
  updateGloveAndSpringTransform(0);
}

// Updates the Glove position/orientation AND smoothly distributes all 22 spring coils
// along a subtle elastic arc between the anchored base and the glove's wrist socket!
function updateGloveAndSpringTransform(arcLift = 0) {
  gloveMesh.position.copy(currentGloveWorldPos);
  gloveMesh.lookAt(currentGloveTargetLook);
  // Subtle natural wrist tilt
  gloveMesh.rotateZ(0.12);

  // Anchor origin slightly below and behind the resting glove
  const originPos = gloveBasePos.clone().add(new THREE.Vector3(0.08, -0.32, 0.85));

  // Wrist attachment point in world space (local z = +0.55 on gloveMesh)
  const wristOffset = new THREE.Vector3(0, 0, 0.55 * gloveMesh.scale.z);
  wristOffset.applyQuaternion(gloveMesh.quaternion);
  const wristPos = gloveMesh.position.clone().add(wristOffset);

  const dir = new THREE.Vector3().subVectors(wristPos, originPos);
  const totalLen = Math.max(0.05, dir.length());

  // Midpoint with subtle upward elastic arc during fast extension
  const midPos = originPos.clone().lerp(wristPos, 0.5);
  midPos.y += arcLift;

  const curve = new THREE.QuadraticBezierCurve3(originPos, midPos, wristPos);

  const count = springCoils.length;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const ring = springCoils[i];

    ring.position.copy(pt);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    // Slight helical stagger for realistic coiled spring look
    ring.rotation.x += Math.sin(t * Math.PI * 10) * 0.14;
    ring.rotation.y += Math.cos(t * Math.PI * 10) * 0.14;

    // Slightly taper coil radius as it stretches fast
    const stretchCompression = Math.max(0.75, 1.08 - totalLen * 0.035);
    ring.scale.set(stretchCompression, stretchCompression, 1);
  }

  // Update inner elastic piston rod cleanly between origin and wrist
  springInnerRod.position.copy(originPos).lerp(wristPos, 0.5);
  springInnerRod.scale.set(1, totalLen, 1);
  springInnerRod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
}

// ================== LEVEL LOADING & SEAMLESS TRANSITION ==================
function loadLevel(lvl) {
  // Clean previous scenario & enemies
  if (currentScenario && currentScenario.group) {
    scene.remove(currentScenario.group);
  }
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  dynamicProps = [];

  currentScenario = window.PunchScenarios.buildScenario(scene, lvl, floorMesh);
  enemies = currentScenario.enemies;
  dynamicProps = currentScenario.dynamicProps;

  document.getElementById('level-display').textContent = `Level ${lvl}`;
  document.getElementById('level-theme').textContent = currentScenario.themeName;
  isTransitioning = false;
}

function advanceToNextLevelAutomatically() {
  if (isTransitioning) return;
  isTransitioning = true;

  playLevelClearChime();

  const toast = document.getElementById('stage-toast');
  const cheers = ['⭐ NOCAUTE! ⭐', '💥 PERFEITO! 💥', '🎉 PRÓXIMO! 🎉', '🥊 MANDOU BEM! 🥊'];
  toast.textContent = cheers[Math.floor(Math.random() * cheers.length)];
  toast.classList.add('show');

  // Let the ragdoll fly dramatically for ~950ms, then smoothly cross-fade directly into the next creative stage!
  setTimeout(() => {
    const curtain = document.getElementById('transition-curtain');
    curtain.classList.add('active');

    setTimeout(() => {
      toast.classList.remove('show');
      currentLevel++;
      loadLevel(currentLevel);

      setTimeout(() => {
        curtain.classList.remove('active');
      }, 140);
    }, 260);
  }, 920);
}

// ================== FLUID RAYCAST PUNCH MECHANICS ==================
function findBestPunchTarget(screenX, screenY) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(
    (screenX / window.innerWidth) * 2 - 1,
    -(screenY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);

  // 1. Check direct raycast hit on active enemies first
  const activeEnemies = enemies.filter(e => !e.userData.isHit);
  const enemyHits = raycaster.intersectObjects(activeEnemies, true);
  if (enemyHits.length > 0) {
    return {
      point: enemyHits[0].point.clone(),
      directObject: enemyHits[0].object
    };
  }

  // 2. Check raycast hit on interactive props (bowling pins, mugs, ball, door, etc.)
  const propHits = raycaster.intersectObjects(dynamicProps, true);
  if (propHits.length > 0) {
    return {
      point: propHits[0].point.clone(),
      directObject: propHits[0].object
    };
  }

  // 3. Kid-friendly generous aim assist: check screen-space proximity to any standing enemy!
  let closestEnemy = null;
  let closestDistPx = 115; // generous tablet finger radius
  activeEnemies.forEach(en => {
    const center = new THREE.Vector3();
    en.getWorldPosition(center);
    center.y += 0.9;
    const proj = center.clone().project(camera);
    const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
    const d = Math.hypot(sx - screenX, sy - screenY);
    if (d < closestDistPx) {
      closestDistPx = d;
      closestEnemy = center;
    }
  });

  if (closestEnemy) {
    return { point: closestEnemy, directObject: null };
  }

  // 4. Fallback: intersect depth plane around z = -1.8
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.8);
  const fallbackPt = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, fallbackPt);
  if (!fallbackPt || isNaN(fallbackPt.x)) {
    fallbackPt.set(ndc.x * 3.2, 1.3, -1.8);
  }
  fallbackPt.y = Math.max(0.35, Math.min(4.2, fallbackPt.y));
  return { point: fallbackPt, directObject: null };
}

function launchFluidPunch(screenX, screenY) {
  if (isPunching || isTransitioning) return;
  isPunching = true;

  const { point: targetPoint } = findBestPunchTarget(screenX, screenY);
  currentGloveTargetLook.copy(targetPoint);

  const isTurbo = currentMode === 'turbo';
  const isHeavy = currentMode === 'heavy' || currentMode === 'giant';
  playSpringWhoosh(isTurbo);

  // Offset stop point slightly in front of target surface so glove knuckles connect cleanly
  const dirToTarget = new THREE.Vector3().subVectors(targetPoint, gloveBasePos).normalize();
  const impactPoint = targetPoint.clone().addScaledVector(dirToTarget, -0.35);

  const speedScale = isTurbo ? 0.52 : (isHeavy ? 1.15 : 0.88);

  // Step 1: Snappy Wind-up anticipation (pulls back 0.25m)
  const pullBackPos = gloveBasePos.clone().addScaledVector(dirToTarget, -0.25);

  const windupTween = new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, 42 * speedScale)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(({ t }) => {
      currentGloveWorldPos.lerpVectors(gloveBasePos, pullBackPos, t);
      updateGloveAndSpringTransform(0);
    })
    .onComplete(() => {
      // Step 2: Fast, whip-smooth extension to target with slight organic arc!
      const extendTween = new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 118 * speedScale)
        .easing(TWEEN.Easing.Quartic.Out)
        .onUpdate(({ t }) => {
          currentGloveWorldPos.lerpVectors(pullBackPos, impactPoint, t);
          // Slight whip arc peaks in mid-flight and lands dead-center on target
          const arc = Math.sin(t * Math.PI) * 0.28;
          currentGloveWorldPos.y += arc * 0.45;
          updateGloveAndSpringTransform(arc);
        })
        .onComplete(() => {
          // Process Collision & Impact Juice!
          const hitSomething = processImpactAt(targetPoint, dirToTarget, screenX, screenY);

          // Step 3: Elastic Spring Recoil back to resting pose
          const recoilDelay = hitSomething ? 45 : 0;
          setTimeout(() => {
            const retractFrom = currentGloveWorldPos.clone();
            new TWEEN.Tween({ t: 0 })
              .to({ t: 1 }, 240 * speedScale)
              .easing(TWEEN.Easing.Back.Out)
              .onUpdate(({ t }) => {
                currentGloveWorldPos.lerpVectors(retractFrom, gloveBasePos, t);
                const returnArc = Math.sin(t * Math.PI) * -0.14;
                updateGloveAndSpringTransform(returnArc);
              })
              .onComplete(() => {
                currentGloveWorldPos.copy(gloveBasePos);
                updateGloveAndSpringTransform(0);
                isPunching = false;

                // Check if all enemies in stage are knocked out -> automatic transition!
                if (enemies.length > 0 && enemies.every(e => e.userData.isHit)) {
                  advanceToNextLevelAutomatically();
                }
              })
              .start();
          }, recoilDelay);
        });

      extendTween.start();
    });

  windupTween.start();
}

function processImpactAt(hitPos, punchDir, screenX, screenY) {
  let hitEnemyCount = 0;
  let hitPropCount = 0;
  const hitRadius = currentMode === 'giant' ? 2.3 : 1.75;

  // 1. Check Ragdoll Enemies
  enemies.forEach(enemy => {
    if (enemy.userData.isHit) return;

    // Compare against enemy torso world center
    const torsoWorld = new THREE.Vector3();
    enemy.userData.torsoGroup.getWorldPosition(torsoWorld);
    const dist = torsoWorld.distanceTo(hitPos);

    if (dist < hitRadius) {
      hitEnemyCount++;
      enemy.userData.isHit = true;

      let force = 23;
      if (currentMode === 'heavy') force = 36;
      if (currentMode === 'giant') force = 42;
      if (currentMode === 'gravity') force = 17;

      const launchVec = new THREE.Vector3(
        (torsoWorld.x - hitPos.x) * 3.5 + punchDir.x * 7 + (Math.random() - 0.5) * 3,
        8.5 + Math.random() * 5,
        -16 - Math.random() * 7
      ).normalize().multiplyScalar(force);

      enemy.userData.velocity.copy(launchVec);
      enemy.userData.rotVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }
  });

  // 2. Check Interactive Props (Bowling pins, mugs, beach ball, door, plant, crates!)
  dynamicProps.forEach(prop => {
    const pWorld = new THREE.Vector3();
    prop.getWorldPosition(pWorld);
    if (pWorld.distanceTo(hitPos) < hitRadius * 0.95) {
      hitPropCount++;
      prop.userData.launched = true;
      const force = (currentMode === 'giant' ? 28 : 18) / Math.max(0.5, prop.userData.mass || 1);
      prop.userData.velocity.set(
        (pWorld.x - hitPos.x) * 4 + (Math.random() - 0.5) * 5,
        6 + Math.random() * 6,
        -10 - Math.random() * 6
      ).normalize().multiplyScalar(force);
      prop.userData.rotVelocity.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      );
    }
  });

  if (hitEnemyCount > 0) {
    playHeavyImpact(currentMode === 'heavy' || currentMode === 'giant');
    screenShake = currentMode === 'heavy' || currentMode === 'giant' ? 20 : 13;
    hitStopUntil = performance.now() + 45;

    const flash = document.getElementById('impact-flash');
    flash.style.opacity = '0.7';
    setTimeout(() => { flash.style.opacity = '0'; }, 65);

    coins += hitEnemyCount;
    document.getElementById('coins-count').textContent = coins;

    createShockwave(hitPos);
    createImpactBurst(hitPos, 0xfacc15, 16);
    spawnComicHitText(screenX, screenY);
    return true;
  } else if (hitPropCount > 0) {
    playPropClatter();
    screenShake = 6;
    createShockwave(hitPos);
    createImpactBurst(hitPos, 0xffffff, 8);
    return true;
  }

  return false;
}

function spawnComicHitText(x, y) {
  const words = ['POW! 💥', 'BAM! ⭐', 'SMASH!', 'NOCAUTE!', 'BOING! 🥊'];
  const el = document.createElement('div');
  el.className = 'hit-floating-text';
  el.textContent = words[Math.floor(Math.random() * words.length)];
  el.style.left = x + 'px';
  el.style.top = (y - 25) + 'px';
  document.getElementById('game-container').appendChild(el);
  setTimeout(() => el.remove(), 750);
}

function createShockwave(pos) {
  const ringGeo = new THREE.RingGeometry(0.12, 0.36, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.lookAt(camera.position);
  scene.add(ring);

  new TWEEN.Tween({ s: 1, o: 0.92 })
    .to({ s: 6.2, o: 0 }, 260)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(({ s, o }) => {
      ring.scale.set(s, s, s);
      ring.material.opacity = o;
    })
    .onComplete(() => scene.remove(ring))
    .start();
}

function createImpactBurst(pos, colorHex, count = 14) {
  for (let i = 0; i < count; i++) {
    const pGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const pMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? colorHex : 0xffffff });
    const pt = new THREE.Mesh(pGeo, pMat);
    pt.position.copy(pos);
    scene.add(pt);

    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * 4.5,
      Math.random() * 3.8 + 0.8,
      (Math.random() - 0.5) * 4.5
    );

    new TWEEN.Tween(pt.position)
      .to({ x: pos.x + spread.x, y: pos.y + spread.y, z: pos.z + spread.z }, 380)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => scene.remove(pt))
      .start();
  }
}

// ================== INPUT & MODES ==================
function setupTouchAndInteraction() {
  const container = document.getElementById('game-container');
  const reticle = document.getElementById('reticle');
  let hideReticleTimer = null;

  function showReticleAt(x, y) {
    reticle.style.left = x + 'px';
    reticle.style.top = y + 'px';
    reticle.classList.add('visible');
    clearTimeout(hideReticleTimer);
    hideReticleTimer = setTimeout(() => {
      reticle.classList.remove('visible');
    }, 950);
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#ui-layer')) return;
    initAudio();
    showReticleAt(e.clientX, e.clientY);
    launchFluidPunch(e.clientX, e.clientY);
  });

  // Smoothly track aim if user hovers mouse or drags finger
  container.addEventListener('pointermove', (e) => {
    if (isPunching || e.target.closest('#ui-layer')) return;
    const { point } = findBestPunchTarget(e.clientX, e.clientY);
    currentGloveTargetLook.lerp(point, 0.25);
  });
}

function setupModes() {
  const btns = document.querySelectorAll('.mode-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      applyGloveMode(currentMode);
    });
  });
}

function applyGloveMode(mode) {
  gloveLeatherMat.emissive = new THREE.Color(0x000000);
  gloveLeatherMat.metalness = 0.08;
  gloveLeatherMat.roughness = 0.26;

  if (mode === 'gold') {
    gloveLeatherMat.color.setHex(0xfacc15);
    gloveLeatherMat.metalness = 0.92;
    gloveLeatherMat.roughness = 0.14;
  } else if (mode === 'turbo') {
    gloveLeatherMat.color.setHex(0x0ea5e9);
    gloveLeatherMat.emissive = new THREE.Color(0x0369a1);
  } else if (mode === 'heavy') {
    gloveLeatherMat.color.setHex(0x1e293b);
    gloveLeatherMat.metalness = 0.55;
  } else if (mode === 'gravity') {
    gloveLeatherMat.color.setHex(0x9333ea);
    gloveLeatherMat.emissive = new THREE.Color(0x6b21a8);
  } else {
    gloveLeatherMat.color.setHex(0xdc2626);
  }

  const targetScale = mode === 'giant' ? 1.65 : 1.0;
  new TWEEN.Tween(gloveMesh.scale)
    .to({ x: targetScale, y: targetScale, z: targetScale }, 200)
    .easing(TWEEN.Easing.Back.Out)
    .start();
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateResponsiveCamera();
}

// ================== MAIN ANIMATION LOOP ==================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const rawDt = Math.min(0.035, (now - lastTime) / 1000);
  lastTime = now;

  // Crisp 45ms impact hit-stop freeze frame for heavy punch feel!
  if (now < hitStopUntil) {
    renderer.render(scene, camera);
    return;
  }

  TWEEN.update(now);

  const timeSec = now * 0.001;
  const gravity = currentMode === 'gravity' ? -2.8 : -18.5;

  // Update Ragdolls (breathing, blinking, waving & ragdoll flight)
  enemies.forEach(en => {
    window.PunchRagdoll.updateEnemyAnimation(en, timeSec, rawDt, gravity);
  });

  // Update launched interactive props (bowling pins, mugs, beach balls, etc.)
  dynamicProps.forEach(prop => {
    if (!prop.userData.launched) return;
    prop.userData.velocity.y += gravity * rawDt;
    prop.position.addScaledVector(prop.userData.velocity, rawDt);
    prop.rotation.x += prop.userData.rotVelocity.x * rawDt;
    prop.rotation.y += prop.userData.rotVelocity.y * rawDt;
    prop.rotation.z += prop.userData.rotVelocity.z * rawDt;
  });

  // Idle glove breathing & smooth spring sync when not punching
  if (!isPunching) {
    currentGloveWorldPos.set(
      gloveBasePos.x + Math.cos(timeSec * 2.2) * 0.03,
      gloveBasePos.y + Math.sin(timeSec * 4.4) * 0.04,
      gloveBasePos.z
    );
    updateGloveAndSpringTransform(0);
  }

  // Smooth damped camera screen shake
  if (screenShake > 0.15) {
    const baseCamY = window.innerWidth / window.innerHeight < 1.15 ? 2.4 : 2.25;
    camera.position.x = (Math.random() - 0.5) * screenShake * 0.024;
    camera.position.y = baseCamY + (Math.random() - 0.5) * screenShake * 0.024;
    screenShake *= 0.84;
  } else if (screenShake > 0) {
    screenShake = 0;
    updateResponsiveCamera();
  }

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', initGame);
