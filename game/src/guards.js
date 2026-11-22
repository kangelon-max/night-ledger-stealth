'use strict';
/* guards.js — patrol AI and vision.
   A guard walks its waypoint loop, pauses at each waypoint to look around,
   and watches a vision cone. Walls and crates block the cone (raycast against
   the solid rectangles). A detection meter fills while the infiltrator is in
   plain sight — about 0.8s up close, slower at range or at the cone's edge,
   slower still against a crouched target — and decays while he is hidden.
   A full meter raises the alarm: caught. */
window.NL = window.NL || {};

const TAU = Math.PI * 2;

function angDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/* Smallest t >= 0 where ray (o + t*d) enters rect r, or Infinity. */
function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
  }
  return tmax >= tmin ? tmin : Infinity;
}

NL.geom = {
  angDiff,
  /* Distance a ray travels before hitting a solid, capped at maxDist. */
  rayDist(x, y, angle, solids, maxDist) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = maxDist;
    for (const r of solids) {
      const t = rayRect(x, y, dx, dy, r);
      if (t < best) best = t;
    }
    return best;
  },
  /* True when the straight line between two points crosses a solid. */
  segBlocked(x1, y1, x2, y2, solids) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return false;
    const ux = dx / dist;
    const uy = dy / dist;
    for (const r of solids) {
      const t = rayRect(x1, y1, ux, uy, r);
      if (t > 0.5 && t < dist - 2) return true;
    }
    return false;
  },
};

NL.Guard = class Guard {
  constructor(def) {
    this.path = def.path;
    this.speed = def.speed || 72;
    this.x = def.path[0][0];
    this.y = def.path[0][1];
    this.wp = 1 % def.path.length;
    this.pauseT = 0;
    this.lookPhase = Math.atan2(
      def.path[this.wp][1] - this.y,
      def.path[this.wp][0] - this.x,
    );
    this.facing = this.lookPhase;
    this.detection = 0;
    this.seesPlayer = false;
    this.wasSuspicious = false;
    this.range = 178;
    this.halfAngle = 0.62;
    this.radius = 14;
  }

  /* Teleport for staged scenes (screenshots); not used in play. */
  place(x, y, facing) {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.lookPhase = facing;
    this.pauseT = 999;
  }

  canSee(player, solids) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return { seen: false, intensity: 0, dist };
    const offAxis = Math.abs(angDiff(Math.atan2(dy, dx), this.facing));
    if (offAxis > this.halfAngle && dist > 30) return { seen: false, intensity: 0, dist };
    if (NL.geom.segBlocked(this.x, this.y, player.x, player.y, solids)) {
      return { seen: false, intensity: 0, dist };
    }
    const rangeFactor = 1 - (dist / this.range) * 0.65;
    const edgeFactor = 1 - (offAxis / this.halfAngle) * 0.45;
    let intensity = rangeFactor * edgeFactor;
    if (player.crouched) intensity *= 0.45;
    else if (player.moving) intensity *= 1.15;
    else intensity *= 0.85;
    return { seen: true, intensity, dist };
  }

  /* dt in seconds. Returns 'caught' on the frame the meter fills. */
  update(dt, player, solids, elapsed) {
    const sight = this.canSee(player, solids);
    this.seesPlayer = sight.seen;
    if (sight.seen) {
      this.detection = Math.min(1, this.detection + sight.intensity * dt * 1.45);
    } else {
      this.detection = Math.max(0, this.detection - dt * 0.45);
    }
    if (this.detection >= 1) return 'caught';

    const suspicious = this.detection > 0.3;
    if (suspicious && !this.wasSuspicious) NL.Audio.suspicious();
    this.wasSuspicious = suspicious;

    if (sight.seen || suspicious) {
      /* Stop and stare at the infiltrator. */
      const target = Math.atan2(player.y - this.y, player.x - this.x);
      this.facing += angDiff(target, this.facing) * Math.min(1, dt * 7);
      return null;
    }

    if (this.pauseT > 0) {
      this.pauseT -= dt;
      this.facing = this.lookPhase + Math.sin(elapsed * 1.5 + this.x * 0.01) * 0.7;
      return null;
    }

    const [tx, ty] = this.path[this.wp];
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.wp = (this.wp + 1) % this.path.length;
      const [nx, ny] = this.path[this.wp];
      this.lookPhase = Math.atan2(ny - this.y, nx - this.x);
      this.pauseT = 1.15;
      return null;
    }
    const step = Math.min(dist, this.speed * dt);
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    const moveAngle = Math.atan2(dy, dx);
    this.facing += angDiff(moveAngle, this.facing) * Math.min(1, dt * 10);
    return null;
  }
};
