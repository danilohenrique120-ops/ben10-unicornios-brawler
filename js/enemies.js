// Stage-Specific Enemies & Bosses (True 16-Bit Pixel Art Sprites)

function createEnemy(type, x, y, isBoss = false) {
  const templates = {
    // Stage 1: City
    city_drone: { sheetIndex: 0, name: 'Drone Vilgax', hp: 38, speed: 1.75, scale: 0.92, accent: '#ef4444' },
    street_bot: { sheetIndex: 5, name: 'Robô Blindado', hp: 46, speed: 1.5, scale: 0.85, accent: '#eab308' },
    boss_city: { sheetIndex: 5, name: 'MEGA ROBÔ MECHA', hp: 230, speed: 1.4, scale: 1.38, accent: '#ef4444' },

    // Stage 2: Forest
    forest_plant: { sheetIndex: 1, name: 'Planta Carnívora', hp: 42, speed: 1.7, scale: 0.96, accent: '#22c55e' },
    boss_forest: { sheetIndex: 1, name: 'REI PLANTA MONSTRO', hp: 250, speed: 1.45, scale: 1.42, accent: '#facc15' },

    // Stage 3: Snow
    snow_yeti: { sheetIndex: 2, name: 'Yeti Congelado', hp: 46, speed: 1.7, scale: 0.96, accent: '#38bdf8' },
    boss_snow: { sheetIndex: 2, name: 'GIGANTE YETI DO GELO', hp: 270, speed: 1.5, scale: 1.45, accent: '#38bdf8' },

    // Stage 4: Volcano
    lava_golem: { sheetIndex: 3, name: 'Golem de Lava', hp: 52, speed: 1.65, scale: 0.98, accent: '#f97316' },
    boss_volcano: { sheetIndex: 6, name: 'DRAGÃO REI DE MAGMA', hp: 300, speed: 1.6, scale: 1.48, accent: '#fde047' },

    // Stage 5: Bridge
    bridge_knight: { sheetIndex: 4, name: 'Cavaleiro Cyber', hp: 54, speed: 1.85, scale: 0.96, accent: '#facc15' },
    boss_bridge: { sheetIndex: 4, name: 'GUARDIÃO DOURADO SUPREMO', hp: 320, speed: 1.65, scale: 1.45, accent: '#fde047' },

    // Stage 6: Cosmic Castle
    boss_final: { sheetIndex: 7, name: 'IMPERADOR VILGAX SUPREMO', hp: 380, speed: 1.75, scale: 1.52, accent: '#4ade80' }
  };

  const tpl = templates[type] || templates.city_drone;
  return {
    type,
    sheetIndex: tpl.sheetIndex,
    name: tpl.name,
    isBoss,
    x,
    y,
    z: 0,
    vz: 0,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: tpl.hp,
    maxHp: tpl.hp,
    speed: tpl.speed,
    scale: tpl.scale,
    accent: tpl.accent,
    animTime: Math.random() * 10,
    hitStun: 0,
    attackCooldown: 65 + Math.random() * 50,
    attackWindup: 0
  };
}

function drawEnemySprite(ctx, enemy) {
  const pe = window.pixelEngine;
  const spriteObj = pe && pe.ready ? pe.enemySprites[enemy.sheetIndex] : null;

  const targetH = 152 * enemy.scale;

  if (spriteObj) {
    pe.drawAnimatedPixelSprite(ctx, spriteObj, {
      x: enemy.x,
      y: enemy.y,
      z: enemy.z,
      facing: enemy.facing,
      targetHeight: targetH,
      animTime: enemy.animTime,
      action: enemy.attackWindup > 0 ? 'attack' : 'walk',
      hitFlash: enemy.hitStun > 0.16,
      accentColor: enemy.accent,
      isUnicorn: false
    });
  }

  // Overhead Pixel Health Bar for damaged standard enemies
  if (!enemy.isBoss && enemy.hp < enemy.maxHp) {
    const barW = 58;
    const barX = Math.round(enemy.x - barW * 0.5);
    const barY = Math.round(enemy.y - enemy.z - targetH - 14);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, 10);
    ctx.fillStyle = '#334155';
    ctx.fillRect(barX, barY, barW, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, Math.round(barW * Math.max(0, enemy.hp / enemy.maxHp)), 6);
  }
}

window.createEnemy = createEnemy;
window.drawEnemySprite = drawEnemySprite;
