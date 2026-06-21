/* ============================================
   UTILS — ID Generator
   ============================================ */
function nanoid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = { nanoid };
