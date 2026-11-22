'use strict';
/* level.js — the three floors of the NIGHT LEDGER complex.
   Coordinates are pixels on a 1280x800 field. Walls and crates are solid
   rectangles: they block movement and they block guard vision. */
window.NL = window.NL || {};

NL.WORLD = { w: 1280, h: 800, border: 24 };

function rect(x, y, w, h) { return { x, y, w, h }; }

NL.LEVELS = [
  {
    name: 'FLOOR 1 — LOBBY OF LEDGERS',
    playerStart: { x: 70, y: 700 },
    exit: rect(1180, 60, 64, 64),
    intels: [
      { x: 180, y: 120 },
      { x: 700, y: 700 },
      { x: 1150, y: 420 },
    ],
    walls: [
      rect(320, 24, 24, 280), rect(320, 420, 24, 200),
      rect(640, 180, 24, 360),
      rect(900, 24, 24, 240), rect(900, 380, 24, 260),
      rect(120, 560, 340, 24),
      rect(760, 600, 300, 24),
    ],
    crates: [
      rect(200, 200, 44, 44), rect(520, 120, 44, 44), rect(520, 164, 44, 44),
      rect(760, 300, 44, 44), rect(1080, 180, 44, 44), rect(420, 660, 44, 44),
      rect(1020, 520, 44, 44), rect(240, 420, 44, 44),
    ],
    guards: [
      { path: [[420, 140], [560, 140], [560, 300], [420, 300]], speed: 66 },
      { path: [[980, 120], [980, 320], [1140, 320], [1140, 120]], speed: 74 },
    ],
  },
  {
    name: 'FLOOR 2 — RECORDS VAULT',
    playerStart: { x: 70, y: 70 },
    exit: rect(1180, 690, 64, 64),
    intels: [
      { x: 1160, y: 90 },
      { x: 120, y: 720 },
      { x: 640, y: 420 },
    ],
    walls: [
      rect(200, 150, 420, 24), rect(200, 150, 24, 300),
      rect(660, 80, 24, 320),
      rect(880, 300, 376, 24),
      rect(420, 480, 24, 220),
      rect(700, 560, 340, 24),
      rect(1020, 120, 24, 180),
    ],
    crates: [
      rect(300, 300, 44, 44), rect(344, 300, 44, 44), rect(520, 640, 44, 44),
      rect(940, 480, 44, 44), rect(1120, 640, 44, 44), rect(140, 620, 44, 44),
      rect(760, 200, 44, 44), rect(1080, 420, 44, 44),
    ],
    guards: [
      { path: [[280, 80], [580, 80]], speed: 84 },
      { path: [[740, 470], [1100, 470]], speed: 78 },
      { path: [[140, 300], [140, 520]], speed: 70 },
    ],
  },
  {
    name: 'FLOOR 3 — THE VAULT FLOOR',
    playerStart: { x: 70, y: 720 },
    exit: rect(1170, 40, 66, 66),
    intels: [
      { x: 90, y: 90 },
      { x: 700, y: 720 },
      { x: 1180, y: 420 },
    ],
    walls: [
      rect(160, 120, 24, 420), rect(160, 120, 380, 24),
      rect(540, 120, 24, 200),
      rect(820, 80, 24, 300),
      rect(340, 420, 420, 24),
      rect(980, 480, 24, 220),
      rect(640, 620, 300, 24),
      rect(1060, 200, 196, 24),
    ],
    crates: [
      rect(260, 240, 44, 44), rect(700, 240, 44, 44), rect(440, 560, 44, 44),
      rect(560, 690, 44, 44), rect(1140, 560, 44, 44), rect(80, 360, 44, 44),
      rect(620, 460, 44, 44), rect(240, 640, 44, 44),
    ],
    guards: [
      { path: [[240, 200], [460, 200], [460, 340], [240, 340]], speed: 76 },
      { path: [[900, 140], [1020, 140], [1020, 330], [900, 330]], speed: 82 },
      { path: [[460, 520], [460, 700], [220, 700], [220, 520]], speed: 72 },
      { path: [[1100, 700], [780, 700]], speed: 90 },
    ],
  },
];

/* The outer walls of the complex, shared by every floor. */
NL.borderWalls = () => {
  const b = NL.WORLD.border;
  const { w, h } = NL.WORLD;
  return [
    rect(0, 0, w, b), rect(0, h - b, w, b),
    rect(0, 0, b, h), rect(w - b, 0, b, h),
  ];
};

/* Everything solid on a floor: borders, walls, crates. */
NL.solidsOf = (level) => NL.borderWalls().concat(level.walls, level.crates);
