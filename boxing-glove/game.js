// Super Punch 3D - High-Fidelity Ragdoll & Spring Boxing Engine
// Desenvolvido para máxima fidelidade visual ao vídeo, física ragdoll realista e suporte perfeito a tablets

let scene, camera, renderer;
let gloveGroup, gloveMesh, springGroup, springSegments = [];
let enemies = [];
let roomProps = [];
let isPunching = false;
let currentLevel = 21;
let coins = 50;
let currentMode = 'normal'; // normal, gold, turbo, heavy, gravity, giant
let audioCtx = null;
let isMuted = false;
let screenShake = 0;
let shockwaves = [];

// Sintetizador de Áudio Realista (Web Audio API)
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSpringSound() {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // Som de mola telescópica metálica zunindo
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.11);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

  // Filtro ressonante metálico
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.value = 4.0;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

function playHeavyPunchImpact() {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  // 1. Pancada Grave (Sub-bass thump)
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.28);
  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.28);

  // 2. Estalo Seco de Couro / Pancada (Slap crack)
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.12, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
}

function playVictoryFanfare() {
  if (isMuted) return;
  initAudio();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const now = audioCtx.currentTime + idx * 0.11;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  });
}

// Configuração e Renderização Three.js Realista
function initGame() {
  const container = document.getElementById('game-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdcecf8);
  scene.fog = new THREE.FogExp2(0xdcecf8, 0.022);

  camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
  // Posição de câmera em primeira pessoa idêntica ao tablet no vídeo
  camera.position.set(0, 2.3, 7.2);
  camera.lookAt(0, 1.25, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // Iluminação com Sombras Suaves e Realismo
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb8d4f0, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffdf7, 1.1);
  keyLight.position.set(6, 14, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0003;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xa5c9eb, 0.45);
  fillLight.position.set(-8, 6, 4);
  scene.add(fillLight);

  buildHighDefEnvironment();
  buildRealisticBoxingGlove();
  loadLevel(currentLevel);

  window.addEventListener('resize', onWindowResize);
  setupTouchAndInteraction();
  setupModes();

  document.getElementById('btn-sound').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('btn-sound').textContent = isMuted ? '🔇' : '🔊';
  });

  animate();
}

// Chão 3D e Sala com Paredes e Iluminação Refinada (Estilo vídeo)
function buildHighDefEnvironment() {
  // Chão Quadriculado com Textura Procedural e Reflexão Suave
  const floorGeo = new THREE.PlaneGeometry(80, 80);
  
  // Criar textura de azulejos finos quadriculados realistas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#b0bec5';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0); ctx.lineTo(i, 512);
    ctx.moveTo(0, i); ctx.lineTo(512, i);
    ctx.stroke();
  }
  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(20, 20);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.35,
    metalness: 0.08
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Rodapé e Parede de Fundo Sutil
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xecf3f9, roughness: 0.7 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), wallMat);
  backWall.position.set(0, 10, -18);
  backWall.receiveShadow = true;
  scene.add(backWall);
}

