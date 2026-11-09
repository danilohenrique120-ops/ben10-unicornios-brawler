// True 16-Bit Arcade Pixel-Art Asset Processor & Sprite Animator
// Extracts clean transparent 16-bit sprites from the generated pixel-art sheets,
// builds animated upper/lower body slices, hit-flash silhouettes, and stage backgrounds!

class PixelArtEngine {
  constructor() {
    this.ready = false;
    this.heroSprites = [];   // 8 processed hero sprite objects
    this.enemySprites = [];  // 8 processed enemy/boss sprite objects
    this.stageBgs = {};      // 6 loaded stage background images
    this.onReadyCallbacks = [];
  }

  init(callback) {
    if (this.ready) {
      if (callback) callback();
      return;
    }
    if (callback) this.onReadyCallbacks.push(callback);

    const assets = window.PIXEL_ASSETS || {};
    const keys = Object.keys(assets);
    if (keys.length === 0) return;

    const loadedImgs = {};
    let remaining = keys.length;

    keys.forEach((key) => {
      const img = new Image();
      img.onload = () => {
        loadedImgs[key] = img;
        remaining--;
        if (remaining === 0) {
          this.processAllAssets(loadedImgs);
        }
      };
      img.src = assets[key];
    });
  }

  processAllAssets(imgs) {
    // 1. Slice & Chroma-Key the 8 Heroes (2 rows x 4 cols, magenta background)
    if (imgs.heroes_sheet) {
      this.heroSprites = this.extractGridSheet(imgs.heroes_sheet, 2, 4, 'magenta');
    }

    // 2. Slice & Chroma-Key the 8 Enemies/Bosses (2 rows x 4 cols, green background)
    if (imgs.enemies_sheet) {
      this.enemySprites = this.extractGridSheet(imgs.enemies_sheet, 2, 4, 'green');
    }

    // 3. Store Stage Backgrounds
    this.stageBgs = {
      city: imgs.city_bg,
      forest: imgs.forest_bg,
      snow: imgs.snow_bg,
      volcano: imgs.volcano_bg,
      bridge: imgs.bridge_bg,
      castle: imgs.castle_bg
    };

    this.ready = true;
    this.onReadyCallbacks.forEach((cb) => cb());
    this.onReadyCallbacks = [];
  }

  extractGridSheet(sheetImg, rows, cols, mode) {
    const cellW = Math.floor(sheetImg.width / cols);
    const cellH = Math.floor(sheetImg.height / rows);
    const results = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const margin = 8; // Skip cell divider lines
        const w = cellW - margin * 2;
        const h = cellH - margin * 2;

        const workCanvas = document.createElement('canvas');
        workCanvas.width = w;
        workCanvas.height = h;
        const ctx = workCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
          sheetImg,
          c * cellW + margin,
          r * cellH + margin,
          w,
          h,
          0,
          0,
          w,
          h
        );

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample corner background color (average of 4 corners)
        const sampleCorner = (cx, cy) => {
          const idx = (cy * w + cx) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        };
        const c1 = sampleCorner(2, 2);
        const c2 = sampleCorner(w - 3, 2);
        const bgR = (c1[0] + c2[0]) * 0.5;
        const bgG = (c1[1] + c2[1]) * 0.5;
        const bgB = (c1[2] + c2[2]) * 0.5;

        const isBgColor = (idx, strict = false) => {
          const R = data[idx];
          const G = data[idx + 1];
          const B = data[idx + 2];
          const dist = Math.hypot(R - bgR, G - bgG, B - bgB);

          if (mode === 'magenta') {
            // Magenta background: high R, low G, high B
            const magentaDominance = R > 130 && B > 110 && G < Math.min(R, B) - (strict ? 55 : 35);
            return dist < (strict ? 36 : 62) || (strict ? dist < 44 && magentaDominance : dist < 78 && magentaDominance);
          } else {
            // Green background: high G, low R, low B
            const greenDominance = G > 140 && R < G - (strict ? 65 : 40) && B < G - (strict ? 65 : 40);
            return dist < (strict ? 45 : 75) || greenDominance;
          }
        };

