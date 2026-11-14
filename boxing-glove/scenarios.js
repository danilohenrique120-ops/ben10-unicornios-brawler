// 12 Creative, Non-Blocky Realistic 3D Scenarios + Infinite Procedural Variations
// Includes interactive physics props (mugs, bowling pins, beach balls, chairs, boxes, etc.)!

window.PunchScenarios = (() => {
  // Helper: Rounded cushion/box using overlapping bevel cylinders/spheres or LatheGeometry
  function makeRoundedBlock(w, h, d, r, mat) {
    const grp = new THREE.Group();
    const core = new THREE.Mesh(new THREE.BoxGeometry(w - r * 2, h, d - r * 2), mat);
    core.castShadow = core.receiveShadow = true;
    grp.add(core);
    const sideX = new THREE.Mesh(new THREE.BoxGeometry(w, h - r * 2, d - r * 2), mat);
    sideX.castShadow = sideX.receiveShadow = true;
    grp.add(sideX);
    const sideZ = new THREE.Mesh(new THREE.BoxGeometry(w - r * 2, h - r * 2, d), mat);
    sideZ.castShadow = sideZ.receiveShadow = true;
    grp.add(sideZ);
    // Corner cylinders
    const cylGeo = new THREE.CylinderGeometry(r, r, h - r * 2, 12);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const cyl = new THREE.Mesh(cylGeo, mat);
      cyl.position.set(sx * (w * 0.5 - r), 0, sz * (d * 0.5 - r));
      cyl.castShadow = true;
      grp.add(cyl);
    });
    return grp;
  }

  // Register a prop or object as punchable physics debris!
  function markDynamicProp(mesh, list, mass = 1.0) {
    mesh.userData.isDynamicProp = true;
    mesh.userData.mass = mass;
    mesh.userData.velocity = new THREE.Vector3();
    mesh.userData.rotVelocity = new THREE.Vector3();
    mesh.userData.launched = false;
    list.push(mesh);
    return mesh;
  }

  // Sculpted Porcelain Toilet (LatheGeometry curved pedestal + glossy seat + chrome flush handle + toilet paper)
  function buildRealisticToilet() {
    const grp = new THREE.Group();
    const porcMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.08 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });

    // Curved pedestal & bowl
    const bowlProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.32, 0.0),
      new THREE.Vector2(0.28, 0.08),
      new THREE.Vector2(0.22, 0.30),
      new THREE.Vector2(0.42, 0.56),
      new THREE.Vector2(0.46, 0.72),
      new THREE.Vector2(0.35, 0.72),
      new THREE.Vector2(0.30, 0.48),
      new THREE.Vector2(0.0, 0.44)
    ];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 28), porcMat);
    bowl.castShadow = bowl.receiveShadow = true;
    grp.add(bowl);

    // Seat ring
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.055, 14, 28), porcMat);
    seat.rotation.x = Math.PI / 2;
    seat.position.set(0, 0.74, 0.02);
    seat.castShadow = true;
    grp.add(seat);

    // Rounded tank
    const tank = makeRoundedBlock(0.84, 0.92, 0.38, 0.07, porcMat);
    tank.position.set(0, 1.15, -0.46);
    grp.add(tank);

    // Chrome flush lever
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 10), chromeMat);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(-0.34, 1.46, -0.26);
    grp.add(lever);

    return grp;
  }

  // Sculpted Coffee Mug / Cup
  function buildMug(color = 0xef4444) {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.22, 18), mat);
    body.castShadow = true;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 10, 16, Math.PI), mat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.1, 0, 0);
    grp.add(body, handle);
    return grp;
  }

  // Sculpted Bowling Pin
  function buildBowlingPin() {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.0),
      new THREE.Vector2(0.20, 0.22),
      new THREE.Vector2(0.18, 0.45),
      new THREE.Vector2(0.10, 0.68),
      new THREE.Vector2(0.13, 0.88),
      new THREE.Vector2(0.09, 1.02),
      new THREE.Vector2(0.0, 1.06)
    ];
    const mat = new THREE.MeshStandardMaterial({
      map: window.PunchTextures.getBowlingPinTexture(),
      roughness: 0.18,
      metalness: 0.05
    });
    const pin = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat);
    pin.castShadow = true;
    return pin;
  }

  // Sculpted Potted Plant
  function buildPottedPlant() {
    const grp = new THREE.Group();
    const potPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.30, 0.42),
      new THREE.Vector2(0.33, 0.48),
      new THREE.Vector2(0.27, 0.48)
    ];
    const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.65 });
    const pot = new THREE.Mesh(new THREE.LatheGeometry(potPts, 20), potMat);
    pot.castShadow = true;
    grp.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), leafMat);
      leaf.scale.set(0.65, 1.7, 0.3);
      leaf.position.set(Math.cos(ang) * 0.16, 0.64 + (i % 2) * 0.08, Math.sin(ang) * 0.16);
      leaf.rotation.set(Math.sin(ang) * 0.4, ang, -Math.cos(ang) * 0.4);
      leaf.castShadow = true;
      grp.add(leaf);
    }
    return grp;
  }

  // Sculpted Beach Umbrella
  function buildBeachUmbrella() {
    const grp = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 3.2, 12), poleMat);
    pole.position.y = 1.6;
    pole.castShadow = true;
    grp.add(pole);

    const canopyMat = new THREE.MeshStandardMaterial({
      map: window.PunchTextures.getStripedTexture(['#ef4444', '#ffffff', '#ef4444', '#ffffff']),
      roughness: 0.55,
      side: THREE.DoubleSide
    });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.65, 24, 1, true), canopyMat);
    canopy.position.y = 3.05;
    canopy.castShadow = true;
    grp.add(canopy);
    return grp;
  }

  // Scenario Definitions (12 completely different creative scenes!)
  const THEMES = [
    // 1. BANHEIRO VIP
    {
      name: 'Banheiro VIP',
      sky: 0xdbeafe,
      floor: (T) => {
        const t = T.getTileTextures('#f8fafc', '#e2e8f0', '#94a3b8', 4);
        return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bumpMap, bumpScale: 0.015, roughness: 0.25, metalness: 0.05 });
      },
      build: (group, dyn, enemies, scene, level) => {
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.32, metalness: 0.1 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.15 });

        const stall = new THREE.Group();
        const back = makeRoundedBlock(2.7, 3.4, 0.14, 0.05, blueMat);
        back.position.set(0, 1.7, -3.4);
        const leftW = makeRoundedBlock(0.14, 3.4, 2.2, 0.05, blueMat);
        leftW.position.set(-1.35, 1.7, -2.3);
        const rightW = makeRoundedBlock(0.14, 3.4, 2.2, 0.05, blueMat);
        rightW.position.set(1.35, 1.7, -2.3);
        const header = makeRoundedBlock(2.8, 0.24, 0.16, 0.05, blueMat);
        header.position.set(0, 3.3, -1.25);

        // Chrome stall sign
        const sign = makeRoundedBlock(0.55, 0.38, 0.06, 0.04, chromeMat);
        sign.position.set(0, 3.3, -1.16);
        stall.add(back, leftW, rightW, header, sign);

        // Swinging stall door (punchable!)
        const door = makeRoundedBlock(1.2, 2.7, 0.1, 0.04, blueMat);
        door.position.set(-0.7, 1.55, -1.25);
        markDynamicProp(door, dyn, 1.5);
        stall.add(door);

        const toilet = buildRealisticToilet();
        toilet.position.set(0, 0, -2.4);
        stall.add(toilet);

        // Toilet paper roll on wall
        const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
        tp.rotation.z = Math.PI / 2;
        tp.position.set(-1.18, 1.25, -2.2);
        markDynamicProp(tp, dyn, 0.4);
        stall.add(tp);

        group.add(stall);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xa855f7, pos: new THREE.Vector3(0, 0.32, -2.35), pose: 'sit', accessory: 'crown' }));
        if (level > 1) {
          enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(1.55, 0, -1.1), pose: 'lie' }));
        }
      }
    },

    // 2. SALA DE ESTAR ACONCHEGANTE
    {
      name: 'Sala de Estar',
      sky: 0xfef3c7,
      floor: (T) => new THREE.MeshStandardMaterial({ map: T.getWoodTexture('#b45309', '#78350f', 6), roughness: 0.35, metalness: 0.06 }),
      build: (group, dyn, enemies, scene) => {
        const fabricMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.78, bumpMap: window.PunchTextures.getPlushBumpMap(), bumpScale: 0.02 });
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.72 });
        const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 });

        // Cozy rounded sofa
        const sofa = new THREE.Group();
        const base = makeRoundedBlock(3.8, 0.55, 1.4, 0.14, fabricMat);
        base.position.set(0, 0.35, -2.2);
        const back = makeRoundedBlock(3.8, 1.1, 0.35, 0.14, fabricMat);
        back.position.set(0, 0.9, -2.75);
        const armL = makeRoundedBlock(0.42, 0.8, 1.4, 0.14, fabricMat);
        armL.position.set(-1.75, 0.62, -2.2);
        const armR = makeRoundedBlock(0.42, 0.8, 1.4, 0.14, fabricMat);
        armR.position.set(1.75, 0.62, -2.2);
        sofa.add(base, back, armL, armR);

        // Rounded throw pillow (punchable!)
        const pillow = makeRoundedBlock(0.55, 0.5, 0.25, 0.1, pillowMat);
        pillow.position.set(-1.1, 0.88, -2.25);
        pillow.rotation.z = 0.22;
        markDynamicProp(pillow, dyn, 0.5);
        sofa.add(pillow);

        // Coffee table + mug in front
        const oakMat = new THREE.MeshStandardMaterial({ map: window.PunchTextures.getWoodTexture('#92400e', '#451a03', 4), roughness: 0.35 });
        const cTable = makeRoundedBlock(1.9, 0.12, 0.95, 0.04, oakMat);
        cTable.position.set(0.2, 0.55, -0.4);
        sofa.add(cTable);

        const mug = buildMug(0xef4444);
        mug.position.set(0.4, 0.72, -0.35);
        markDynamicProp(mug, dyn, 0.5);
        sofa.add(mug);

        // Floor lamp
        const lamp = new THREE.Group();
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.18, 2.3, 14), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 }));
        stand.position.y = 1.15;
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.42, 0.55, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
        shade.position.y = 2.35;
        lamp.add(stand, shade);
        lamp.position.set(-2.45, 0, -2.1);
        markDynamicProp(lamp, dyn, 1.2);
        sofa.add(lamp);

        group.add(sofa);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0.15, 0.58, -2.15), pose: 'lie', accessory: 'sunglasses' }));
      }
    },

    // 3. ESCRITÓRIO DO CHEFE
    {
      name: 'Escritório',
      sky: 0xe2e8f0,
      floor: (T) => {
        const t = T.getTileTextures('#cbd5e1', '#94a3b8', '#64748b', 3);
        return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bumpMap, bumpScale: 0.01, roughness: 0.55 });
      },
      build: (group, dyn, enemies, scene) => {
        const woodMat = new THREE.MeshStandardMaterial({ map: window.PunchTextures.getWoodTexture('#78350f', '#451a03', 5), roughness: 0.35 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });

        const deskTop = makeRoundedBlock(3.4, 0.14, 1.5, 0.05, woodMat);
        deskTop.position.set(0, 1.05, -1.8);
        group.add(deskTop);

        [[-1.4, -2.35], [1.4, -2.35], [-1.4, -1.25], [1.4, -1.25]].forEach(([x, z]) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 1.02, 12), metalMat);
          leg.position.set(x, 0.51, z);
          leg.castShadow = true;
          group.add(leg);
        });

        // Monitor + Laptop
        const monitor = new THREE.Group();
        const screen = makeRoundedBlock(1.05, 0.65, 0.06, 0.02, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
        const display = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.55), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 }));
        display.position.z = 0.035;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.28, 12), metalMat);
        neck.position.y = -0.4;
        monitor.add(screen, display, neck);
        monitor.position.set(-0.75, 1.62, -2.1);
        markDynamicProp(monitor, dyn, 1.0);
        group.add(monitor);

        // Potted plant on right
        const plant = buildPottedPlant();
        plant.position.set(1.25, 1.12, -1.85);
        markDynamicProp(plant, dyn, 0.9);
        group.add(plant);

        // Coffee mug
        const mug = buildMug(0x2563eb);
        mug.position.set(0.6, 1.22, -1.4);
        markDynamicProp(mug, dyn, 0.4);
        group.add(mug);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x0284c7, pos: new THREE.Vector3(0.15, 0, -2.55), pose: 'stand', accessory: 'tie' }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xf59e0b, pos: new THREE.Vector3(0.35, 1.12, -1.65), pose: 'lie' }));
      }
    },

    // 4. RINGUE DE BOXE
    {
      name: 'Ringue de Boxe',
      sky: 0x1e293b,
      floor: (T) => {
        const t = T.getTileTextures('#1e293b', '#0f172a', '#334155', 2);
        return new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.65 });
      },
      build: (group, dyn, enemies, scene) => {
        const matCanvas = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.72 });
        const ringBase = makeRoundedBlock(5.2, 0.7, 4.4, 0.12, matCanvas);
        ringBase.position.set(0, 0.35, -2.0);
        group.add(ringBase);

        const postColors = [0xef4444, 0x2563eb, 0xffffff, 0xffffff];
        const postCoords = [[-2.35, -3.95], [2.35, -3.95], [-2.35, -0.05], [2.35, -0.05]];
        postCoords.forEach(([px, pz], idx) => {
          const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 1.85, 16),
            new THREE.MeshStandardMaterial({ color: postColors[idx], roughness: 0.35 })
          );
          post.position.set(px, 1.55, pz);
          post.castShadow = true;
          group.add(post);
        });

        // Ropes (back & sides)
        const ropeColors = [0xef4444, 0xffffff, 0x2563eb];
        [1.15, 1.65, 2.15].forEach((ry, i) => {
          const ropeMat = new THREE.MeshStandardMaterial({ color: ropeColors[i], roughness: 0.5 });
          const backRope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.7, 10), ropeMat);
          backRope.rotation.z = Math.PI / 2;
          backRope.position.set(0, ry, -3.95);
          group.add(backRope);
        });

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xef4444, pos: new THREE.Vector3(0, 0.35, -2.0), pose: 'boxer', accessory: 'boxer', scale: 1.08 }));
      }
    },

    // 5. PRAIA TROPICAL
    {
      name: 'Praia Tropical',
      sky: 0x7dd3fc,
      floor: (T) => new THREE.MeshStandardMaterial({ map: T.getSandTexture(), roughness: 0.88 }),
      build: (group, dyn, enemies, scene) => {
        // Turquoise ocean strip in the background
        const seaMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.12, metalness: 0.25 });
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), seaMat);
        sea.rotation.x = -Math.PI / 2;
        sea.position.set(0, 0.02, -10);
        group.add(sea);

        const umbrella = buildBeachUmbrella();
        umbrella.position.set(-1.35, 0, -2.35);
        group.add(umbrella);

        // Striped Beach Lounge Chair
        const chairMat = new THREE.MeshStandardMaterial({
          map: window.PunchTextures.getStripedTexture(['#0284c7', '#ffffff']),
          roughness: 0.6
        });
        const chairSeat = makeRoundedBlock(1.2, 0.14, 2.1, 0.05, chairMat);
        chairSeat.position.set(0.1, 0.32, -1.8);
        const chairBack = makeRoundedBlock(1.2, 0.9, 0.14, 0.05, chairMat);
        chairBack.position.set(0.1, 0.65, -2.75);
        chairBack.rotation.x = -0.35;
        group.add(chairSeat, chairBack);

        // Interactive Beach Ball!
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 22, 18),
          new THREE.MeshStandardMaterial({ map: window.PunchTextures.getStripedTexture(['#ef4444', '#ffffff', '#facc15', '#3b82f6']), roughness: 0.25 })
        );
        ball.position.set(-1.3, 0.42, -1.0);
        ball.castShadow = true;
        markDynamicProp(ball, dyn, 0.35);
        group.add(ball);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0.1, 0.38, -1.65), pose: 'lie', accessory: 'sunglasses' }));
      }
    },

    // 6. PISTA DE BOLICHE
    {
      name: 'Pista de Boliche',
      sky: 0x1e1b4b,
      floor: (T) => new THREE.MeshStandardMaterial({ map: T.getWoodTexture('#eab308', '#a16207', 8), roughness: 0.18, metalness: 0.12 }),
      build: (group, dyn, enemies, scene) => {
        // Neon gutter rails
        const neonMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xa21caf, emissiveIntensity: 0.7 });
        [-2.0, 2.0].forEach(gx => {
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 12, 12), neonMat);
          rail.rotation.x = Math.PI / 2;
          rail.position.set(gx, 0.08, -3.5);
          group.add(rail);
        });

        // 6 Interactive Bowling Pins in triangle formation!
        const pinCoords = [
          [0, -1.1],
          [-0.45, -1.7], [0.45, -1.7],
          [-0.9, -2.3], [0, -2.3], [0.9, -2.3]
        ];
        pinCoords.forEach(([px, pz]) => {
          const pin = buildBowlingPin();
          pin.position.set(px, 0, pz);
          markDynamicProp(pin, dyn, 0.65);
          group.add(pin);
        });

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xec4899, pos: new THREE.Vector3(-0.7, 0, -2.7), pose: 'wave', accessory: 'cap' }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0.75, 0, -2.7), pose: 'stand' }));
      }
    },

    // 7. COZINHA MALUCA
    {
      name: 'Cozinha do Chef',
      sky: 0xfef9c3,
      floor: (T) => {
        const t = T.getTileTextures('#ffffff', '#1e293b', '#94a3b8', 4);
        return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bumpMap, bumpScale: 0.015, roughness: 0.25 });
      },
      build: (group, dyn, enemies, scene) => {
        const cabinetMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
        const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.08 });

        const island = makeRoundedBlock(3.6, 1.05, 1.4, 0.06, cabinetMat);
        island.position.set(0, 0.52, -2.0);
        const top = makeRoundedBlock(3.8, 0.12, 1.55, 0.04, marbleMat);
        top.position.set(0, 1.1, -2.0);
        group.add(island, top);

        // Shiny Steel Pot + Fruits
        const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.34, 20), steelMat);
        pot.position.set(-0.9, 1.33, -1.9);
        pot.castShadow = true;
        markDynamicProp(pot, dyn, 0.8);
        group.add(pot);

        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.25 }));
        apple.position.set(0.85, 1.29, -1.75);
        markDynamicProp(apple, dyn, 0.3);
        group.add(apple);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0.05, 1.16, -2.0), pose: 'sit', accessory: 'chef' }));
      }
    },

    // 8. ACADEMIA & PESOS
    {
      name: 'Academia',
      sky: 0xdbeafe,
      floor: (T) => {
        const t = T.getTileTextures('#334155', '#1e293b', '#475569', 4);
        return new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.75 });
      },
      build: (group, dyn, enemies, scene) => {
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
        const padMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.55 });

        // Weight Bench
        const bench = makeRoundedBlock(1.1, 0.2, 2.2, 0.06, padMat);
        bench.position.set(-0.8, 0.65, -1.9);
        const stand = makeRoundedBlock(1.0, 0.6, 1.6, 0.04, steelMat);
        stand.position.set(-0.8, 0.3, -1.9);
        group.add(bench, stand);

        // Hanging Red Punching Bag
        const bag = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 1.45, 22),
          new THREE.MeshStandardMaterial({ color: 0xdc2626, bumpMap: window.PunchTextures.getLeatherBumpMap(), bumpScale: 0.02, roughness: 0.32 })
        );
        bag.position.set(1.3, 1.85, -1.9);
        bag.castShadow = true;
        markDynamicProp(bag, dyn, 1.2);
        group.add(bag);

        // Dumbbell
        const db = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 10), steelMat);
        bar.rotation.z = Math.PI / 2;
        const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), steelMat);
        w1.rotation.z = Math.PI / 2; w1.position.x = -0.24;
        const w2 = w1.clone(); w2.position.x = 0.24;
        db.add(bar, w1, w2);
        db.position.set(0.35, 0.16, -0.9);
        markDynamicProp(db, dyn, 0.9);
        group.add(db);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xa855f7, pos: new THREE.Vector3(-0.8, 0.72, -1.85), pose: 'lie', scale: 1.05 }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x0284c7, pos: new THREE.Vector3(0.65, 0, -2.4), pose: 'boxer' }));
      }
    },

    // 9. ESTAÇÃO ESPACIAL
    {
      name: 'Estação Espacial',
      sky: 0x090d16,
      floor: (T) => {
        const t = T.getTileTextures('#1e293b', '#0f172a', '#38bdf8', 3);
        return new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bumpMap, bumpScale: 0.02, roughness: 0.25, metalness: 0.6 });
      },
      build: (group, dyn, enemies, scene) => {
        // Twinkling Stars in background
        const starGeo = new THREE.BufferGeometry();
        const verts = [];
        for (let i = 0; i < 300; i++) {
          verts.push((Math.random() - 0.5) * 35, 2 + Math.random() * 14, -10 - Math.random() * 15);
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }));
        group.add(stars);

        // Glowing Sci-Fi Energy Crates
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
        const glowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });

        [-1.6, 1.6].forEach(cx => {
          const crate = makeRoundedBlock(0.9, 0.9, 0.9, 0.06, crateMat);
          const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), glowMat);
          crate.add(core);
          crate.position.set(cx, 0.45, -2.0);
          markDynamicProp(crate, dyn, 0.9);
          group.add(crate);
        });

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0, 0.45, -1.95), pose: 'wave', accessory: 'helmet' }));
      }
    },

    // 10. PARQUE DA CIDADE
    {
      name: 'Parque da Cidade',
      sky: 0xbae6fd,
      floor: (T) => new THREE.MeshStandardMaterial({ map: T.getGrassTexture(), roughness: 0.85 }),
      build: (group, dyn, enemies, scene) => {
        // Stone walking path
        const pathTex = window.PunchTextures.getTileTextures('#e2e8f0', '#cbd5e1', '#64748b', 4);
        const path = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 16), new THREE.MeshStandardMaterial({ map: pathTex.map, roughness: 0.7 }));
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.015, -2.0);
        path.receiveShadow = true;
        group.add(path);

        // Park Bench
        const woodMat = new THREE.MeshStandardMaterial({ map: window.PunchTextures.getWoodTexture('#b45309', '#78350f', 4), roughness: 0.55 });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 });
        const seat = makeRoundedBlock(2.6, 0.12, 0.75, 0.04, woodMat);
        seat.position.set(0, 0.58, -2.1);
        const back = makeRoundedBlock(2.6, 0.65, 0.12, 0.04, woodMat);
        back.position.set(0, 1.02, -2.42);
        back.rotation.x = -0.18;
        group.add(seat, back);
        [-1.0, 1.0].forEach(bx => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.58, 10), ironMat);
          leg.position.set(bx, 0.29, -2.1);
          group.add(leg);
        });

        // Glowing Streetlamp
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 3.2, 12), ironMat);
        pole.position.set(-2.15, 1.6, -2.3);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 0.7 }));
        bulb.position.set(-2.15, 3.3, -2.3);
        group.add(pole, bulb);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xf59e0b, pos: new THREE.Vector3(-0.35, 0.58, -2.05), pose: 'sit', accessory: 'cap' }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xec4899, pos: new THREE.Vector3(0.65, 0.58, -2.05), pose: 'sit', accessory: 'sunglasses' }));
      }
    },

    // 11. PISCINA DO CLUBE
    {
      name: 'Piscina do Clube',
      sky: 0x93c5fd,
      floor: (T) => {
        const t = T.getTileTextures('#f1f5f9', '#e2e8f0', '#94a3b8', 3);
        return new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.32 });
      },
      build: (group, dyn, enemies, scene) => {
        // Pool Water Basin
        const pool = new THREE.Mesh(
          new THREE.PlaneGeometry(5.5, 4.0),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.08, metalness: 0.35 })
        );
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(0, 0.02, -2.5);
        group.add(pool);

        // Inflatable Pink Donut Float!
        const floatRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.75, 0.24, 16, 28),
          new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.22 })
        );
        floatRing.rotation.x = Math.PI / 2;
        floatRing.position.set(0, 0.22, -2.2);
        floatRing.castShadow = true;
        markDynamicProp(floatRing, dyn, 0.5);
        group.add(floatRing);

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(0, 0.12, -2.2), pose: 'sit', accessory: 'sunglasses' }));
      }
    },

    // 12. SALA DO TRONO REAL
    {
      name: 'Castelo Real',
      sky: 0xfde68a,
      floor: (T) => {
        const t = T.getTileTextures('#fef3c7', '#fde68a', '#b45309', 3);
        return new THREE.MeshStandardMaterial({ map: t.map, roughness: 0.28, metalness: 0.1 });
      },
      build: (group, dyn, enemies, scene) => {
        // Red Royal Carpet
        const carpet = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 })
        );
        carpet.rotation.x = -Math.PI / 2;
        carpet.position.set(0, 0.02, -1.5);
        group.add(carpet);

        // Golden Throne
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
        const velvetMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
        const seat = makeRoundedBlock(1.4, 0.65, 1.1, 0.1, goldMat);
        seat.position.set(0, 0.35, -2.5);
        const cushion = makeRoundedBlock(1.1, 0.18, 0.9, 0.06, velvetMat);
        cushion.position.set(0, 0.72, -2.45);
        const back = makeRoundedBlock(1.3, 1.9, 0.25, 0.1, goldMat);
        back.position.set(0, 1.35, -2.95);
        group.add(seat, cushion, back);

        // Marble pillars
        const marbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
        [-2.2, 2.2].forEach(px => {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 3.8, 20), marbleMat);
          pil.position.set(px, 1.9, -2.8);
          pil.castShadow = true;
          group.add(pil);
        });

        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0xa855f7, pos: new THREE.Vector3(0, 0.56, -2.4), pose: 'sit', accessory: 'crown', scale: 1.08 }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x0284c7, pos: new THREE.Vector3(-1.35, 0, -1.6), pose: 'stand' }));
        enemies.push(window.PunchRagdoll.createEnemy(scene, { color: 0x22c55e, pos: new THREE.Vector3(1.35, 0, -1.6), pose: 'stand' }));
      }
    }
  ];

  function buildScenario(scene, level, floorMesh) {
    const group = new THREE.Group();
    const dynamicProps = [];
    const enemies = [];

    const themeIdx = (level - 1) % THEMES.length;
    const theme = THEMES[themeIdx];

    // Apply theme sky & fog
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.FogExp2(theme.sky, 0.018);

    // Apply theme floor material
    floorMesh.material = theme.floor(window.PunchTextures);

    // Build main themed environment + targets
    theme.build(group, dynamicProps, enemies, scene, level);

    // For levels > 12 (second loop and beyond), add extra chaotic colorful ragdoll buddies!
    const loopCount = Math.floor((level - 1) / THEMES.length);
    if (loopCount > 0) {
      const extraColors = [0xec4899, 0x0284c7, 0xf59e0b, 0x22c55e, 0xa855f7];
      const extraPos = [
        new THREE.Vector3(-1.55, 0, -1.35),
        new THREE.Vector3(1.55, 0, -1.35)
      ];
      for (let i = 0; i < Math.min(loopCount, 2); i++) {
        enemies.push(window.PunchRagdoll.createEnemy(scene, {
          color: extraColors[(level + i) % extraColors.length],
          pos: extraPos[i],
          pose: i % 2 === 0 ? 'wave' : 'peek'
        }));
      }
    }

    scene.add(group);

    return {
      themeName: theme.name,
      group,
      dynamicProps,
      enemies
    };
  }

  return {
    buildScenario
  };
})();