// Luva de Boxe Realista com Costura, Couro e Mola Telescópica Amarela/Laranja
function buildRealisticBoxingGlove() {
  gloveGroup = new THREE.Group();

  // Material de Couro Vermelho com Brilho e Especificações Realistas
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0xef233c,
    roughness: 0.28,
    metalness: 0.12
  });

  // Cabeça Principal da Luva (Formato anatômico curvo de boxe)
  const knuckleGeo = new THREE.SphereGeometry(0.55, 32, 24);
  knuckleGeo.scale(1.15, 1.35, 1.45);
  const knuckles = new THREE.Mesh(knuckleGeo, leatherMat);
  knuckles.castShadow = true;

  // Polegar Ergonômico Acolchoado
  const thumbGeo = new THREE.SphereGeometry(0.26, 20, 16);
  thumbGeo.scale(0.85, 1.4, 0.95);
  const thumb = new THREE.Mesh(thumbGeo, leatherMat);
  thumb.position.set(-0.42, 0.08, 0.18);
  thumb.rotation.set(0.2, 0.1, Math.PI / 3.8);
  thumb.castShadow = true;

  // Punho Branco com Detalhe de Velcro
  const cuffGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.45, 28);
  const cuffMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const cuff = new THREE.Mesh(cuffGeo, cuffMat);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.z = 0.75;
  cuff.castShadow = true;

  // Faixa de Fechamento do Punho
  const strapGeo = new THREE.CylinderGeometry(0.40, 0.44, 0.18, 28);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.z = 0.78;
  strap.castShadow = true;

  gloveMesh = new THREE.Group();
  gloveMesh.add(knuckles);
  gloveMesh.add(thumb);
  gloveMesh.add(cuff);
  gloveMesh.add(strap);

  // Mola Espiral / Braço Telescópico Laranja (Igual ao vídeo)
  springGroup = new THREE.Group();
  const springPoints = [];
  const loops = 18;
  for (let i = 0; i <= 140; i++) {
    const t = i / 140;
    const angle = t * Math.PI * 2 * loops;
    const r = 0.19;
    springPoints.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, -t));
  }
  const springCurve = new THREE.CatmullRomCurve3(springPoints);
  const springGeo = new THREE.TubeGeometry(springCurve, 140, 0.045, 10, false);
  const springMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    metalness: 0.75,
    roughness: 0.25
  });
  const mainSpring = new THREE.Mesh(springGeo, springMat);
  mainSpring.castShadow = true;
  mainSpring.position.z = 0.85;
  mainSpring.scale.set(1, 1, 0.01);
  springGroup.add(mainSpring);

  // Haste de metal cromada interior da mola
  const coreRodGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 12);
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.1 });
  const coreRod = new THREE.Mesh(coreRodGeo, chromeMat);
  coreRod.rotation.x = Math.PI / 2;
  coreRod.position.z = 0.85;
  coreRod.scale.set(1, 0.01, 1);
  springGroup.add(coreRod);

  gloveGroup.add(springGroup);
  gloveGroup.add(gloveMesh);

  // Posição no canto inferior direito da tela (visão de primeira pessoa para tablet/mobile)
  gloveGroup.position.set(0.68, 0.85, 5.1);
  gloveGroup.rotation.set(-0.06, -0.16, 0.05);
  scene.add(gloveGroup);
}

