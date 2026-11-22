'use strict';
/* main.js — boot, the game loop, and the state machine:
   title -> play -> (caught -> play) / (clear -> next floor) -> win.
   A ?shot=1..4 URL parameter stages one composed, frozen scene instead,
   so screenshots of the game are rendered by the game's own code. */
window.NL = window.NL || {};

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const input = NL.Input;

  const S = {
    mode: 'title',
    modeT: 0,
    levelIndex: 0,
    level: null,
    solids: [],
    player: null,
    guards: [],
    intels: [],
    intelCount: 0,
    detection: 0,
    timeSec: 0,
    caughtCount: 0,
    elapsed: 0,
    shotMode: false,
  };

  function loadLevel(index) {
    const level = NL.LEVELS[index];
    S.levelIndex = index;
    S.level = level;
    S.solids = NL.solidsOf(level);
    S.player = new NL.Player(level.playerStart.x, level.playerStart.y);
    S.guards = level.guards.map((def) => new NL.Guard(def));
    S.intels = level.intels.map((p) => ({ x: p.x, y: p.y, taken: false }));
    S.intelCount = 0;
    S.detection = 0;
  }

  function startRun() {
    S.caughtCount = 0;
    S.timeSec = 0;
    loadLevel(0);
    S.mode = 'play';
    S.modeT = 0;
    NL.Audio.ensure();
  }

  function onCaught() {
    S.caughtCount += 1;
    S.mode = 'caught';
    S.modeT = 0;
    NL.Audio.caught();
  }

  function update(dt) {
    S.elapsed += dt;
    S.modeT += dt;
    if (S.mode === 'title') {
      if (input.wasPressed('Enter', 'Space')) startRun();
      return;
    }
    if (S.mode === 'caught') {
      if (S.modeT > 1.5) { loadLevel(S.levelIndex); S.mode = 'play'; S.modeT = 0; }
      return;
    }
    if (S.mode === 'clear') {
      if (S.modeT > 1.6) { loadLevel(S.levelIndex + 1); S.mode = 'play'; S.modeT = 0; }
      return;
    }
    if (S.mode === 'win') {
      if (input.wasPressed('Enter', 'Space')) { S.mode = 'title'; loadLevel(0); }
      return;
    }
    /* play */
    S.timeSec += dt;
    if (input.wasPressed('KeyR')) { loadLevel(S.levelIndex); return; }
    if (input.wasPressed('KeyM')) NL.Audio.toggleMute();
    S.player.update(dt, input, S.solids);

    let worst = 0;
    for (const guard of S.guards) {
      if (guard.update(dt, S.player, S.solids, S.elapsed) === 'caught') { onCaught(); return; }
      if (guard.detection > worst) worst = guard.detection;
    }
    S.detection = worst;

    for (const intel of S.intels) {
      if (!intel.taken && Math.hypot(intel.x - S.player.x, intel.y - S.player.y) < 27) {
        intel.taken = true;
        S.intelCount += 1;
        NL.Audio.pickup();
      }
    }

    const e = S.level.exit;
    const inExit = S.player.x > e.x && S.player.x < e.x + e.w && S.player.y > e.y && S.player.y < e.y + e.h;
    if (inExit && S.intelCount >= S.intels.length) {
      if (S.levelIndex >= NL.LEVELS.length - 1) {
        S.mode = 'win';
        S.modeT = 0;
        NL.Audio.win();
      } else {
        S.mode = 'clear';
        S.modeT = 0;
        NL.Audio.clear();
      }
    }
  }

  /* ---- staged scenes for screenshots (frozen, deterministic) ---- */
  function stageShot(n) {
    S.shotMode = true;
    if (n === 4) {
      loadLevel(0);
      S.guards[0].place(500, 150, 0.5);
      S.guards[1].place(1060, 300, -2.2);
      S.mode = 'title';
      return;
    }
    S.mode = 'play';
    if (n === 1) {
      loadLevel(0);
      S.player.x = 430; S.player.y = 470; S.player.facing = -0.6;
      S.guards[0].place(500, 150, 0.5);
      S.guards[1].place(1060, 300, -2.2);
    } else if (n === 2) {
      loadLevel(0);
      S.player.x = 488; S.player.y = 142; S.player.crouched = true; S.player.facing = 0;
      S.guards[0].place(668, 142, Math.PI);
      S.guards[0].detection = 0.55;
      S.guards[1].place(1060, 300, -2.2);
      S.detection = 0.55;
    } else if (n === 3) {
      loadLevel(2);
      for (const intel of S.intels) intel.taken = true;
      S.intelCount = 3;
      S.player.x = 1090; S.player.y = 73; S.player.facing = 0.4;
      S.guards[0].place(300, 270, 0.8);
      S.guards[1].place(960, 235, 2.6);
      S.guards[2].place(340, 610, -0.4);
      S.guards[3].place(930, 700, 3.0);
      S.timeSec = 187;
      S.caughtCount = 2;
    }
    S.elapsed = 1.25;
  }

  const shotParam = new URLSearchParams(location.search).get('shot');
  if (shotParam) {
    stageShot(parseInt(shotParam, 10) || 1);
    /* Frame the canvas exactly: no page chrome in the shot. */
    document.querySelector('main').style.padding = '0';
    document.body.style.overflow = 'hidden';
    canvas.style.width = '1280px';
    canvas.style.border = 'none';
    canvas.style.borderRadius = '0';
    canvas.style.boxShadow = 'none';
    NL.Render.draw(ctx, S);
    document.body.dataset.ready = '1';
    return;
  }

  loadLevel(0);
  S.guards[0].place(500, 150, 0.5);
  S.guards[1].place(1060, 300, -2.2);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    NL.Render.draw(ctx, S);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
