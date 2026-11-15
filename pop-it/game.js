// Pop It 3D - Quebra-Cabeça & ASMR Engine
(() => {
  const { SPACING, MODELS, MODEL_KEYS } = window.PopItModels;
  const sound = window.PopItAudio;

  const STORAGE_KEY = 'popit3d_completed_v1';
  let completedModels = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) completedModels = new Set(saved);
  } catch (_) {}

  function saveCompleted(key) {
    completedModels.add(key);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedModels]));
    } catch (_) {}
  }

  // ================== RENDERER, SCENE & CAMERA ==================
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);

  let camHeight = 14.5;
  let camZOffset = 3.8;
  let targetCamHeight = 14.5;
  let targetCamZOffset = 3.8;
  let camLookZOffset = -0.35;
  let boardMaxSpanX = 8.5;
  let boardMaxSpanZ = 7.5;
  let dragLimitX = 4.6;
  let dragLimitZ = 3.6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // Studio-like Toy Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xfbcfe8, 0.72);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffdf7, 0.92);
  dirLight.position.set(6, 18, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 42;
  const d = 11;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.42);
  rimLight.position.set(-8, -8, -8);
  scene.add(rimLight);

  // Soft Translucent Toy Mat
  const tableGeo = new THREE.CylinderGeometry(18, 18, 0.4, 64);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.04,
    transparent: true,
    opacity: 0.46
  });
  const tableMesh = new THREE.Mesh(tableGeo, tableMat);
  tableMesh.position.y = -0.58;
  tableMesh.receiveShadow = true;
  scene.add(tableMesh);

  const boardGroup = new THREE.Group();
  scene.add(boardGroup);

  const ghostGroup = new THREE.Group();
  boardGroup.add(ghostGroup);

  const piecesGroup = new THREE.Group();
  boardGroup.add(piecesGroup);

  const particlesGroup = new THREE.Group();
  scene.add(particlesGroup);

  // ================== GAME STATE ==================
  let currentModelKey = 'square';
  let gamePhase = 'PUZZLE'; // 'PUZZLE' | 'POP'
  let sideCleared = [false, false]; // [front, back]
  let isFlipping = false;
  let isAutoSolving = false;

  let puzzlePieces = [];
  let ghostSlots = [];
  let bubbles = [];
  let transientEffects = [];
  let disposables = [];

  let activePointerId = null;
  let draggedPiece = null;
  let isDraggingPop = false;
  let boardFlipAngle = 0;
  let targetBoardFlipAngle = 0;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const planeIntersect = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();

  // Shared Core Geometries
  const cellBodyGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.36, 28);
  const cellRimGeo = new THREE.TorusGeometry(0.42, 0.09, 14, 28);
  cellRimGeo.rotateX(Math.PI / 2);
  const bubbleDomeGeo = new THREE.SphereGeometry(0.39, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const hitProxyGeo = new THREE.SphereGeometry(0.54, 12, 10);
  const hitProxyMat = new THREE.MeshBasicMaterial({ visible: false });

  const confettiGeo = new THREE.PlaneGeometry(0.22, 0.22);
  const confettiPalette = [0xff4757, 0xffa502, 0x2ed573, 0x1e90ff, 0xa55eea, 0xff6b81];
  const confettiMaterials = confettiPalette.map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  const rippleGeo = new THREE.RingGeometry(0.32, 0.44, 28);
  rippleGeo.rotateX(-Math.PI / 2);

  function isBoardFlipped() {
    return Math.abs(Math.round(targetBoardFlipAngle / Math.PI)) % 2 === 1;
  }

  function getUnpoppedScaleY(flipped) {
    return flipped ? -0.85 : 0.85;
  }

  function getPoppedScaleY(flipped) {
    return flipped ? 0.85 : -0.85;
  }

  // ================== RESPONSIVE FRAMING ==================
  function updateFixedCameraDistance() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / Math.max(1, h);
    const halfFovRad = (camera.fov * 0.5) * (Math.PI / 180);
    const tanHalfFov = Math.tan(halfFovRad);

    const headerEl = document.querySelector('header');
    const footerEl = document.querySelector('footer');
    const headerH = headerEl ? headerEl.offsetHeight : 120;
    const footerH = footerEl ? footerEl.offsetHeight : 72;
    const usableHeightRatio = Math.max(0.42, (h - headerH - footerH - 18) / h);

    // Center offset vertically when header is taller than footer
    const uiCenterBias = (headerH - footerH) / h;
    camLookZOffset = -uiCenterBias * 2.1;

    if (gamePhase === 'PUZZLE') {
      const neededWidth = boardMaxSpanX + 2.1;
      const neededDepth = boardMaxSpanZ + 2.0;

      const distForWidth = (neededWidth * 0.5) / (tanHalfFov * aspect * 0.86);
      const distForHeight = (neededDepth * 0.5) / (tanHalfFov * usableHeightRatio * 0.88);

      targetCamHeight = Math.max(distForWidth, distForHeight, 12.6);
      targetCamZOffset = targetCamHeight * 0.24;
    } else {
      const popWidth = Math.max(5.8, boardMaxSpanX * 0.72);
      const popDepth = Math.max(5.8, boardMaxSpanZ * 0.72);
      const distForWidth = (popWidth * 0.5) / (tanHalfFov * aspect * 0.84);
      const distForHeight = (popDepth * 0.5) / (tanHalfFov * usableHeightRatio * 0.92);

      targetCamHeight = Math.max(distForWidth, distForHeight, 9.6);
      targetCamZOffset = targetCamHeight * 0.24;
    }

    const visibleHalfWidth = targetCamHeight * tanHalfFov * aspect * 0.8;
    const visibleHalfDepth = targetCamHeight * tanHalfFov * usableHeightRatio * 0.82;
    dragLimitX = Math.max(3.2, visibleHalfWidth);
    dragLimitZ = Math.max(2.6, visibleHalfDepth);
  }

  // ================== MODEL SELECTOR UI ==================
  function renderModelSelector() {
    const selector = document.getElementById('model-selector');
    selector.innerHTML = '';
    MODEL_KEYS.forEach((key, index) => {
      const m = MODELS[key];
      const done = completedModels.has(key);
      const btn = document.createElement('button');
      btn.id = `btn-${key}`;
      btn.type = 'button';
      btn.onclick = () => selectModel(key);
      btn.className = 'model-btn toy-btn py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-white text-slate-700 hover:bg-slate-100';
      btn.innerHTML = `<span>${m.icon}</span> <span>${index + 1}. ${m.name}</span>${done ? '<span class="ml-0.5 text-emerald-500">✅</span>' : ''}`;
      selector.appendChild(btn);
    });
  }

  function highlightActiveModelButton(modelKey) {
    MODEL_KEYS.forEach(k => {
      const btn = document.getElementById(`btn-${k}`);
      if (!btn) return;
      if (k === modelKey) {
        btn.className = 'model-btn toy-btn py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-indigo-600 text-white';
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        btn.className = 'model-btn toy-btn py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap bg-white text-slate-700 hover:bg-slate-100';
      }
    });
  }

  // ================== BUILD POP IT 3D MODEL ==================
  function clearCurrentBoard() {
    while (ghostGroup.children.length > 0) ghostGroup.remove(ghostGroup.children[0]);
    while (piecesGroup.children.length > 0) piecesGroup.remove(piecesGroup.children[0]);
    disposables.forEach(d => {
      if (d && typeof d.dispose === 'function') d.dispose();
    });
    disposables = [];
    puzzlePieces = [];
    ghostSlots = [];
    bubbles = [];
  }

  function connectPieceCellsWithBridges(cells, centerX, centerZ, pieceGroup, siliconeMat) {
    const n = cells.length;
    if (n <= 1) return;

    // 1. Connect all natural adjacent pairs (including diagonal neighbors up to ~1.58 * SPACING)
    const connectedPairs = new Set();
    const adj = Array.from({ length: n }, () => []);

    function addBridge(i, j) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (connectedPairs.has(key)) return;
      connectedPairs.add(key);
      adj[i].push(j);
      adj[j].push(i);

      const ax = cells[i].x - centerX;
      const az = cells[i].z - centerZ;
      const bx = cells[j].x - centerX;
      const bz = cells[j].z - centerZ;
      const dist = Math.hypot(ax - bx, az - bz);
      if (dist < 0.05) return;

      const bridgeGeo = new THREE.BoxGeometry(0.54, 0.32, dist);
      disposables.push(bridgeGeo);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, siliconeMat);
      bridgeMesh.position.set((ax + bx) / 2, 0, (az + bz) / 2);
      bridgeMesh.lookAt(bx, 0, bz);
      bridgeMesh.castShadow = true;
      bridgeMesh.receiveShadow = true;
      pieceGroup.add(bridgeMesh);
    }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = Math.hypot(cells[i].x - cells[j].x, cells[i].z - cells[j].z);
        if (dist <= SPACING * 1.56) {
          addBridge(i, j);
        }
      }
    }

    // 2. Guarantee full piece connectivity if any cell remained isolated (e.g., stylized shapes)
    const visited = new Set([0]);
    const queue = [0];
    while (queue.length > 0) {
      const cur = queue.shift();
      adj[cur].forEach(nxt => {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      });
    }

    while (visited.size < n) {
      let bestU = -1;
      let bestV = -1;
      let bestD = Infinity;
      visited.forEach(u => {
        for (let v = 0; v < n; v++) {
          if (visited.has(v)) continue;
          const dist = Math.hypot(cells[u].x - cells[v].x, cells[u].z - cells[v].z);
          if (dist < bestD) {
            bestD = dist;
            bestU = u;
            bestV = v;
          }
        }
      });
      if (bestU !== -1 && bestV !== -1) {
        addBridge(bestU, bestV);
        visited.add(bestV);
      } else {
        break;
      }
    }
  }

  function buildPopItModel(modelKey) {
    currentModelKey = modelKey;
    gamePhase = 'PUZZLE';
    sideCleared = [false, false];
    isFlipping = false;
    isAutoSolving = false;
    draggedPiece = null;
    isDraggingPop = false;
    activePointerId = null;
    boardFlipAngle = 0;
    targetBoardFlipAngle = 0;
    boardGroup.rotation.x = 0;
    ghostGroup.visible = true;

    clearCurrentBoard();

    document.getElementById('celebration-modal').classList.add('hidden');
    document.getElementById('pop-controls').classList.add('hidden');
    highlightActiveModelButton(modelKey);

    const modelData = MODELS[modelKey];

    // Exact geometric center of all cells
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    modelData.pieces.forEach(pData => {
      pData.cells.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.z < minZ) minZ = c.z;
        if (c.z > maxZ) maxZ = c.z;
      });
    });
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // 1. Central Ghost Mold
    modelData.pieces.forEach(pData => {
      const ghostPieceGroup = new THREE.Group();
      const ghostMat = new THREE.MeshStandardMaterial({
        color: pData.color,
        transparent: true,
        opacity: 0.24,
        roughness: 0.45,
        emissive: new THREE.Color(pData.color),
        emissiveIntensity: 0.05
      });
      disposables.push(ghostMat);

      pData.cells.forEach(cell => {
        const cx = cell.x - centerX;
        const cz = cell.z - centerZ;
        const ghostCell = new THREE.Mesh(cellBodyGeo, ghostMat);
        ghostCell.position.set(cx, -0.14, cz);
        ghostCell.scale.set(0.96, 0.36, 0.96);
        ghostPieceGroup.add(ghostCell);
      });

      ghostGroup.add(ghostPieceGroup);
      ghostSlots.push({ id: pData.id, group: ghostPieceGroup, mat: ghostMat });
    });

    // 2. Real 3D Silicone Puzzle Pieces
    let totalBoundsMinX = (minX - centerX) - 0.8;
    let totalBoundsMaxX = (maxX - centerX) + 0.8;
    let totalBoundsMinZ = (minZ - centerZ) - 0.8;
    let totalBoundsMaxZ = (maxZ - centerZ) + 0.8;

    const isPortrait = window.innerHeight > window.innerWidth;
    const spreadXScale = isPortrait ? 1.55 : 2.15;
    const spreadZScale = isPortrait ? 1.85 : 1.35;

    modelData.pieces.forEach(pData => {
      const pieceGroup = new THREE.Group();

      // Matte silicone frame + glossier pop domes for realistic physical Pop It contrast
      const siliconeMat = new THREE.MeshStandardMaterial({
        color: pData.color,
        roughness: 0.45,
        metalness: 0.04
      });
      disposables.push(siliconeMat);

      let pMinX = Infinity, pMaxX = -Infinity, pMinZ = Infinity, pMaxZ = -Infinity;

      pData.cells.forEach(cell => {
        const cx = cell.x - centerX;
        const cz = cell.z - centerZ;

        if (cx < pMinX) pMinX = cx;
        if (cx > pMaxX) pMaxX = cx;
        if (cz < pMinZ) pMinZ = cz;
        if (cz > pMaxZ) pMaxZ = cz;

        const bodyMesh = new THREE.Mesh(cellBodyGeo, siliconeMat);
        bodyMesh.position.set(cx, 0, cz);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        pieceGroup.add(bodyMesh);

        const topRim = new THREE.Mesh(cellRimGeo, siliconeMat);
        topRim.position.set(cx, 0.17, cz);
        pieceGroup.add(topRim);

        const bottomRim = new THREE.Mesh(cellRimGeo, siliconeMat);
        bottomRim.position.set(cx, -0.17, cz);
        pieceGroup.add(bottomRim);

        const domeMat = new THREE.MeshStandardMaterial({
          color: pData.color,
          roughness: 0.22,
          metalness: 0.06,
          side: THREE.DoubleSide
        });
        disposables.push(domeMat);

        // Centered vertically at y=0 so flipping scale.y (+0.85 <-> -0.85) pops symmetrically on both sides!
        const domeMesh = new THREE.Mesh(bubbleDomeGeo, domeMat);
        domeMesh.position.set(cx, 0, cz);
        domeMesh.scale.set(1, 0.85, 1);
        domeMesh.castShadow = true;

        const bubbleObj = {
          mesh: domeMesh,
          popped: false,
          targetScaleY: 0.85,
          bounceVelocity: 0,
          baseColor: new THREE.Color(pData.color),
          poppedColor: new THREE.Color(pData.color).multiplyScalar(0.76),
          worldOriginLocal: new THREE.Vector3(cx, 0, cz),
          index: bubbles.length
        };
        domeMesh.userData = { isBubble: true, bubbleObj };
        bubbles.push(bubbleObj);
        pieceGroup.add(domeMesh);

        // Touch-friendly invisible hit proxy sphere per bubble
        const hitProxy = new THREE.Mesh(hitProxyGeo, hitProxyMat);
        hitProxy.position.set(cx, 0, cz);
        hitProxy.userData = { isBubble: true, bubbleObj };
        pieceGroup.add(hitProxy);
      });

      // Ensure all cells within the piece have continuous silicone bridges
      connectPieceCellsWithBridges(pData.cells, centerX, centerZ, pieceGroup, siliconeMat);

      const rawX = pData.spawnOffset.x;
      const rawZ = pData.spawnOffset.z;
      const len = Math.hypot(rawX, rawZ) || 1;
      const dirX = rawX / len;
      const dirZ = rawZ / len;

      // Guarantee spawn distance is cleanly outside snap radius (>= 1.55)
      const startX = dirX * spreadXScale;
      const startZ = dirZ * spreadZScale;
      pieceGroup.position.set(startX, 0, startZ);

      totalBoundsMinX = Math.min(totalBoundsMinX, pMinX + startX - 0.6);
      totalBoundsMaxX = Math.max(totalBoundsMaxX, pMaxX + startX + 0.6);
      totalBoundsMinZ = Math.min(totalBoundsMinZ, pMinZ + startZ - 0.6);
      totalBoundsMaxZ = Math.max(totalBoundsMaxZ, pMaxZ + startZ + 0.6);

      const pieceObj = {
        id: pData.id,
        group: pieceGroup,
        snapped: false,
        targetPos: new THREE.Vector3(startX, 0, startZ),
        squishScale: 1
      };

      pieceGroup.traverse(child => {
        if (child.isMesh) {
          child.userData.pieceObj = pieceObj;
        }
      });

      puzzlePieces.push(pieceObj);
      piecesGroup.add(pieceGroup);
    });

    boardMaxSpanX = Math.max(7.2, totalBoundsMaxX - totalBoundsMinX);
    boardMaxSpanZ = Math.max(6.4, totalBoundsMaxZ - totalBoundsMinZ);

    updateFixedCameraDistance();
    updateUIStatus();
  }

  // ================== UI STATUS & PHASE PROGRESSION ==================
  function updateUIStatus() {
    const phaseBadge = document.getElementById('phase-badge');
    const instIcon = document.getElementById('instruction-icon');
    const instText = document.getElementById('instruction-text');
    const popControls = document.getElementById('pop-controls');
    const autoSolveBtn = document.getElementById('auto-solve-btn');
    const levelIndex = MODEL_KEYS.indexOf(currentModelKey) + 1;
    const modelInfo = MODELS[currentModelKey];

    if (gamePhase === 'PUZZLE') {
      const snappedCount = puzzlePieces.filter(p => p.snapped).length;
      const totalPieces = puzzlePieces.length;
      phaseBadge.textContent = `Fase ${levelIndex} (${modelInfo.name}): Monte as Peças (${snappedCount}/${totalPieces})`;
      phaseBadge.className = 'text-xs sm:text-sm font-semibold text-pink-600';
      instIcon.textContent = '🧩';
      instText.textContent = 'Arraste as peças 3D até o molde central para montar o Pop It!';
      popControls.classList.add('hidden');
      if (autoSolveBtn) autoSolveBtn.classList.remove('hidden');
    } else {
      const poppedCount = bubbles.filter(b => b.popped).length;
      const totalBubbles = bubbles.length;
      const flipped = isBoardFlipped();
      const sideLabel = flipped ? 'Verso' : 'Frente';
      const doneSides = (sideCleared[0] ? 1 : 0) + (sideCleared[1] ? 1 : 0);
      phaseBadge.textContent = `Fase ${levelIndex} (${sideLabel} • ${doneSides}/2 lados): Estoure! (${poppedCount}/${totalBubbles})`;
      phaseBadge.className = 'text-xs sm:text-sm font-semibold text-emerald-600';
      instIcon.textContent = flipped ? '🔄' : '👆';
      instText.textContent = sideCleared[flipped ? 1 : 0]
        ? 'Lado completo! Toque em "Virar Bandeja" ou estoure mais!'
        : (doneSides === 0
          ? 'Toque ou deslize o dedo pelas bolinhas para estourar a frente!'
          : 'Agora estoure todas as bolinhas deste lado para concluir!');
      popControls.classList.remove('hidden');
      if (autoSolveBtn) autoSolveBtn.classList.add('hidden');
    }
  }

  function updateGhostHighlights(activePieceId = null) {
    ghostSlots.forEach(slot => {
      const isTarget = activePieceId !== null && slot.id === activePieceId;
      slot.mat.opacity = isTarget ? 0.52 : 0.24;
      slot.mat.emissiveIntensity = isTarget ? 0.35 : 0.05;
    });
  }

  function checkPuzzleCompletion() {
    if (puzzlePieces.every(p => p.snapped)) {
      gamePhase = 'POP';
      sideCleared = [false, false];
      ghostGroup.visible = false;
      updateGhostHighlights(null);
      sound.playWin(true);
      spawnConfetti(36);

      if (navigator.vibrate) {
        try { navigator.vibrate([18, 30, 22]); } catch (_) {}
      }

      updateFixedCameraDistance();
      updateUIStatus();
    } else {
      updateUIStatus();
    }
  }

  function autoAssembleRemaining() {
    if (gamePhase !== 'PUZZLE' || isAutoSolving) return;
    sound.init();
    isAutoSolving = true;
    const remaining = puzzlePieces.filter(p => !p.snapped);
    remaining.forEach((piece, idx) => {
      setTimeout(() => {
        if (gamePhase !== 'PUZZLE') return;
        piece.snapped = true;
        piece.targetPos.set(0, 0, 0);
        piece.squishScale = 1.12;
        sound.playSnap();
        checkPuzzleCompletion();
        if (idx === remaining.length - 1) {
          isAutoSolving = false;
        }
      }, idx * 110);
    });
  }

  function spawnPopRipple(bubbleObj) {
    const color = bubbleObj.baseColor.clone().lerp(new THREE.Color(0xffffff), 0.35);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(rippleGeo, mat);
    const worldPos = bubbleObj.mesh.getWorldPosition(new THREE.Vector3());
    ring.position.set(worldPos.x, 0.22, worldPos.z);
    particlesGroup.add(ring);

    transientEffects.push({
      mesh: ring,
      mat,
      age: 0,
      maxAge: 22,
      onUpdate: (t) => {
        const s = 1 + t * 1.45;
        ring.scale.set(s, s, s);
        mat.opacity = (1 - t) * 0.72;
      }
    });
  }

  function popBubble(bubbleObj) {
    if (gamePhase !== 'POP' || bubbleObj.popped || isFlipping) return;
    bubbleObj.popped = true;

    const flipped = isBoardFlipped();
    bubbleObj.targetScaleY = getPoppedScaleY(flipped);
    bubbleObj.bounceVelocity = flipped ? 0.16 : -0.16;
    bubbleObj.mesh.material.color.copy(bubbleObj.poppedColor);

    sound.playPop(bubbleObj.index, flipped);
    spawnPopRipple(bubbleObj);
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch (_) {}
    }

    updateUIStatus();

    if (bubbles.every(b => b.popped)) {
      const currentSideIdx = flipped ? 1 : 0;
      sideCleared[currentSideIdx] = true;

      if (sideCleared[0] && sideCleared[1]) {
        saveCompleted(currentModelKey);
        renderModelSelector();
        highlightActiveModelButton(currentModelKey);
        setTimeout(() => {
          sound.playWin(false);
          spawnConfetti(70);
          document.getElementById('celebration-modal').classList.remove('hidden');
        }, 280);
      } else {
        // Auto-flip cleanly to the unpopped side!
        isFlipping = true;
        setTimeout(() => {
          flipBoard(true);
          spawnConfetti(28);
          setTimeout(() => {
            isFlipping = false;
          }, 320);
        }, 400);
      }
    }
  }

  function flipBoard(isAutoFlip = false) {
    sound.playWhoosh();
    if (!isAutoFlip) {
      document.getElementById('celebration-modal').classList.add('hidden');
    }

    targetBoardFlipAngle += Math.PI;
    const flipped = isBoardFlipped();

    bubbles.forEach(b => {
      b.popped = false;
      b.targetScaleY = getUnpoppedScaleY(flipped);
      b.bounceVelocity = 0;
      b.mesh.material.color.copy(b.baseColor);
    });

    updateUIStatus();
  }

  function selectModel(modelKey) {
    sound.playPickup();
    buildPopItModel(modelKey);
  }

  function nextModel() {
    const currentIndex = MODEL_KEYS.indexOf(currentModelKey);
    const nextIndex = (currentIndex + 1) % MODEL_KEYS.length;
    selectModel(MODEL_KEYS[nextIndex]);
  }

  window.selectModel = selectModel;
  window.flipBoard = flipBoard;
  window.nextModel = nextModel;
  window.autoAssembleRemaining = autoAssembleRemaining;

  function spawnConfetti(count = 40) {
    for (let i = 0; i < count; i++) {
      const mat = confettiMaterials[Math.floor(Math.random() * confettiMaterials.length)];
      const mesh = new THREE.Mesh(confettiGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 3.2,
        0.9 + Math.random() * 1.4,
        (Math.random() - 0.5) * 3.2
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      particlesGroup.add(mesh);

      transientEffects.push({
        mesh,
        mat: null, // shared palette material — do not dispose
        age: 0,
        maxAge: 75 + Math.random() * 35,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.22,
          0.12 + Math.random() * 0.16,
          (Math.random() - 0.5) * 0.22
        ),
        onUpdate: function () {
          mesh.position.add(this.velocity);
          this.velocity.y -= 0.0055;
          mesh.rotation.x += 0.1;
          mesh.rotation.y += 0.12;
        }
      });
    }
  }

  // ================== UNIFIED POINTER EVENTS ==================
  function updatePointerCoords(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  const domElem = renderer.domElement;

  domElem.addEventListener('pointerdown', (e) => {
    sound.init();
    if (e.target !== domElem) return;
    if (activePointerId !== null && activePointerId !== e.pointerId) return;

    activePointerId = e.pointerId;
    try { domElem.setPointerCapture(e.pointerId); } catch (_) {}

    updatePointerCoords(e);
    raycaster.setFromCamera(pointer, camera);

    if (gamePhase === 'PUZZLE' && !isAutoSolving) {
      const intersects = raycaster.intersectObjects(piecesGroup.children, true);
      const hit = intersects.find(i => i.object.userData.pieceObj && !i.object.userData.pieceObj.snapped);

      if (hit) {
        draggedPiece = hit.object.userData.pieceObj;
        sound.playPickup();
        updateGhostHighlights(draggedPiece.id);

        raycaster.ray.intersectPlane(dragPlane, planeIntersect);
        dragOffset.copy(draggedPiece.group.position).sub(planeIntersect);
        draggedPiece.targetPos.y = 0.78;
      }
    } else if (gamePhase === 'POP' && !isFlipping) {
      const intersects = raycaster.intersectObjects(piecesGroup.children, true);
      const bubbleHit = intersects.find(i => i.object.userData && i.object.userData.isBubble);

      if (bubbleHit) {
        isDraggingPop = true;
        popBubble(bubbleHit.object.userData.bubbleObj);
      }
    }
  });

  domElem.addEventListener('pointermove', (e) => {
    if (activePointerId !== e.pointerId) return;
    if (!draggedPiece && !isDraggingPop) return;

    updatePointerCoords(e);
    raycaster.setFromCamera(pointer, camera);

    if (draggedPiece && gamePhase === 'PUZZLE') {
      if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
        draggedPiece.targetPos.x = Math.max(-dragLimitX, Math.min(dragLimitX, planeIntersect.x + dragOffset.x));
        draggedPiece.targetPos.z = Math.max(-dragLimitZ, Math.min(dragLimitZ, planeIntersect.z + dragOffset.z));
        draggedPiece.targetPos.y = 0.78;
      }
    } else if (isDraggingPop && gamePhase === 'POP') {
      const intersects = raycaster.intersectObjects(piecesGroup.children, true);
      const bubbleHit = intersects.find(i => i.object.userData && i.object.userData.isBubble);
      if (bubbleHit) {
        popBubble(bubbleHit.object.userData.bubbleObj);
      }
    }
  });

  function finishPointerInteraction(e) {
    if (activePointerId !== e.pointerId) return;
    try { domElem.releasePointerCapture(e.pointerId); } catch (_) {}
    activePointerId = null;

    if (draggedPiece) {
      const dist = Math.hypot(draggedPiece.targetPos.x, draggedPiece.targetPos.z);
      if (dist < 1.35) {
        draggedPiece.snapped = true;
        draggedPiece.targetPos.set(0, 0, 0);
        draggedPiece.squishScale = 1.12;
        sound.playSnap();
        checkPuzzleCompletion();
      } else {
        draggedPiece.targetPos.y = 0;
      }
      updateGhostHighlights(null);
      draggedPiece = null;
    }
    isDraggingPop = false;
  }

  domElem.addEventListener('pointerup', finishPointerInteraction);
  domElem.addEventListener('pointercancel', finishPointerInteraction);

  // ================== TOP UI BUTTONS & RESIZE ==================
  document.getElementById('sound-toggle').addEventListener('click', () => {
    const next = sound.setEnabled(!sound.enabled);
    document.getElementById('sound-icon').textContent = next ? '🔊' : '🔇';
    document.getElementById('sound-text').textContent = next ? 'Som: ON' : 'Som: OFF';
    if (next) sound.playPop(2, false);
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    sound.playPickup();
    buildPopItModel(currentModelKey);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateFixedCameraDistance();
  });

  // ================== MAIN ANIMATION LOOP ==================
  let lastFrameTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(2.5, Math.max(0.4, (now - lastFrameTime) / 16.6667));
    lastFrameTime = now;

    // 1. Camera smooth framing
    const camLerp = 1 - Math.pow(0.88, dt);
    camHeight += (targetCamHeight - camHeight) * camLerp;
    camZOffset += (targetCamZOffset - camZOffset) * camLerp;
    camera.position.set(0, camHeight, camZOffset + camLookZOffset);
    camera.lookAt(0, 0, camLookZOffset);

    // 2. Smooth puzzle piece movement + snap squish bounce
    const pieceLerp = 1 - Math.pow(0.75, dt);
    puzzlePieces.forEach(p => {
      p.group.position.lerp(p.targetPos, pieceLerp);
      if (Math.abs(p.squishScale - 1) > 0.002) {
        p.squishScale += (1 - p.squishScale) * Math.min(1, 0.22 * dt);
        p.group.scale.set(p.squishScale, 2 - p.squishScale, p.squishScale);
      } else if (p.group.scale.x !== 1) {
        p.group.scale.set(1, 1, 1);
      }
    });

    // 3. Smooth 180° flip animation
    const flipLerp = 1 - Math.pow(0.84, dt);
    boardFlipAngle += (targetBoardFlipAngle - boardFlipAngle) * flipLerp;
    boardGroup.rotation.x = boardFlipAngle;

    // 4. Tactile elastic silicone dome animation
    bubbles.forEach(b => {
      const diff = b.targetScaleY - b.mesh.scale.y;
      b.bounceVelocity = b.bounceVelocity * Math.pow(0.68, dt) + diff * 0.28 * dt;
      b.mesh.scale.y += b.bounceVelocity;
      if (Math.abs(diff) < 0.005 && Math.abs(b.bounceVelocity) < 0.005) {
        b.mesh.scale.y = b.targetScaleY;
        b.bounceVelocity = 0;
      }
    });

    // 5. Confetti & pop ripple particles
    for (let i = transientEffects.length - 1; i >= 0; i--) {
      const fx = transientEffects[i];
      fx.age += dt;
      const t = Math.min(1, fx.age / fx.maxAge);
      fx.onUpdate(t);
      if (fx.age >= fx.maxAge) {
        particlesGroup.remove(fx.mesh);
        if (fx.mat) fx.mat.dispose();
        transientEffects.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }

  // Init
  renderModelSelector();
  buildPopItModel('square');
  requestAnimationFrame(animate);
})();
