'use strict';
/* render.js — all canvas drawing: the night floor, vision cones, actors,
   HUD, and the title / caught / cleared / win screens. Nothing here loads
   an asset; every shape is drawn in code. */
window.NL = window.NL || {};

NL.Render = (() => {
  const W = NL.WORLD.w;
  const H = NL.WORLD.h;

  function drawWorld(ctx, S) {
    /* Floor: deep blue carpet with a faint tile grid and panel seams. */
    ctx.fillStyle = '#0d1526';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(90, 130, 210, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 40; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(120, 170, 255, 0.05)';
    ctx.fillRect(24, 24, W - 48, H - 48);

    drawExit(ctx, S);
    for (const intel of S.intels) if (!intel.taken) drawIntel(ctx, intel, S.elapsed);
    for (const crate of S.level.crates) drawCrate(ctx, crate);
    for (const wall of S.level.walls) drawWall(ctx, wall);
    drawBorder(ctx);
    for (const guard of S.guards) drawCone(ctx, guard, S.solids);
    for (const guard of S.guards) drawGuard(ctx, guard);
    drawPlayer(ctx, S.player);

    /* Night vignette. */
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.86);
    vg.addColorStop(0, 'rgba(2, 4, 12, 0)');
    vg.addColorStop(1, 'rgba(2, 4, 12, 0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBorder(ctx) {
    ctx.fillStyle = '#1b2745';
    for (const r of NL.borderWalls()) ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.35)';
    ctx.strokeRect(24.5, 24.5, W - 49, H - 49);
  }

  function drawWall(ctx, r) {
    ctx.fillStyle = '#24335c';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#31487c';
    ctx.fillRect(r.x, r.y, r.w, Math.min(5, r.h));
    ctx.fillRect(r.x, r.y, Math.min(5, r.w), r.h);
    ctx.strokeStyle = 'rgba(10, 14, 26, 0.65)';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }

  function drawCrate(ctx, r) {
    ctx.fillStyle = '#6d4c26';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#7d5a2f';
    ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    ctx.strokeStyle = '#4a3319';
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.beginPath();
    ctx.moveTo(r.x + 3, r.y + 3);
    ctx.lineTo(r.x + r.w - 3, r.y + r.h - 3);
    ctx.moveTo(r.x + r.w - 3, r.y + 3);
    ctx.lineTo(r.x + 3, r.y + r.h - 3);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawExit(ctx, S) {
    const e = S.level.exit;
    const open = S.intelCount >= S.intels.length;
    ctx.fillStyle = open ? 'rgba(46, 204, 130, 0.28)' : 'rgba(210, 60, 70, 0.16)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = open ? '#2ecc82' : '#8c3a44';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = open ? '#5ff0a8' : '#c96a72';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 - 2);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(open ? 'OPEN' : 'LOCKED', e.x + e.w / 2, e.y + e.h / 2 + 13);
    ctx.lineWidth = 1;
  }

  function drawIntel(ctx, intel, elapsed) {
    const pulse = 3 + Math.sin(elapsed * 3 + intel.x) * 1.6;
    ctx.strokeStyle = 'rgba(255, 205, 80, 0.5)';
    ctx.beginPath();
    ctx.arc(intel.x, intel.y, 15 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    /* A little gold folder. */
    ctx.fillStyle = '#e8b93c';
    ctx.fillRect(intel.x - 11, intel.y - 7, 22, 15);
    ctx.fillStyle = '#c9972a';
    ctx.fillRect(intel.x - 11, intel.y - 10, 10, 4);
    ctx.fillStyle = '#7a5a10';
    ctx.fillRect(intel.x - 11, intel.y - 2, 22, 2);
  }

  function drawCone(ctx, guard, solids) {
    const steps = 26;
    const start = guard.facing - guard.halfAngle;
    const span = guard.halfAngle * 2;
    const hot = guard.detection > 0.3;
    const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, guard.range);
    grad.addColorStop(0, hot ? 'rgba(255, 120, 70, 0.40)' : 'rgba(255, 216, 110, 0.34)');
    grad.addColorStop(1, hot ? 'rgba(255, 90, 60, 0.03)' : 'rgba(255, 216, 110, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    for (let i = 0; i <= steps; i++) {
      const a = start + (span * i) / steps;
      const d = NL.geom.rayDist(guard.x, guard.y, a, solids, guard.range);
      ctx.lineTo(guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawGuard(ctx, guard) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 4, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = guard.detection > 0.3 ? '#7d2a35' : '#3a4666';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#131a2c';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Cap brim toward facing. */
    const fx = Math.cos(guard.facing);
    const fy = Math.sin(guard.facing);
    ctx.strokeStyle = '#0e1424';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(guard.x + fx * 6, guard.y + fy * 6);
    ctx.lineTo(guard.x + fx * 17, guard.y + fy * 17);
    ctx.stroke();
    ctx.lineWidth = 1;
    if (guard.detection > 0.02) {
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = guard.detection > 0.75 ? '#ff5348' : '#ffc44d';
      ctx.fillText(guard.detection > 0.75 ? '!' : '?', guard.x, guard.y - 22);
    }
  }

  function drawPlayer(ctx, p) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.crouched) {
      ctx.strokeStyle = 'rgba(110, 240, 200, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#159a7c';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.crouched ? p.radius - 2 : p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06382c';
    ctx.lineWidth = 2;
    ctx.stroke();
    const fx = Math.cos(p.facing);
    const fy = Math.sin(p.facing);
    ctx.strokeStyle = '#d8fff4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + fx * 4, p.y + fy * 4);
    ctx.lineTo(p.x + fx * 13, p.y + fy * 13);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function drawHUD(ctx, S) {
    ctx.fillStyle = 'rgba(4, 8, 18, 0.72)';
    ctx.fillRect(0, 0, W, 46);
    ctx.strokeStyle = 'rgba(120, 170, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 46.5);
    ctx.lineTo(W, 46.5);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#cfe1ff';
    ctx.fillText(S.level.name, 38, 29);

    /* The eye: how seen you are, worst guard wins. */
    const cx = W / 2 - 110;
    ctx.strokeStyle = '#9db8e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx + 16, 23, 15, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    const d = S.detection;
    ctx.fillStyle = d > 0.75 ? '#ff5348' : d > 0.35 ? '#ffc44d' : '#59d98c';
    ctx.beginPath();
    ctx.arc(cx + 16, 23, 3 + d * 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(cx + 44, 17, 190, 12);
    ctx.fillStyle = d > 0.75 ? '#ff5348' : d > 0.35 ? '#ffc44d' : '#59d98c';
    ctx.fillRect(cx + 44, 17, 190 * d, 12);
    ctx.lineWidth = 1;

    ctx.textAlign = 'right';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#ffd873';
    ctx.fillText(`INTEL ${S.intelCount}/${S.intels.length}`, W - 300, 29);
    ctx.fillStyle = '#cfe1ff';
    ctx.fillText(`TIME ${fmtTime(S.timeSec)}`, W - 168, 29);
    ctx.fillStyle = '#ff9d94';
    ctx.fillText(`CAUGHT ${S.caughtCount}`, W - 38, 29);
    ctx.textAlign = 'left';
  }

  function panel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(3, 6, 14, 0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 74px system-ui, sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText(title, W / 2, 268);
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillStyle = '#cfe1ff';
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 330 + i * 32));
    ctx.textAlign = 'left';
  }

  function draw(ctx, S) {
    drawWorld(ctx, S);
    if (S.mode === 'title') {
      panel(ctx, 'NIGHT LEDGER', [
        'Slip through the vault complex after dark.',
        'Lift all 3 intel folders on each floor and reach the exit unseen.',
        '',
        'MOVE  WASD / Arrow keys        CROUCH  Shift or Ctrl (slow, quiet, hard to spot)',
        'Guards see in cones — walls and crates break their line of sight.',
        'Fill a guard\u2019s meter and the alarm takes you.  R restarts a floor, M mutes.',
        '',
        'PRESS ENTER TO INFILTRATE',
      ], '#ffd873');
      return;
    }
    drawHUD(ctx, S);
    if (S.mode === 'play' && S.timeSec < 6 && !S.shotMode) {
      ctx.textAlign = 'center';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(207, 225, 255, 0.85)';
      ctx.fillText('Steal the gold intel folders. Stay out of the light cones.', W / 2, H - 18);
      ctx.textAlign = 'left';
    }
    if (S.mode === 'caught') {
      ctx.fillStyle = `rgba(190, 20, 30, ${0.25 + 0.2 * Math.abs(Math.sin(S.modeT * 9))})`;
      ctx.fillRect(0, 0, W, H);
      panel(ctx, 'SPOTTED', ['The alarm swallows the floor. Back to the shadows…'], '#ff6d64');
    } else if (S.mode === 'clear') {
      panel(ctx, 'FLOOR CLEARED', ['Downstairs, deeper into the ledger…'], '#5ff0a8');
    } else if (S.mode === 'win') {
      panel(ctx, 'LEDGER BALANCED', [
        'Every folder lifted. Nobody saw a thing.',
        '',
        `Total time  ${fmtTime(S.timeSec)}`,
        `Times caught  ${S.caughtCount}`,
        '',
        'PRESS ENTER TO PLAY AGAIN',
      ], '#5ff0a8');
    }
  }

  return { draw };
})();
