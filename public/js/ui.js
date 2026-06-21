/* ============================================
   UI UTILITIES — DOM helpers, toasts, animations
   ============================================ */

/**
 * Shorthand DOM query.
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Create an element with attributes and children.
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') el.className = val;
    else if (key === 'dataset') Object.assign(el.dataset, val);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
    else if (key === 'innerHTML') el.innerHTML = val;
    else el.setAttribute(key, val);
  }
  for (const child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  }
  return el;
}

/**
 * Show a toast notification.
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = createElement('div', { className: `toast toast--${type}` },
    createElement('span', { className: 'toast__icon' }, icons[type] || 'ℹ'),
    createElement('span', { className: 'toast__message' }, message)
  );
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.25s ease reverse forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/**
 * Get difficulty label and CSS class.
 */
export function difficultyInfo(level) {
  const map = {
    1: { label: 'Easy', cls: 'badge--easy' },
    2: { label: 'Medium', cls: 'badge--medium' },
    3: { label: 'Hard', cls: 'badge--hard' },
  };
  return map[level] || map[1];
}

/**
 * Format a date string.
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Render skeleton placeholders.
 */
export function renderSkeletons(container, count = 4) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.appendChild(createElement('div', { className: 'skeleton skeleton--card', style: `animation-delay: ${i * 0.1}s` }));
  }
}

/**
 * Animate element entry.
 */
export function animateIn(el, delay = 0) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(15px)';
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, delay);
}
