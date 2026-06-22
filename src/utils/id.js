/* ============================================
   UTILS — ID Generator
   ============================================ */
function nanoid() {
  // Use crypto.getRandomValues for better randomness than Math.random()
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for non-browser environments
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

module.exports = { nanoid };