        // Pass 1: Flood-fill from all 4 outer perimeter edges (stops at dark character outline!)
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let qHead = 0;
        let qTail = 0;

        const pushEdge = (x, y) => {
          const p = y * w + x;
          if (!visited[p] && isBgColor(p * 4, false)) {
            visited[p] = 1;
            queue[qTail++] = p;
          }
        };

        for (let x = 0; x < w; x++) {
          pushEdge(x, 0);
          pushEdge(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushEdge(0, y);
          pushEdge(w - 1, y);
        }

        while (qHead < qTail) {
          const p = queue[qHead++];
          const idx = p * 4;
          data[idx + 3] = 0; // Make transparent

          const x = p % w;
          const y = (p - x) / w;

          if (x > 0) pushEdge(x - 1, y);
          if (x < w - 1) pushEdge(x + 1, y);
          if (y > 0) pushEdge(x, y - 1);
          if (y < h - 1) pushEdge(x, y + 1);
        }

        // Pass 2: Clear enclosed background loops (e.g., between legs or arms) using strict match
        for (let p = 0; p < w * h; p++) {
          if (!visited[p] && isBgColor(p * 4, true)) {
            data[p * 4 + 3] = 0;
          }
        }

        // Pass 3: De-fringe 1px halo pixels directly adjacent to transparent background
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const p = y * w + x;
            const idx = p * 4;
            if (data[idx + 3] === 0) continue;
            const hasTransNeighbor =
              data[((y - 1) * w + x) * 4 + 3] === 0 ||
              data[((y + 1) * w + x) * 4 + 3] === 0 ||
              data[(y * w + (x - 1)) * 4 + 3] === 0 ||
              data[(y * w + (x + 1)) * 4 + 3] === 0;
            if (hasTransNeighbor && isBgColor(idx, false)) {
              data[idx + 3] = 0;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Pass 4: Find tight bounding box of the character so feet touch y = 0 cleanly
        let minX = w, minY = h, maxX = 0, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX <= minX || maxY <= minY) {
          minX = 0; minY = 0; maxX = w - 1; maxY = h - 1;
        }

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = cropW;
        fullCanvas.height = cropH;
        const fCtx = fullCanvas.getContext('2d');
        fCtx.imageSmoothingEnabled = false;
        fCtx.drawImage(workCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        // Create White Hit-Flash Silhouette Canvas for arcade hit feedback
        const flashCanvas = document.createElement('canvas');
        flashCanvas.width = cropW;
        flashCanvas.height = cropH;
        const flCtx = flashCanvas.getContext('2d');
        flCtx.imageSmoothingEnabled = false;
        flCtx.drawImage(fullCanvas, 0, 0);
        flCtx.globalCompositeOperation = 'source-in';
        flCtx.fillStyle = '#ffffff';
        flCtx.fillRect(0, 0, cropW, cropH);

        results.push({
          canvas: fullCanvas,
          flashCanvas,
          width: cropW,
          height: cropH
        });
      }
    }

