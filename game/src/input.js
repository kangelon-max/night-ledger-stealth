'use strict';
/* input.js — keyboard state: what is held, and what was pressed this frame. */
window.NL = window.NL || {};

NL.Input = (() => {
  const down = new Set();
  const pressed = new Set();
  const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];

  addEventListener('keydown', (e) => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    down.add(e.code);
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  return {
    isDown: (...codes) => codes.some((c) => down.has(c)),
    wasPressed: (...codes) => codes.some((c) => pressed.has(c)),
    endFrame: () => pressed.clear(),
  };
})();
