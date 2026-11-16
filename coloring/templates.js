// Estúdio de Desenho & Colorir Kids - Moldes Vetoriais Fechados (900x680)
window.ColoringTemplates = (() => {
  const BASE_W = 900;
  const BASE_H = 680;

  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }

  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }

  function drawSun(ctx, x, y, r = 48) {
    circle(ctx, x, y, r);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r + 12), y + Math.sin(a) * (r + 12));
      ctx.lineTo(x + Math.cos(a) * (r + 30), y + Math.sin(a) * (r + 30));
      ctx.stroke();
    }
  }

  function drawCloud(ctx, x, y, s = 1) {
    ctx.beginPath();
    ctx.moveTo(x - 65 * s, y + 25 * s);
    ctx.arc(x - 45 * s, y + 5 * s, 28 * s, Math.PI * 0.7, Math.PI * 1.75);
    ctx.arc(x, y - 10 * s, 36 * s, Math.PI * 1.05, Math.PI * 1.95);
    ctx.arc(x + 48 * s, y + 5 * s, 28 * s, Math.PI * 1.25, Math.PI * 0.35);
    ctx.quadraticCurveTo(x, y + 32 * s, x - 65 * s, y + 25 * s);
    ctx.closePath();
    ctx.stroke();
  }

  function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.stroke();
  }

  const TEMPLATES = [
    {
      id: 'blank',
      name: 'Folha Livre',
      icon: '📄',
      draw: () => {}
    },
    {
      id: 'unicorn',
      name: 'Unicórnio',
      icon: '🦄',
      draw: (ctx) => {
        drawCloud(ctx, 165, 130, 1.05);
        drawCloud(ctx, 735, 150, 0.95);
        drawStar(ctx, 180, 500, 5, 36, 16);
        drawStar(ctx, 740, 490, 5, 36, 16);

        // Pescoço e Corpo
        ctx.beginPath();
        ctx.moveTo(350, 355);
        ctx.quadraticCurveTo(320, 480, 315, 595);
        ctx.lineTo(545, 595);
        ctx.quadraticCurveTo(535, 475, 495, 365);
        ctx.closePath();
        ctx.stroke();

        // Crina (3 mechas coloríveis!)
        [
          [515, 255, 625, 290, 560, 345],
          [525, 325, 645, 375, 545, 415],
          [530, 405, 635, 465, 535, 495]
        ].forEach(([sx, sy, mx, my, ex, ey]) => {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.quadraticCurveTo(sx - 10, my, sx, sy);
          ctx.closePath();
          ctx.stroke();
        });

        // Chifre listrado
        ctx.beginPath();
        ctx.moveTo(415, 195);
        ctx.lineTo(445, 75);
        ctx.lineTo(485, 195);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(426, 155);
        ctx.lineTo(474, 155);
        ctx.moveTo(435, 120);
        ctx.lineTo(465, 120);
        ctx.stroke();

        // Orelha
        ctx.beginPath();
        ctx.moveTo(490, 195);
        ctx.quadraticCurveTo(555, 115, 540, 225);
        ctx.closePath();
        ctx.stroke();

        // Cabeça + Focinho
        ellipse(ctx, 415, 290, 130, 105, -0.15);
        ctx.beginPath();
        ctx.moveTo(305, 265);
        ctx.quadraticCurveTo(345, 325, 330, 378);
        ctx.stroke();

        // Olho fofo + Narina + Sorriso
        circle(ctx, 430, 275, 22);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(426, 276, 10, 0, Math.PI * 2);
        ctx.fill();
        circle(ctx, 315, 315, 8);
        ctx.beginPath();
        ctx.arc(340, 342, 16, 0.2, Math.PI * 0.8);
        ctx.stroke();
      }
    },
    {
      id: 'dino',
      name: 'Dinossauro',
      icon: '🦕',
      draw: (ctx) => {
        drawSun(ctx, 130, 115, 42);
        drawCloud(ctx, 725, 120, 1.0);

        // Chão
        ctx.beginPath();
        ctx.moveTo(50, 585);
        ctx.lineTo(850, 585);
        ctx.stroke();

        // Placas nas costas (triângulos separados para colorir)
        [[375, 285, 415, 225, 450, 295], [455, 295, 505, 240, 535, 315], [535, 320, 595, 275, 605, 355]].forEach(pts => {
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          ctx.lineTo(pts[2], pts[3]);
          ctx.lineTo(pts[4], pts[5]);
          ctx.closePath();
          ctx.stroke();
        });

        // Corpo, pescoço, cabeça e cauda
        ctx.beginPath();
        ctx.moveTo(270, 585);
        ctx.lineTo(270, 440);
        ctx.quadraticCurveTo(255, 260, 215, 215);
        ctx.arc(265, 195, 65, Math.PI * 0.85, Math.PI * 2.15);
        ctx.quadraticCurveTo(320, 295, 365, 300);
        ctx.quadraticCurveTo(540, 280, 625, 395);
        ctx.quadraticCurveTo(735, 455, 800, 405);
        ctx.quadraticCurveTo(750, 515, 595, 515);
        ctx.lineTo(595, 585);
        ctx.lineTo(510, 585);
        ctx.lineTo(510, 515);
        ctx.lineTo(355, 515);
        ctx.lineTo(355, 585);
        ctx.closePath();
        ctx.stroke();

        // Barriga e manchas
        ctx.beginPath();
        ctx.moveTo(315, 465);
        ctx.quadraticCurveTo(435, 425, 535, 485);
        ctx.stroke();
        circle(ctx, 435, 365, 28);
        circle(ctx, 515, 395, 22);

        // Olho e sorriso
        circle(ctx, 255, 175, 16);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(252, 176, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(235, 212, 22, 0.15, Math.PI * 0.75);
        ctx.stroke();
      }
    },
    {
      id: 'rocket',
      name: 'Foguete',
      icon: '🚀',
      draw: (ctx) => {
        drawStar(ctx, 160, 150, 5, 38, 17);
        drawStar(ctx, 735, 140, 5, 34, 15);
        drawStar(ctx, 185, 515, 5, 32, 14);

        // Planeta com anel
        circle(ctx, 725, 430, 58);
        ellipse(ctx, 725, 430, 96, 22, -0.25);

        // Corpo do foguete
        ctx.beginPath();
        ctx.moveTo(450, 85);
        ctx.quadraticCurveTo(565, 215, 540, 445);
        ctx.lineTo(360, 445);
        ctx.quadraticCurveTo(335, 215, 450, 85);
        ctx.closePath();
        ctx.stroke();

        // Divisão do bico
        ctx.beginPath();
        ctx.moveTo(382, 200);
        ctx.quadraticCurveTo(450, 220, 518, 200);
        ctx.stroke();

        // Janela redonda dupla
        circle(ctx, 450, 305, 52);
        circle(ctx, 450, 305, 34);

        // Asas laterais
        ctx.beginPath();
        ctx.moveTo(362, 345);
        ctx.quadraticCurveTo(275, 415, 285, 495);
        ctx.lineTo(368, 445);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(538, 345);
        ctx.quadraticCurveTo(625, 415, 615, 495);
        ctx.lineTo(532, 445);
        ctx.closePath();
        ctx.stroke();

        // Fogo da turbina (2 camadas)
        ctx.beginPath();
        ctx.moveTo(390, 445);
        ctx.quadraticCurveTo(365, 545, 450, 615);
        ctx.quadraticCurveTo(535, 545, 510, 445);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(418, 445);
        ctx.quadraticCurveTo(405, 510, 450, 555);
        ctx.quadraticCurveTo(495, 510, 482, 445);
        ctx.closePath();
        ctx.stroke();
      }
    },
    {
      id: 'castle',
      name: 'Castelo',
      icon: '🏰',
      draw: (ctx) => {
        drawSun(ctx, 130, 115, 42);
        drawCloud(ctx, 730, 115, 1.0);

        // Base central + Torres laterais + Torre alta central
        ctx.strokeRect(270, 320, 360, 275);
        ctx.strokeRect(160, 250, 110, 345);
        ctx.strokeRect(630, 250, 110, 345);
        ctx.strokeRect(380, 185, 140, 135);

        // Telhados triangulares
        [
          [145, 250, 215, 130, 285, 250],
          [615, 250, 685, 130, 755, 250],
          [365, 185, 450, 65, 535, 185]
        ].forEach(t => {
          ctx.beginPath();
          ctx.moveTo(t[0], t[1]);
          ctx.lineTo(t[2], t[3]);
          ctx.lineTo(t[4], t[5]);
          ctx.closePath();
          ctx.stroke();
        });

        // Bandeirinhas
        [[215, 130], [450, 65], [685, 130]].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by - 45);
          ctx.lineTo(bx + 42, by - 30);
          ctx.lineTo(bx, by - 15);
          ctx.stroke();
        });

        // Portão grande em arco
        ctx.beginPath();
        ctx.moveTo(395, 595);
        ctx.lineTo(395, 465);
        ctx.arc(450, 465, 55, Math.PI, 0);
        ctx.lineTo(505, 595);
        ctx.closePath();
        ctx.stroke();

        // Janelas
        circle(ctx, 450, 250, 26);
        circle(ctx, 215, 360, 24);
        circle(ctx, 685, 360, 24);
      }
    },
    {
      id: 'butterfly',
      name: 'Borboleta',
      icon: '🦋',
      draw: (ctx) => {
        drawCloud(ctx, 160, 110, 0.9);
        drawSun(ctx, 760, 115, 42);

        // Corpo e cabeça
        ellipse(ctx, 450, 365, 34, 155);
        circle(ctx, 450, 180, 42);

        // Antenas
        ctx.beginPath();
        ctx.moveTo(432, 145);
        ctx.quadraticCurveTo(385, 70, 350, 95);
        ctx.moveTo(468, 145);
        ctx.quadraticCurveTo(515, 70, 550, 95);
        ctx.stroke();
        circle(ctx, 344, 100, 12);
        circle(ctx, 556, 100, 12);

        // Asas superiores simétricas
        ctx.beginPath();
        ctx.moveTo(418, 265);
        ctx.bezierCurveTo(210, 90, 115, 285, 255, 375);
        ctx.quadraticCurveTo(340, 405, 418, 365);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(482, 265);
        ctx.bezierCurveTo(690, 90, 785, 285, 645, 375);
        ctx.quadraticCurveTo(560, 405, 482, 365);
        ctx.closePath();
        ctx.stroke();

        // Asas inferiores
        ctx.beginPath();
        ctx.moveTo(418, 385);
        ctx.bezierCurveTo(215, 395, 195, 585, 335, 585);
        ctx.quadraticCurveTo(405, 565, 422, 465);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(482, 385);
        ctx.bezierCurveTo(685, 395, 705, 585, 565, 585);
        ctx.quadraticCurveTo(495, 565, 478, 465);
        ctx.closePath();
        ctx.stroke();

        // Detalhes internos nas asas
        circle(ctx, 285, 260, 44);
        circle(ctx, 615, 260, 44);
        circle(ctx, 325, 495, 32);
        circle(ctx, 575, 495, 32);
      }
    },
    {
      id: 'car',
      name: 'Carrinho',
      icon: '🚗',
      draw: (ctx) => {
        drawSun(ctx, 760, 115, 42);
        drawCloud(ctx, 180, 120, 1.0);

        // Estrada
        ctx.beginPath();
        ctx.moveTo(40, 545);
        ctx.lineTo(860, 545);
        ctx.stroke();

        // Capota e Corpo do Carrinho
        ctx.beginPath();
        ctx.moveTo(155, 480);
        ctx.lineTo(155, 370);
        ctx.quadraticCurveTo(175, 335, 250, 335);
        ctx.lineTo(315, 225);
        ctx.lineTo(575, 225);
        ctx.lineTo(645, 335);
        ctx.quadraticCurveTo(735, 345, 745, 395);
        ctx.lineTo(745, 480);
        ctx.closePath();
        ctx.stroke();

        // Janelas
        ctx.beginPath();
        ctx.moveTo(332, 248);
        ctx.lineTo(440, 248);
        ctx.lineTo(440, 335);
        ctx.lineTo(282, 335);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(465, 248);
        ctx.lineTo(562, 248);
        ctx.lineTo(615, 335);
        ctx.lineTo(465, 335);
        ctx.closePath();
        ctx.stroke();

        // Rodas grandes + Calotas
        circle(ctx, 290, 495, 62);
        circle(ctx, 290, 495, 28);
        circle(ctx, 610, 495, 62);
        circle(ctx, 610, 495, 28);

        // Farol
        ellipse(ctx, 725, 395, 20, 26);
      }
    },
    {
      id: 'house',
      name: 'Casinha',
      icon: '🏠',
      draw: (ctx) => {
        drawSun(ctx, 130, 115, 44);
        drawCloud(ctx, 720, 115, 1.05);

        // Gramado
        ctx.beginPath();
        ctx.moveTo(40, 585);
        ctx.lineTo(860, 585);
        ctx.stroke();

        // Chaminé + Telhado + Parede
        ctx.strokeRect(535, 135, 55, 110);
        ctx.strokeRect(250, 305, 400, 280);
        ctx.beginPath();
        ctx.moveTo(210, 305);
        ctx.lineTo(450, 135);
        ctx.lineTo(690, 305);
        ctx.closePath();
        ctx.stroke();

        // Porta + Maçaneta
        ctx.strokeRect(405, 420, 90, 165);
        circle(ctx, 475, 505, 8);

        // Janelas
        ctx.strokeRect(285, 365, 85, 85);
        ctx.beginPath();
        ctx.moveTo(327.5, 365);
        ctx.lineTo(327.5, 450);
        ctx.moveTo(285, 407.5);
        ctx.lineTo(370, 407.5);
        ctx.stroke();

        ctx.strokeRect(530, 365, 85, 85);
        ctx.beginPath();
        ctx.moveTo(572.5, 365);
        ctx.lineTo(572.5, 450);
        ctx.moveTo(530, 407.5);
        ctx.lineTo(615, 407.5);
        ctx.stroke();

        // Florzinha no jardim
        ctx.beginPath();
        ctx.moveTo(155, 585);
        ctx.lineTo(155, 470);
        ctx.stroke();
        circle(ctx, 155, 445, 22);
        [0, 1, 2, 3, 4].forEach(k => {
          const a = (k * Math.PI * 2) / 5;
          circle(ctx, 155 + Math.cos(a) * 32, 445 + Math.sin(a) * 32, 16);
        });
      }
    },
    {
      id: 'fish',
      name: 'Peixinho',
      icon: '🐠',
      draw: (ctx) => {
        // Bolhas de ar
        circle(ctx, 195, 235, 24);
        circle(ctx, 155, 165, 18);
        circle(ctx, 215, 110, 14);

        // Algas marinhas no fundo
        ctx.beginPath();
        ctx.moveTo(120, 620);
        ctx.quadraticCurveTo(90, 505, 145, 420);
        ctx.quadraticCurveTo(175, 515, 155, 620);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(770, 620);
        ctx.quadraticCurveTo(735, 495, 795, 395);
        ctx.quadraticCurveTo(830, 505, 805, 620);
        ctx.closePath();
        ctx.stroke();

        // Cauda
        ctx.beginPath();
        ctx.moveTo(585, 345);
        ctx.quadraticCurveTo(735, 215, 725, 345);
        ctx.quadraticCurveTo(735, 475, 585, 345);
        ctx.closePath();
        ctx.stroke();

        // Nadadeira superior e inferior
        ctx.beginPath();
        ctx.moveTo(355, 225);
        ctx.quadraticCurveTo(445, 125, 515, 235);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(395, 465);
        ctx.quadraticCurveTo(465, 555, 520, 455);
        ctx.closePath();
        ctx.stroke();

        // Corpo oval do peixinho
        ellipse(ctx, 415, 345, 185, 130);

        // Listras coloríveis no corpo
        ctx.beginPath();
        ctx.moveTo(355, 222);
        ctx.quadraticCurveTo(385, 345, 355, 468);
        ctx.moveTo(455, 218);
        ctx.quadraticCurveTo(485, 345, 455, 472);
        ctx.stroke();

        // Olho e boca
        circle(ctx, 295, 315, 26);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(290, 315, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(250, 365, 24, 0.1, Math.PI * 0.7);
        ctx.stroke();
      }
    }
  ];

  return {
    BASE_W,
    BASE_H,
    TEMPLATES
  };
})();