// Bonecos Ragdoll Realistas com Articulações e Membros Flexíveis
function createRagdollEnemy(type = 'green', pos = new THREE.Vector3(0, 0, 0), pose = 'lie') {
  const enemy = new THREE.Group();

  let bodyColor = 0x22c55e; // Verde vibrante Kermit
  if (type === 'purple') bodyColor = 0xa855f7; // Roxo vibrante
  if (type === 'blue') bodyColor = 0x0284c7; // Azul royal
  if (type === 'pink') bodyColor = 0xec4899; // Rosa
  if (type === 'gold') bodyColor = 0xf59e0b; // Dourado

  const skinMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.35,
    metalness: 0.05
  });

  // Cabeça expressiva com olhos realistas 3D
  const headGroup = new THREE.Group();
  const headGeo = new THREE.SphereGeometry(0.42, 24, 20);
  headGeo.scale(1.15, 1.25, 1.05);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Olhos Esbugalhados Cômicos em relevo com Íris e Brilho
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

  [-0.19, 0.19].forEach(xOff => {
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), eyeWhiteMat);
    eyeSocket.position.set(xOff, 0.22, 0.32);
    eyeSocket.castShadow = true;

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), irisMat);
    iris.position.set(xOff, 0.22, 0.42);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), pupilMat);
    pupil.position.set(xOff, 0.22, 0.45);

    headGroup.add(eyeSocket);
    headGroup.add(iris);
    headGroup.add(pupil);
  });

  // Boca sorridente
  const mouthGeo = new THREE.TorusGeometry(0.2, 0.035, 10, 20, Math.PI);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.06, 0.38);
  mouth.rotation.x = Math.PI * 0.82;
  headGroup.add(mouth);
  headGroup.position.set(0, 1.7, 0);

  // Tronco com Peitoral e Abdômen
  const torsoGroup = new THREE.Group();
  const torsoGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.85, 20);
  const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);
  torsoGroup.position.set(0, 1.05, 0);

  // Membros Articulados (Braço superior, Antebraço, Coxa e Canela)
  function createLimbSegment(len = 0.5, radius = 0.11) {
    const segGroup = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius * 0.95, radius, len, 14);
    const mesh = new THREE.Mesh(geo, skinMat);
    mesh.position.y = -len * 0.5;
    mesh.castShadow = true;

    // Junta esférica
    const jointGeo = new THREE.SphereGeometry(radius * 1.15, 12, 12);
    const joint = new THREE.Mesh(jointGeo, skinMat);
    segGroup.add(mesh);
    segGroup.add(joint);
    return { group: segGroup, length: len };
  }

  // Braços
  const leftUpperArm = createLimbSegment(0.45, 0.11);
  const leftForeArm = createLimbSegment(0.45, 0.09);
  leftUpperArm.group.position.set(-0.46, 0.35, 0);
  leftForeArm.group.position.set(0, -leftUpperArm.length, 0);
  leftUpperArm.group.add(leftForeArm.group);
  torsoGroup.add(leftUpperArm.group);

  const rightUpperArm = createLimbSegment(0.45, 0.11);
  const rightForeArm = createLimbSegment(0.45, 0.09);
  rightUpperArm.group.position.set(0.46, 0.35, 0);
  rightForeArm.group.position.set(0, -rightUpperArm.length, 0);
  rightUpperArm.group.add(rightForeArm.group);
  torsoGroup.add(rightUpperArm.group);

  // Pernas
  const leftThigh = createLimbSegment(0.55, 0.13);
  const leftCalf = createLimbSegment(0.55, 0.11);
  leftThigh.group.position.set(-0.22, -0.42, 0);
  leftCalf.group.position.set(0, -leftThigh.length, 0);
  leftThigh.group.add(leftCalf.group);
  torsoGroup.add(leftThigh.group);

  const rightThigh = createLimbSegment(0.55, 0.13);
  const rightCalf = createLimbSegment(0.55, 0.11);
  rightThigh.group.position.set(0.22, -0.42, 0);
  rightCalf.group.position.set(0, -rightThigh.length, 0);
  rightThigh.group.add(rightCalf.group);
  torsoGroup.add(rightThigh.group);

  enemy.add(headGroup);
  enemy.add(torsoGroup);
  enemy.position.copy(pos);

  // Configuração de Poses Cômicas Realistas
  if (pose === 'lie') {
    // Deitado de lado folgado com cotovelo apoiado na cabeça (Igual ao vídeo no Level 21)
    enemy.rotation.z = Math.PI / 2;
    enemy.position.y = 0.42;
    headGroup.rotation.z = -0.45;
    leftUpperArm.group.rotation.set(0.3, 0, 1.2);
    leftForeArm.group.rotation.set(0, 0, 1.8);
    rightUpperArm.group.rotation.set(-0.2, 0, -0.6);
    leftThigh.group.rotation.set(0.3, 0, 0.2);
    rightThigh.group.rotation.set(-0.4, 0, -0.3);
  } else if (pose === 'sit') {
    // Sentado na privada (Igual ao vídeo no Level 22)
    enemy.position.y = 0.85;
    headGroup.rotation.x = 0.15;
    leftThigh.group.rotation.x = -Math.PI / 2;
    rightThigh.group.rotation.x = -Math.PI / 2;
    leftCalf.group.rotation.x = Math.PI / 2.2;
    rightCalf.group.rotation.x = Math.PI / 2.2;
    leftUpperArm.group.rotation.x = -0.4;
    rightUpperArm.group.rotation.x = -0.4;
  } else if (pose === 'dance') {
    enemy.position.y = 0.65;
    leftUpperArm.group.rotation.z = 1.6;
    rightUpperArm.group.rotation.z = -1.6;
    leftThigh.group.rotation.x = -0.5;
    rightThigh.group.rotation.x = 0.5;
  }

  enemy.userData = {
    isHit: false,
    velocity: new THREE.Vector3(0, 0, 0),
    rotVelocity: new THREE.Vector3(0, 0, 0),
    headGroup, torsoGroup,
    leftUpperArm, rightUpperArm,
    leftForeArm, rightForeArm,
    leftThigh, rightThigh,
    leftCalf, rightCalf
  };

  scene.add(enemy);
  enemies.push(enemy);
  return enemy;
}

