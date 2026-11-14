// Organic Sculpted 3D Ragdoll Character Builder (Three.js r128)
// Replaces blocky cylinders with smooth LatheGeometry sculpted anatomy, plush bump maps,
// expressive eyes/mouth/brows, and fun themed accessories!

window.PunchRagdoll = (() => {
  // Smooth tapered capsule/limb profile built via LatheGeometry
  function createSculptedLimbGeo(len, rTop, rMid, rBot) {
    const pts = [];
    const steps = 12;
    // Top hemispherical cap
    for (let i = 0; i <= 4; i++) {
      const a = (i / 4) * (Math.PI * 0.5);
      pts.push(new THREE.Vector2(Math.sin(a) * rTop, Math.cos(a) * rTop * 0.8));
    }
    // Smooth organic muscle taper along length
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const muscleCurve = Math.sin(t * Math.PI);
      const r = rTop * (1 - t) + rBot * t + (rMid - (rTop + rBot) * 0.5) * muscleCurve;
      pts.push(new THREE.Vector2(Math.max(0.01, r), -t * len));
    }
    // Bottom cap
    for (let i = 0; i <= 4; i++) {
      const a = (i / 4) * (Math.PI * 0.5);
      pts.push(new THREE.Vector2(Math.cos(a) * rBot, -len - Math.sin(a) * rBot * 0.8));
    }
    return new THREE.LatheGeometry(pts, 20);
  }

  // Sculpted organic torso (rounded shoulders, chest, waist, rounded hips)
  function createSculptedTorsoGeo() {
    const pts = [
      new THREE.Vector2(0.0, 0.48),
      new THREE.Vector2(0.18, 0.45),
      new THREE.Vector2(0.32, 0.34),
      new THREE.Vector2(0.35, 0.16), // chest
      new THREE.Vector2(0.28, -0.05), // waist
      new THREE.Vector2(0.33, -0.28), // hips
      new THREE.Vector2(0.26, -0.44),
      new THREE.Vector2(0.0, -0.48)
    ];
    return new THREE.LatheGeometry(pts, 24);
  }

  function buildAccessory(type, headGroup, torsoGroup) {
    if (!type) return;
    if (type === 'sunglasses') {
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2, metalness: 0.7 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.05, metalness: 0.9 });
      [-0.19, 0.19].forEach(x => {
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.05, 18), frameMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(x, 0.19, 0.46);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.055, 18), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x, 0.19, 0.465);
        headGroup.add(rim, lens);
      });
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), frameMat);
      bridge.position.set(0, 0.21, 0.47);
      headGroup.add(bridge);
    } else if (type === 'crown') {
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.18 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.14, 20), goldMat);
      base.position.set(0, 0.56, 0);
      base.castShadow = true;
      headGroup.add(base);
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 10), goldMat);
        spike.position.set(Math.cos(ang) * 0.2, 0.68, Math.sin(ang) * 0.2);
        headGroup.add(spike);
      }
    } else if (type === 'chef') {
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.16, 20), whiteMat);
      brim.position.set(0, 0.54, 0);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 16), whiteMat);
      puff.scale.set(1.05, 0.85, 1.05);
      puff.position.set(0, 0.74, 0);
      headGroup.add(brim, puff);
    } else if (type === 'helmet') {
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        roughness: 0.08,
        metalness: 0.2,
        transparent: true,
        opacity: 0.42
      });
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 20), glassMat);
      dome.position.set(0, 0.08, 0);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 12, 24), ringMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, -0.36, 0);
      headGroup.add(dome, collar);
    } else if (type === 'boxer') {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
      const headgear = new THREE.Mesh(new THREE.SphereGeometry(0.48, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.58), redMat);
      headgear.position.set(0, 0.1, -0.02);
      headGroup.add(headgear);
    } else if (type === 'tie') {
      const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), tieMat);
      knot.position.set(0, 0.34, 0.33);
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 4), tieMat);
      blade.rotation.z = Math.PI;
      blade.scale.set(1, 1, 0.35);
      blade.position.set(0, 0.12, 0.34);
      torsoGroup.add(knot, blade);
    } else if (type === 'cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
      crown.position.set(0, 0.14, 0);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 18, 1, false, -Math.PI * 0.4, Math.PI * 0.8), capMat);
      visor.position.set(0, 0.22, 0.16);
      headGroup.add(crown, visor);
    }
  }

  function createEnemy(scene, options = {}) {
    const {
      color = 0x22c55e,
      pos = new THREE.Vector3(0, 0, 0),
      pose = 'stand',
      accessory = null,
      scale = 1.0
    } = options;

    const enemy = new THREE.Group();
    const plushBump = window.PunchTextures.getPlushBumpMap();

    const skinMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.48,
      metalness: 0.04,
      bumpMap: plushBump,
      bumpScale: 0.015
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.38),
      roughness: 0.55,
      bumpMap: plushBump,
      bumpScale: 0.012
    });

    // Sculpted Head
    const headGroup = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(0.42, 28, 24);
    headGeo.scale(1.12, 1.08, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    // Soft rounded cheeks / snout
    const snoutGeo = new THREE.SphereGeometry(0.28, 22, 16);
    snoutGeo.scale(1.25, 0.72, 0.9);
    const snoutMesh = new THREE.Mesh(snoutGeo, bellyMat);
    snoutMesh.position.set(0, -0.1, 0.25);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Expressive Sculpted Eyes (eyelids, glossy sclera, colored iris, pupil, specular dot)
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.08 });
    const browMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

    const eyelids = [];
    [-0.19, 0.19].forEach((xOff, idx) => {
      const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 20), eyeWhiteMat);
      eyeSocket.position.set(xOff, 0.19, 0.33);
      eyeSocket.castShadow = true;

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), irisMat);
      iris.position.set(xOff, 0.19, 0.425);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), pupilMat);
      pupil.position.set(xOff, 0.19, 0.455);

      // Eyelid cap for blinking
      const lidGeo = new THREE.SphereGeometry(0.155, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const lid = new THREE.Mesh(lidGeo, skinMat);
      lid.position.set(xOff, 0.195, 0.33);
      lid.rotation.x = -0.75; // open by default
      eyelids.push(lid);

      // Expressive brow
      const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.17, 10), browMat);
      brow.rotation.z = idx === 0 ? Math.PI * 0.44 : -Math.PI * 0.44;
      brow.position.set(xOff, 0.37, 0.36);

      headGroup.add(eyeSocket, iris, pupil, lid, brow);
    });

    // Open comic mouth + tongue
    const mouthCav = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.7 })
    );
    mouthCav.scale.set(1.2, 0.55, 0.6);
    mouthCav.position.set(0, -0.14, 0.41);

    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 })
    );
    tongue.scale.set(1.0, 0.45, 0.8);
    tongue.position.set(0, -0.17, 0.44);
    headGroup.add(mouthCav, tongue);

    headGroup.position.set(0, 1.66, 0);

    // Sculpted Organic Torso + Lighter Belly Patch
    const torsoGroup = new THREE.Group();
    const torsoMesh = new THREE.Mesh(createSculptedTorsoGeo(), skinMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoGroup.add(torsoMesh);

    const bellyPatch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), bellyMat);
    bellyPatch.scale.set(0.95, 1.25, 0.5);
    bellyPatch.position.set(0, -0.02, 0.21);
    torsoGroup.add(bellyPatch);
    torsoGroup.position.set(0, 1.05, 0);

    // Sculpted Arms & Rounded Hands
    function buildLimb(len, rT, rM, rB) {
      const grp = new THREE.Group();
      const mesh = new THREE.Mesh(createSculptedLimbGeo(len, rT, rM, rB), skinMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      grp.add(mesh);
      return grp;
    }

    const leftUpperArm = buildLimb(0.42, 0.115, 0.11, 0.095);
    const leftForeArm = buildLimb(0.40, 0.095, 0.09, 0.08);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), skinMat);
    leftHand.scale.set(1.1, 1.2, 0.85);
    leftHand.position.set(0, -0.43, 0.02);
    leftHand.castShadow = true;
    leftForeArm.add(leftHand);
    leftUpperArm.position.set(-0.37, 0.34, 0);
    leftForeArm.position.set(0, -0.42, 0);
    leftUpperArm.add(leftForeArm);
    torsoGroup.add(leftUpperArm);

    const rightUpperArm = buildLimb(0.42, 0.115, 0.11, 0.095);
    const rightForeArm = buildLimb(0.40, 0.095, 0.09, 0.08);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), skinMat);
    rightHand.scale.set(1.1, 1.2, 0.85);
    rightHand.position.set(0, -0.43, 0.02);
    rightHand.castShadow = true;
    rightForeArm.add(rightHand);
    rightUpperArm.position.set(0.37, 0.34, 0);
    rightForeArm.position.set(0, -0.42, 0);
    rightUpperArm.add(rightForeArm);
    torsoGroup.add(rightUpperArm);

    // Sculpted Legs & Rounded Feet
    const leftThigh = buildLimb(0.48, 0.14, 0.13, 0.11);
    const leftCalf = buildLimb(0.48, 0.11, 0.105, 0.085);
    const leftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), skinMat);
    leftFoot.scale.set(0.95, 0.65, 1.55);
    leftFoot.position.set(0, -0.51, 0.08);
    leftFoot.castShadow = true;
    leftCalf.add(leftFoot);
    leftThigh.position.set(-0.18, -0.40, 0);
    leftCalf.position.set(0, -0.48, 0);
    leftThigh.add(leftCalf);
    torsoGroup.add(leftThigh);

    const rightThigh = buildLimb(0.48, 0.14, 0.13, 0.11);
    const rightCalf = buildLimb(0.48, 0.11, 0.105, 0.085);
    const rightFoot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), skinMat);
    rightFoot.scale.set(0.95, 0.65, 1.55);
    rightFoot.position.set(0, -0.51, 0.08);
    rightFoot.castShadow = true;
    rightCalf.add(rightFoot);
    rightThigh.position.set(0.18, -0.40, 0);
    rightCalf.position.set(0, -0.48, 0);
    rightThigh.add(rightCalf);
    torsoGroup.add(rightThigh);

    buildAccessory(accessory, headGroup, torsoGroup);

    enemy.add(headGroup);
    enemy.add(torsoGroup);
    enemy.position.copy(pos);
    enemy.scale.setScalar(scale);

    // Pose Library (expressive & varied!)
    if (pose === 'lie') {
      enemy.rotation.z = Math.PI / 2;
      enemy.position.y = pos.y + 0.38 * scale;
      headGroup.rotation.z = -0.42;
      leftUpperArm.rotation.set(0.25, 0, 1.15);
      leftForeArm.rotation.set(0, 0, 1.65);
      rightUpperArm.rotation.set(-0.2, 0, -0.55);
      leftThigh.rotation.set(0.25, 0, 0.2);
      rightThigh.rotation.set(-0.35, 0, -0.25);
    } else if (pose === 'sit') {
      enemy.position.y = pos.y + 0.56 * scale;
      headGroup.rotation.x = 0.12;
      leftThigh.rotation.x = -Math.PI / 2;
      rightThigh.rotation.x = -Math.PI / 2;
      leftCalf.rotation.x = Math.PI / 2.2;
      rightCalf.rotation.x = Math.PI / 2.2;
      leftUpperArm.rotation.set(-0.45, 0, 0.25);
      rightUpperArm.rotation.set(-0.45, 0, -0.25);
    } else if (pose === 'boxer') {
      enemy.position.y = pos.y + 0.42 * scale;
      leftUpperArm.rotation.set(-1.1, 0.2, 0.25);
      leftForeArm.rotation.set(-1.3, 0, 0);
      rightUpperArm.rotation.set(-1.2, -0.2, -0.25);
      rightForeArm.rotation.set(-1.4, 0, 0);
      leftThigh.rotation.x = -0.25;
      rightThigh.rotation.x = 0.28;
    } else if (pose === 'wave') {
      enemy.position.y = pos.y + 0.42 * scale;
      leftUpperArm.rotation.set(0, 0, 2.5);
      leftForeArm.rotation.set(0, 0, -0.4);
      rightUpperArm.rotation.set(0, 0, -0.35);
    } else if (pose === 'peek') {
      enemy.position.y = pos.y + 0.42 * scale;
      headGroup.rotation.y = -0.3;
      leftUpperArm.rotation.set(-0.8, 0, 0.4);
      rightUpperArm.rotation.set(-0.8, 0, -0.4);
    } else {
      // 'stand'
      enemy.position.y = pos.y + 0.42 * scale;
      leftUpperArm.rotation.z = 0.25;
      rightUpperArm.rotation.z = -0.25;
    }

    enemy.userData = {
      isEnemy: true,
      isHit: false,
      pose,
      baseY: enemy.position.y,
      baseRotZ: enemy.rotation.z,
      animOffset: Math.random() * Math.PI * 2,
      velocity: new THREE.Vector3(),
      rotVelocity: new THREE.Vector3(),
      headGroup,
      torsoGroup,
      eyelids,
      leftUpperArm,
      rightUpperArm,
      leftForeArm,
      rightForeArm,
      leftThigh,
      rightThigh,
      leftCalf,
      rightCalf
    };

    scene.add(enemy);
    return enemy;
  }

  // Animate breathing, blinking, waving & ragdoll flying
  function updateEnemyAnimation(enemy, timeSec, dt, gravity, onBounce) {
    const ud = enemy.userData;
    if (!ud.isHit) {
      const t = timeSec * 2.4 + ud.animOffset;
      // Subtle organic breathing
      ud.torsoGroup.scale.set(1 + Math.sin(t) * 0.02, 1 - Math.sin(t) * 0.015, 1 + Math.sin(t) * 0.02);

      // Periodic realistic blinking
      const blinkCycle = (timeSec + ud.animOffset) % 3.6;
      const isBlinking = blinkCycle > 3.45;
      ud.eyelids.forEach(lid => {
        lid.rotation.x = isBlinking ? 0.05 : -0.75;
      });

      if (ud.pose === 'wave') {
        ud.leftUpperArm.rotation.z = 2.45 + Math.sin(timeSec * 6) * 0.28;
        ud.headGroup.rotation.z = Math.sin(timeSec * 3) * 0.08;
      } else if (ud.pose === 'boxer') {
        enemy.position.y = ud.baseY + Math.abs(Math.sin(timeSec * 4.5)) * 0.08;
        ud.torsoGroup.rotation.y = Math.sin(timeSec * 3.5) * 0.14;
      } else if (ud.pose === 'lie') {
        ud.rightThigh.rotation.x = -0.25 + Math.sin(timeSec * 3.2) * 0.18;
      } else if (ud.pose === 'sit') {
        ud.headGroup.rotation.y = Math.sin(timeSec * 1.6) * 0.22;
      }
      return;
    }

    // Ragdoll flying physics with floor & back wall bounce!
    ud.velocity.y += gravity * dt;
    enemy.position.addScaledVector(ud.velocity, dt);

    enemy.rotation.x += ud.rotVelocity.x * dt;
    enemy.rotation.y += ud.rotVelocity.y * dt;
    enemy.rotation.z += ud.rotVelocity.z * dt;

    // Bounce off floor
    if (enemy.position.y < 0.45 && ud.velocity.y < 0) {
      const impactSpeed = Math.abs(ud.velocity.y);
      enemy.position.y = 0.45;
      ud.velocity.y *= -0.52;
      ud.velocity.x *= 0.8;
      ud.velocity.z *= 0.8;
      ud.rotVelocity.multiplyScalar(0.75);
      if (onBounce && impactSpeed > 2.2) {
        onBounce(Math.min(1, impactSpeed / 14));
      }
    }

    // Limbs flailing organically in flight
    ud.leftUpperArm.rotation.z += 11 * dt;
    ud.rightUpperArm.rotation.z -= 11 * dt;
    ud.leftForeArm.rotation.x += 14 * dt;
    ud.rightForeArm.rotation.x -= 14 * dt;
    ud.leftThigh.rotation.x += 12 * dt;
    ud.rightThigh.rotation.x -= 12 * dt;
    ud.headGroup.rotation.y += 7 * dt;
  }

  return {
    createEnemy,
    updateEnemyAnimation
  };
})();
