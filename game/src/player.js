'use strict';
/* player.js — the infiltrator: WASD / arrow movement, crouch on Shift or
   Ctrl (slower, quieter, harder to spot), circle collision against solids. */
window.NL = window.NL || {};

NL.Player = class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.facing = -Math.PI / 2;
    this.crouched = false;
    this.moving = false;
    this.stepT = 0;
  }

  update(dt, input, solids) {
    let mx = 0;
    let my = 0;
    if (input.isDown('KeyA', 'ArrowLeft')) mx -= 1;
    if (input.isDown('KeyD', 'ArrowRight')) mx += 1;
    if (input.isDown('KeyW', 'ArrowUp')) my -= 1;
    if (input.isDown('KeyS', 'ArrowDown')) my += 1;
    this.crouched = input.isDown('ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight');
    this.moving = mx !== 0 || my !== 0;
    if (!this.moving) return;

    const len = Math.hypot(mx, my);
    const speed = this.crouched ? 74 : 152;
    const vx = (mx / len) * speed * dt;
    const vy = (my / len) * speed * dt;
    this.facing = Math.atan2(my, mx);

    this.x = collideAxis(this.x + vx, this.y, this.radius, solids, 'x');
    this.y = collideAxis(this.x, this.y + vy, this.radius, solids, 'y');

    this.stepT -= dt;
    if (this.stepT <= 0) {
      NL.Audio.footstep(this.crouched);
      this.stepT = this.crouched ? 0.52 : 0.34;
    }
  }
};

/* Move along one axis, then push the circle out of any solid it overlaps. */
function collideAxis(x, y, radius, solids, axis) {
  for (const r of solids) {
    const nearX = Math.max(r.x, Math.min(x, r.x + r.w));
    const nearY = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < radius * radius) {
      if (axis === 'x') x = x < r.x + r.w / 2 ? r.x - radius : r.x + r.w + radius;
      else y = y < r.y + r.h / 2 ? r.y - radius : r.y + r.h + radius;
    }
  }
  return axis === 'x' ? x : y;
}