    return results;
  }

  // Draw an extracted 16-bit character sprite with animated upper/lower body movement,
  // attack slash/horn effects, afterimages, and arcade shadows!
  drawAnimatedPixelSprite(ctx, spriteObj, opts) {
    if (!spriteObj || !spriteObj.canvas) return;

    const {
      x = 0,
      y = 0,
      z = 0,
      facing = 1,
      targetHeight = 148,
      animTime = 0,
      action = 'idle', // 'idle' | 'walk' | 'attack' | 'special' | 'thumbsup'
      hitFlash = false,
      auraColor = null,
      accentColor = '#fde047',
      isUnicorn = false
    } = opts;

    const drawH = targetHeight;
    const drawW = (spriteObj.width / spriteObj.height) * drawH;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));

    // 1. Crisp 16-Bit Pixel Ground Shadow
    const shadowScale = Math.max(0.45, 1 - z / 200);
    ctx.fillStyle = 'rgba(8, 10, 18, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 0, drawW * 0.38 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -Math.round(z));
    ctx.scale(facing, 1);

    // 2. Calculate 16-Bit Arcade Animation Offsets (Split Upper Torso & Lower Legs!)
    const isWalking = action === 'walk';
    const isAttacking = action === 'attack' || action === 'special';

    // Stepped pixel animation (snapped to 2px increments for authentic 16-bit feel!)
    const rawBob = isWalking
      ? Math.sin(animTime * 15) * 5
      : Math.sin(animTime * 5) * 2.5;
    const bobY = Math.round(rawBob / 2) * 2;

    const legStrideX = isWalking ? Math.round(Math.sin(animTime * 15) * 5) : 0;
    const lungeX = isAttacking ? 16 : 0;
    const tiltAngle = isAttacking ? 0.09 : (isWalking ? Math.sin(animTime * 15) * 0.035 : 0);

    const src = hitFlash ? spriteObj.flashCanvas : spriteObj.canvas;
    const splitRatio = 0.66; // Top 66% = Head/Torso/Arms, Bottom 34% = Legs
    const srcSplitY = Math.floor(spriteObj.height * splitRatio);
    const dstSplitH = Math.floor(drawH * splitRatio);
    const dstLegH = drawH - dstSplitH;

    // Optional Speed / Power Afterimage Ghost when attacking or dashing
    if (isAttacking || auraColor) {
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.drawImage(
        src,
        0, 0, spriteObj.width, spriteObj.height,
        -drawW * 0.5 - 16, -drawH + bobY, drawW, drawH
      );
      ctx.restore();
    }

    ctx.translate(lungeX, 0);
    ctx.rotate(tiltAngle);

    // Draw Lower Body (Legs) with stride animation
    ctx.drawImage(
      src,
      0, srcSplitY, spriteObj.width, spriteObj.height - srcSplitY,
      -drawW * 0.5 + legStrideX, -dstLegH, drawW, dstLegH
    );

    // Draw Upper Body (Torso, Arms, Head, Horn) with breathing/combat bounce
    ctx.drawImage(
      src,
      0, 0, spriteObj.width, srcSplitY,
      -drawW * 0.5, -drawH + bobY, drawW, dstSplitH + 2
    );

    // 3. Draw 16-Bit Pixel Attack Slash / Unicorn Horn Drill Effect when attacking!
    if (isAttacking) {
      this.drawPixelAttackArc(ctx, drawW * 0.42, -drawH * 0.58 + bobY, accentColor, isUnicorn, action === 'special');
    }

    ctx.restore();
  }

  // Pixelated 16-Bit Slash / Horn Impact Effect
  drawPixelAttackArc(ctx, ox, oy, color, isUnicorn, isSpecial) {
    ctx.save();
    const px = 4; // 4x4 pixel blocks for authentic 16-bit effect
    ctx.fillStyle = color;

    if (isUnicorn) {
      // Glowing 16-Bit Horn Spiral Lance & Star Sparks!
      const len = isSpecial ? 18 : 11;
      for (let i = 0; i < len; i++) {
        const halfH = Math.max(1, Math.floor((len - i) * 0.35));
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : color;
        ctx.fillRect(ox + i * px, oy - halfH * px - 8, px, halfH * 2 * px);
      }
    } else {
      // Classic 16-Bit Brawler Crescent Punch Wave!
      const steps = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
      steps.forEach((s) => {
        const curveX = ox + (16 - s * s) * 2.2;
        const curveY = oy + s * 6;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(curveX), Math.round(curveY), px * 3, px * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(curveX + px), Math.round(curveY), px * 2, px);
      });
    }
    ctx.restore();
  }
}

window.pixelEngine = new PixelArtEngine();