// Cenários 3D Ricos: Banheiro / Cabines Azuis, Privadas, Mesas e Suportes
function buildPropsForLevel(level) {
  roomProps.forEach(p => scene.remove(p));
  roomProps = [];

  if (level % 2 === 0) {
    // Cabine Azul de Banheiro (Level 22 do vídeo)
    const stallGroup = new THREE.Group();
    const blueWallMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.45,
      metalness: 0.05
    });

    // Parede de trás da cabine
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.12), blueWallMat);
    backWall.position.set(0, 1.7, -1.3);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    stallGroup.add(backWall);

    // Paredes laterais da cabine
    const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 2.2), blueWallMat);
    side1.position.set(-1.3, 1.7, -0.2);
    side1.castShadow = true;
    stallGroup.add(side1);

    const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 2.2), blueWallMat);
    side2.position.set(1.3, 1.7, -0.2);
    side2.castShadow = true;
    stallGroup.add(side2);

    // Placa de porta / Moldura superior da cabine
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.25, 0.15), blueWallMat);
    topBar.position.set(0, 3.3, 0.9);
    stallGroup.add(topBar);

    // Privada de Porcelana Branca
    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05
    });

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.38, 0.75, 24), porcelainMat);
    bowl.position.set(0, 0.38, -0.45);
    bowl.castShadow = true;
    stallGroup.add(bowl);

    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.38), porcelainMat);
    tank.position.set(0, 1.05, -0.95);
    tank.castShadow = true;
    stallGroup.add(tank);

    // Tampa da privada
    const seatGeo = new THREE.TorusGeometry(0.38, 0.06, 12, 24);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.rotation.x = Math.PI / 2;
    seat.position.set(0, 0.76, -0.45);
    stallGroup.add(seat);

    stallGroup.position.set(0, 0, -2.1);
    scene.add(stallGroup);
    roomProps.push(stallGroup);
  } else {
    // Mesa de Escritório de Madeira e Cadeira
    const tableGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 2.2), woodMat);
    tableTop.position.y = 0.95;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    [[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.95, 12), woodMat);
      leg.position.set(x, 0.47, z);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    tableGroup.position.set(0, 0, -1.8);
    scene.add(tableGroup);
    roomProps.push(tableGroup);
  }
}

// Carregamento de Nível Infinito
function loadLevel(lvl) {
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  document.getElementById('win-overlay').style.display = 'none';
  document.getElementById('level-display').textContent = `Level ${lvl}`;

  buildPropsForLevel(lvl);

  if (lvl % 2 === 1) {
    // Nível 21: 1 Boneco Verde Folgado deitado na sala
    createRagdollEnemy('green', new THREE.Vector3(0, 0, -0.6), 'lie');
  } else {
    // Nível 22: 2 Bonecos (um roxo sentado na privada e outro verde deitado)
    createRagdollEnemy('purple', new THREE.Vector3(0, 0, -2.5), 'sit');
    createRagdollEnemy('green', new THREE.Vector3(1.1, 0, -1.1), 'lie');
  }

  // Níveis avançados têm bonecos adicionais
  if (lvl >= 24 && lvl % 3 === 0) {
    createRagdollEnemy('blue', new THREE.Vector3(-1.4, 0, -0.7), 'dance');
  }
}

// Disparo Dinâmico e Impacto Poderoso da Luva Mola
function launchSpringPunch(screenX, screenY) {
  if (isPunching) return;
  isPunching = true;
  playSpringSound();

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(
    (screenX / window.innerWidth) * 2 - 1,
    -(screenY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);

  // Plano Z de colisão onde ficam os bonecos
  let targetPoint = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1.2);
  raycaster.ray.intersectPlane(plane, targetPoint);

  if (!targetPoint || isNaN(targetPoint.x)) {
    targetPoint = new THREE.Vector3(mouse.x * 3.5, 1.3, -1.6);
  }

  const startPos = gloveGroup.position.clone();
  const punchVector = new THREE.Vector3().subVectors(targetPoint, startPos);
  const punchDistance = punchVector.length();

  let speedFactor = 1.0;
  if (currentMode === 'turbo') speedFactor = 0.55;
  if (currentMode === 'heavy') speedFactor = 1.25;

  const stretchDist = punchDistance + 1.4;

  // Animação Ultra-Fluida com TWEEN
  const forwardTween = new TWEEN.Tween({ t: 0.05 })
    .to({ t: 1.0 }, 120 * speedFactor)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(obj => {
      // Esticar a mola telescópica em direção ao alvo
      springGroup.children[0].scale.z = obj.t * stretchDist * 1.05;
      springGroup.children[1].scale.y = obj.t * stretchDist * 1.05;
      springGroup.lookAt(targetPoint);

      // Avançar a luva
      gloveMesh.position.copy(punchVector.clone().normalize().multiplyScalar(obj.t * stretchDist));
      gloveMesh.lookAt(targetPoint);
    })
    .onComplete(() => {
      // Processar Impacto e Efeitos
      triggerHitImpact(targetPoint);

      // Retrair a mola de volta
      new TWEEN.Tween({ t: 1.0 })
        .to({ t: 0.05 }, 160 * speedFactor)
        .easing(TWEEN.Easing.Cubic.In)
        .onUpdate(obj => {
          springGroup.children[0].scale.z = obj.t * stretchDist * 1.05;
          springGroup.children[1].scale.y = obj.t * stretchDist * 1.05;
          gloveMesh.position.copy(punchVector.clone().normalize().multiplyScalar(obj.t * stretchDist));
        })
        .onComplete(() => {
          gloveMesh.position.set(0, 0, 0);
          gloveMesh.rotation.set(0, 0, 0);
          springGroup.children[0].scale.set(1, 1, 0.01);
          springGroup.children[1].scale.set(1, 0.01, 1);
          isPunching = false;
          checkLevelWin();
        })
        .start();
    });

  forwardTween.start();
}

