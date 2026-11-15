// Pop It 3D - Definição dos 15 Modelos e Conectividade Segura de Células
window.PopItModels = (() => {
  const SPACING = 1.05;

  function generateGridCells(coords, color) {
    return coords.map(([gx, gz]) => ({
      x: gx * SPACING,
      z: gz * SPACING,
      color
    }));
  }

  const MODELS = {
    square: {
      name: 'Quadrado', icon: '🟦',
      pieces: [
        { id: 0, color: 0xff4757, spawnOffset: { x: -3.2, z: -1.8 }, cells: generateGridCells([[-1.5,-1.5], [-0.5,-1.5], [-1.5,-0.5], [-0.5,-0.5], [-1.5,0.5], [-0.5,0.5]], 0xff4757) },
        { id: 1, color: 0xffa502, spawnOffset: { x: 3.2, z: -1.8 }, cells: generateGridCells([[0.5,-1.5], [1.5,-1.5], [0.5,-0.5], [1.5,-0.5], [0.5,0.5], [1.5,0.5]], 0xffa502) },
        { id: 2, color: 0x2ed573, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-1.5,1.5], [-0.5,1.5], [-1.5,2.5], [-0.5,2.5]], 0x2ed573) },
        { id: 3, color: 0x1e90ff, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[0.5,1.5], [1.5,1.5], [0.5,2.5], [1.5,2.5]], 0x1e90ff) }
      ]
    },
    heart: {
      name: 'Coração', icon: '❤️',
      pieces: [
        { id: 0, color: 0xff4757, spawnOffset: { x: -3.3, z: -1.8 }, cells: generateGridCells([[-1.5,-2], [-0.5,-2], [-2.5,-1], [-1.5,-1], [-0.5,-1]], 0xff4757) },
        { id: 1, color: 0xff6b81, spawnOffset: { x: 3.3, z: -1.8 }, cells: generateGridCells([[0.5,-2], [1.5,-2], [0.5,-1], [1.5,-1], [2.5,-1]], 0xff6b81) },
        { id: 2, color: 0xa55eea, spawnOffset: { x: -3.1, z: 2.2 }, cells: generateGridCells([[-2.5,0], [-1.5,0], [-0.5,0], [0.5,0], [1.5,0], [2.5,0]], 0xa55eea) },
        { id: 3, color: 0xfd9644, spawnOffset: { x: 3.3, z: 2.2 }, cells: generateGridCells([[-1.5,1], [-0.5,1], [0.5,1], [1.5,1], [-0.5,2], [0.5,2]], 0xfd9644) }
      ]
    },
    flower: {
      name: 'Flor', icon: '🌸',
      pieces: [
        { id: 0, color: 0xfeca57, spawnOffset: { x: 0, z: -3.4 }, cells: generateGridCells([[0,0], [-1,0], [1,0], [0,-1], [0,1]], 0xfeca57) },
        { id: 1, color: 0xff6b6b, spawnOffset: { x: -3.4, z: -1.4 }, cells: generateGridCells([[-1,-2], [0,-2], [-2,-1], [-1,-1]], 0xff6b6b) },
        { id: 2, color: 0x48dbfb, spawnOffset: { x: 3.4, z: -1.4 }, cells: generateGridCells([[1,-2], [2,-1], [1,-1], [2,0]], 0x48dbfb) },
        { id: 3, color: 0x1dd1a1, spawnOffset: { x: 3.2, z: 2.1 }, cells: generateGridCells([[1,1], [2,1], [0,2], [1,2]], 0x1dd1a1) },
        { id: 4, color: 0xff9ff3, spawnOffset: { x: -3.2, z: 2.1 }, cells: generateGridCells([[-2,0], [-2,1], [-1,1], [-1,2]], 0xff9ff3) }
      ]
    },
    gamepad: {
      name: 'Controle', icon: '🎮',
      pieces: [
        { id: 0, color: 0x3b82f6, spawnOffset: { x: -3.4, z: -1.6 }, cells: generateGridCells([[-2.5,-1], [-1.5,-1], [-2.5,0], [-1.5,0], [-2.5,1], [-2.0,2]], 0x3b82f6) },
        { id: 1, color: 0x10b981, spawnOffset: { x: -3.0, z: 2.3 }, cells: generateGridCells([[-0.5,-1], [0.5,-1], [-0.5,0], [0.5,0], [-0.5,1], [0.5,1]], 0x10b981) },
        { id: 2, color: 0xef4444, spawnOffset: { x: 3.4, z: -1.6 }, cells: generateGridCells([[1.5,-1], [2.5,-1], [1.5,0], [2.5,0], [2.5,1], [2.0,2]], 0xef4444) },
        { id: 3, color: 0xf59e0b, spawnOffset: { x: 3.0, z: 2.3 }, cells: generateGridCells([[-2.0,-2], [-1.0,-2], [1.0,-2], [2.0,-2]], 0xf59e0b) }
      ]
    },
    star: {
      name: 'Estrela', icon: '⭐',
      pieces: [
        { id: 0, color: 0xfbbf24, spawnOffset: { x: -3.3, z: -1.8 }, cells: generateGridCells([[0,-2.2], [-0.6,-1.2], [0.6,-1.2], [0,-0.2]], 0xfbbf24) },
        { id: 1, color: 0xf43f5e, spawnOffset: { x: -3.3, z: 2.0 }, cells: generateGridCells([[-2.4,-0.5], [-1.4,-0.5], [-1.8,0.5], [-1.0,0.4]], 0xf43f5e) },
        { id: 2, color: 0xa855f7, spawnOffset: { x: 3.3, z: -1.8 }, cells: generateGridCells([[1.4,-0.5], [2.4,-0.5], [1.0,0.4], [1.8,0.5]], 0xa855f7) },
        { id: 3, color: 0x06b6d4, spawnOffset: { x: 3.3, z: 2.0 }, cells: generateGridCells([[-1.4,1.6], [-0.5,1.2], [0.5,1.2], [1.4,1.6], [0,2.1]], 0x06b6d4) }
      ]
    },
    apple: {
      name: 'Maçã', icon: '🍎',
      pieces: [
        { id: 0, color: 0x22c55e, spawnOffset: { x: 0, z: -3.4 }, cells: generateGridCells([[0,-2.5], [1,-2.5], [0,-1.5]], 0x22c55e) },
        { id: 1, color: 0xef4444, spawnOffset: { x: -3.4, z: -1.2 }, cells: generateGridCells([[-2,-1], [-1,-1], [-2,0], [-1,0], [-2,1], [-1,1]], 0xef4444) },
        { id: 2, color: 0xf43f5e, spawnOffset: { x: 3.4, z: -1.2 }, cells: generateGridCells([[1,-1], [2,-1], [1,0], [2,0], [1,1], [2,1]], 0xf43f5e) },
        { id: 3, color: 0xdc2626, spawnOffset: { x: 0, z: 3.2 }, cells: generateGridCells([[0,-0.5], [0,0.5], [-1,2], [0,2], [1,2]], 0xdc2626) }
      ]
    },
    pineapple: {
      name: 'Abacaxi', icon: '🍍',
      pieces: [
        { id: 0, color: 0x10b981, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[0,-3], [-1,-2], [0,-2], [1,-2]], 0x10b981) },
        { id: 1, color: 0xfacc15, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[-1.5,-1], [-0.5,-1], [0.5,-1], [1.5,-1]], 0xfacc15) },
        { id: 2, color: 0xf59e0b, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-1.5,0], [-0.5,0], [0.5,0], [1.5,0], [-1.5,1], [-0.5,1], [0.5,1], [1.5,1]], 0xf59e0b) },
        { id: 3, color: 0xeab308, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-1,2], [0,2], [1,2]], 0xeab308) }
      ]
    },
    strawberry: {
      name: 'Morango', icon: '🍓',
      pieces: [
        { id: 0, color: 0x16a34a, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[-1.5,-2], [-0.5,-2], [0.5,-2], [1.5,-2], [0,-2.8]], 0x16a34a) },
        { id: 1, color: 0xf43f5e, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[-2,-1], [-1,-1], [0,-1], [1,-1], [2,-1]], 0xf43f5e) },
        { id: 2, color: 0xe11d48, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-1.5,0], [-0.5,0], [0.5,0], [1.5,0]], 0xe11d48) },
        { id: 3, color: 0xbe123c, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-1,1], [0,1], [1,1], [0,2]], 0xbe123c) }
      ]
    },
    butterfly: {
      name: 'Borboleta', icon: '🦋',
      pieces: [
        { id: 0, color: 0x6366f1, spawnOffset: { x: 0, z: -3.4 }, cells: generateGridCells([[0,-2], [0,-1], [0,0], [0,1], [0,2]], 0x6366f1) },
        { id: 1, color: 0xec4899, spawnOffset: { x: -3.4, z: -1.6 }, cells: generateGridCells([[-2.5,-2], [-1.5,-2], [-2.5,-1], [-1.5,-1], [-1.5,0]], 0xec4899) },
        { id: 2, color: 0xd946ef, spawnOffset: { x: 3.4, z: -1.6 }, cells: generateGridCells([[1.5,-2], [2.5,-2], [1.5,-1], [2.5,-1], [1.5,0]], 0xd946ef) },
        { id: 3, color: 0x06b6d4, spawnOffset: { x: -3.2, z: 2.2 }, cells: generateGridCells([[-2,1], [-1,1], [-1.5,2]], 0x06b6d4) },
        { id: 4, color: 0x3b82f6, spawnOffset: { x: 3.2, z: 2.2 }, cells: generateGridCells([[1,1], [2,1], [1.5,2]], 0x3b82f6) }
      ]
    },
    cat: {
      name: 'Gatinho', icon: '🐱',
      pieces: [
        { id: 0, color: 0xf97316, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[-2,-2.2], [-1.5,-1.2], [-2,-0.2]], 0xf97316) },
        { id: 1, color: 0xfb923c, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[2,-2.2], [1.5,-1.2], [2,-0.2]], 0xfb923c) },
        { id: 2, color: 0xfbbf24, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-0.5,-1], [0.5,-1], [-1,0], [0,0], [1,0]], 0xfbbf24) },
        { id: 3, color: 0xf59e0b, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-1.5,1], [-0.5,1], [0.5,1], [1.5,1], [-0.5,2], [0.5,2]], 0xf59e0b) }
      ]
    },
    fish: {
      name: 'Peixinho', icon: '🐠',
      pieces: [
        { id: 0, color: 0x06b6d4, spawnOffset: { x: -3.3, z: -1.8 }, cells: generateGridCells([[-2.5,0], [-1.5,-1], [-1.5,0], [-1.5,1]], 0x06b6d4) },
        { id: 1, color: 0x3b82f6, spawnOffset: { x: -3.3, z: 2.0 }, cells: generateGridCells([[-0.5,-1.5], [-0.5,-0.5], [-0.5,0.5], [-0.5,1.5]], 0x3b82f6) },
        { id: 2, color: 0xf97316, spawnOffset: { x: 3.3, z: -1.8 }, cells: generateGridCells([[0.5,-1], [0.5,0], [0.5,1], [1.5,0]], 0xf97316) },
        { id: 3, color: 0xec4899, spawnOffset: { x: 3.3, z: 2.0 }, cells: generateGridCells([[2.5,-1], [2.5,0], [2.5,1], [3.3,-1.5], [3.3,1.5]], 0xec4899) }
      ]
    },
    duck: {
      name: 'Patinho', icon: '🦆',
      pieces: [
        { id: 0, color: 0xfacc15, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[-1,-2], [0,-2], [-1,-1], [0,-1]], 0xfacc15) },
        { id: 1, color: 0xf97316, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-2.2,-1.2], [-2.2,-0.5]], 0xf97316) },
        { id: 2, color: 0xeab308, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[-1,0], [0,0], [1,0], [2,0]], 0xeab308) },
        { id: 3, color: 0xfde047, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-1.5,1], [-0.5,1], [0.5,1], [1.5,1], [-0.5,2], [0.5,2]], 0xfde047) }
      ]
    },
    icecream: {
      name: 'Sorvete', icon: '🍦',
      pieces: [
        { id: 0, color: 0xf43f5e, spawnOffset: { x: 0, z: -3.4 }, cells: generateGridCells([[0,-2.6], [-1,-1.6], [0,-1.6], [1,-1.6]], 0xf43f5e) },
        { id: 1, color: 0x38bdf8, spawnOffset: { x: -3.3, z: -1.4 }, cells: generateGridCells([[-1.5,-0.6], [-0.5,-0.6], [0.5,-0.6], [1.5,-0.6]], 0x38bdf8) },
        { id: 2, color: 0xfbbf24, spawnOffset: { x: 3.3, z: -1.4 }, cells: generateGridCells([[-1,0.5], [0,0.5], [1,0.5]], 0xfbbf24) },
        { id: 3, color: 0xd97706, spawnOffset: { x: 0, z: 3.2 }, cells: generateGridCells([[-0.5,1.5], [0.5,1.5], [0,2.5]], 0xd97706) }
      ]
    },
    rocket: {
      name: 'Foguete', icon: '🚀',
      pieces: [
        { id: 0, color: 0xef4444, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[0,-2.5], [-0.8,-1.5], [0,-1.5], [0.8,-1.5]], 0xef4444) },
        { id: 1, color: 0x3b82f6, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[-0.8,-0.5], [0,-0.5], [0.8,-0.5], [-0.8,0.5], [0,0.5], [0.8,0.5]], 0x3b82f6) },
        { id: 2, color: 0xa855f7, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-1.8,1.2], [-1.8,2.2], [1.8,1.2], [1.8,2.2]], 0xa855f7) },
        { id: 3, color: 0xf97316, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-0.6,1.6], [0.6,1.6], [0,2.5]], 0xf97316) }
      ]
    },
    car: {
      name: 'Carrinho', icon: '🚗',
      pieces: [
        { id: 0, color: 0x38bdf8, spawnOffset: { x: -3.2, z: -2.0 }, cells: generateGridCells([[-1,-1.5], [0,-1.5], [1,-1.5]], 0x38bdf8) },
        { id: 1, color: 0xef4444, spawnOffset: { x: 3.2, z: -2.0 }, cells: generateGridCells([[-2,-0.5], [-1,-0.5], [0,-0.5], [1,-0.5], [2,-0.5]], 0xef4444) },
        { id: 2, color: 0xdc2626, spawnOffset: { x: -3.2, z: 2.0 }, cells: generateGridCells([[-2,0.5], [-1,0.5], [0,0.5], [1,0.5], [2,0.5]], 0xdc2626) },
        { id: 3, color: 0x475569, spawnOffset: { x: 3.2, z: 2.0 }, cells: generateGridCells([[-1.5,1.6], [-0.8,1.6], [0.8,1.6], [1.5,1.6]], 0x475569) }
      ]
    }
  };

  return {
    SPACING,
    MODELS,
    MODEL_KEYS: Object.keys(MODELS)
  };
})();