// Colisão Realista e Efeitos Visuais Cinematográficos de Impacto
function triggerHitImpact(hitPos) {
  let hitCount = 0;

  enemies.forEach(enemy => {
    if (enemy.userData.isHit) return;

    const dist = enemy.position.distanceTo(hitPos);
    if (dist < 1.9) {
      hitCount++;
      enemy.userData.isHit = true;
      playHeavyPunchImpact();

      // Screen Shake dinâmico
      screenShake = currentMode === 'heavy' ? 18 : 12;

      // Flash branco na tela
      const flash = document.getElementById('impact-flash');
      flash.style.opacity = '0.65';
      setTimeout(() => flash.style.opacity = '0', 70);

      // Física de Voo Realista com Rotação Livre e Dobra de Membros
      let force = 24;
      if (currentMode === 'heavy') force = 38;
      if (currentMode === 'giant') force = 44;
      if (currentMode === 'gravity') force = 18;

      const flyAngle = new THREE.Vector3(
        (enemy.position.x - hitPos.x) * 4.5 + (Math.random() - 0.5) * 3,
        9.5 + Math.random() * 5.5,
        -18 - Math.random() * 8
      ).normalize().multiplyScalar(force);

      enemy.userData.velocity.copy(flyAngle);
      enemy.userData.rotVelocity.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 22
      );

      // Ondas de Choque 3D e Faíscas Estelares
      createShockwave(hitPos);
      createImpactStars(hitPos);
    }
  });

  if (hitCount > 0) {
    coins += hitCount;
    document.getElementById('coins-count').textContent = coins;
  }
}

// Onda de Choque Visual Expandindo no Ar
function createShockwave(pos) {
  const ringGeo = new THREE.RingGeometry(0.1, 0.35, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.lookAt(camera.position);
  scene.add(ring);

  new TWEEN.Tween({ scale: 1, opacity: 0.9 })
    .to({ scale: 6.5, opacity: 0 }, 280)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(obj => {
      ring.scale.set(obj.scale, obj.scale, obj.scale);
      ring.material.opacity = obj.opacity;
    })
    .onComplete(() => scene.remove(ring))
    .start();
}

// Partículas Estelares de Impacto Douradas
function createImpactStars(pos) {
  for (let i = 0; i < 14; i++) {
    const starGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.copy(pos);
    scene.add(star);

    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 4 + 1.5,
      (Math.random() - 0.5) * 5
    );

    new TWEEN.Tween(star.position)
      .to({ x: pos.x + dir.x, y: pos.y + dir.y, z: pos.z + dir.z }, 420)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => scene.remove(star))
      .start();
  }
}

// Verificação de Vitória
function checkLevelWin() {
  const allDefeated = enemies.every(e => e.userData.isHit);
  if (allDefeated && enemies.length > 0) {
    setTimeout(() => {
      playVictoryFanfare();
      const phrases = [
        "O boneco voou para fora da sala!",
        "Nocaute espetacular!",
        "Pancada certeira!",
        "Arremesso sensacional!"
      ];
      document.getElementById('win-message').textContent = phrases[Math.floor(Math.random() * phrases.length)];
      document.getElementById('win-overlay').style.display = 'flex';
    }, 650);
  }
}

// Interação e Toque Otimizado para Tablets e Celulares
function setupTouchAndInteraction() {
  const container = document.getElementById('game-container');
  const reticle = document.getElementById('reticle');

  function handlePunchInput(clientX, clientY) {
    initAudio();
    reticle.style.left = clientX + 'px';
    reticle.style.top = clientY + 'px';
    reticle.style.display = 'block';

    launchSpringPunch(clientX, clientY);
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#ui-layer') || e.target.closest('#win-overlay')) return;
    handlePunchInput(e.clientX, e.clientY);
  });

  document.getElementById('btn-next-level').addEventListener('click', () => {
    currentLevel++;
    loadLevel(currentLevel);
  });
}

// Modalidades e Skins da Luva
function setupModes() {
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      applyModeSettings(currentMode);
    });
  });
}

function applyModeSettings(mode) {
  gloveMesh.children[0].material = new THREE.MeshStandardMaterial({
    color: 0xef233c,
    roughness: 0.28,
    metalness: 0.12
  });

  if (mode === 'gold') {
    gloveMesh.children[0].material.color.setHex(0xfacc15);
    gloveMesh.children[0].material.metalness = 0.95;
    gloveMesh.children[0].material.roughness = 0.15;
  } else if (mode === 'turbo') {
    gloveMesh.children[0].material.color.setHex(0x38bdf8);
    gloveMesh.children[0].material.emissive = new THREE.Color(0x0284c7);
  } else if (mode === 'heavy') {
    gloveMesh.children[0].material.color.setHex(0x1e293b);
    gloveMesh.children[0].material.metalness = 0.5;
  } else if (mode === 'gravity') {
    gloveMesh.children[0].material.color.setHex(0xa855f7);
    gloveMesh.children[0].material.emissive = new THREE.Color(0x7e22ce);
  }

  if (mode === 'giant') {
    gloveMesh.scale.set(1.9, 1.9, 1.9);
  } else {
    gloveMesh.scale.set(1, 1, 1);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Loop Principal de Física e Animação
function animate(time) {
  requestAnimationFrame(animate);
  TWEEN.update();

  const dt = 0.016;
  const gravity = currentMode === 'gravity' ? -2.5 : -17.5;

  // Atualização da Física Ragdoll
  enemies.forEach(enemy => {
    if (enemy.userData.isHit) {
      enemy.userData.velocity.y += gravity * dt;
      enemy.position.addScaledVector(enemy.userData.velocity, dt);

      enemy.rotation.x += enemy.userData.rotVelocity.x * dt;
      enemy.rotation.y += enemy.userData.rotVelocity.y * dt;
      enemy.rotation.z += enemy.userData.rotVelocity.z * dt;

      // Movimentação articulada flexível enquanto voa
      enemy.userData.leftUpperArm.group.rotation.z += 12 * dt;
      enemy.userData.rightUpperArm.group.rotation.z -= 12 * dt;
      enemy.userData.leftForeArm.group.rotation.x += 16 * dt;
      enemy.userData.rightForeArm.group.rotation.x -= 16 * dt;
      enemy.userData.leftThigh.group.rotation.x += 14 * dt;
      enemy.userData.rightThigh.group.rotation.x -= 14 * dt;
      enemy.userData.headGroup.rotation.y += 8 * dt;
    }
  });

  // Movimento de Respiração / Idle Suave da Luva de Boxe
  if (!isPunching) {
    const idle = (time || 0) * 0.0025;
    gloveGroup.position.y = 0.85 + Math.sin(idle * 2) * 0.035;
    gloveGroup.position.x = 0.68 + Math.cos(idle) * 0.025;
    gloveGroup.rotation.z = 0.05 + Math.sin(idle) * 0.02;
  }

  // Efeito de Trepidação da Câmera (Screen Shake)
  if (screenShake > 0) {
    camera.position.x = (Math.random() - 0.5) * (screenShake * 0.03);
    camera.position.y = 2.3 + (Math.random() - 0.5) * (screenShake * 0.03);
    screenShake *= 0.86;
    if (screenShake < 0.2) {
      screenShake = 0;
      camera.position.set(0, 2.3, 7.2);
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', initGame);
