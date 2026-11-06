const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = value => String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
export const button = (text, action, attrs = '') => `<button type="button" data-action="${action}" ${attrs}>${text}</button>`;
export const announce = text => { document.querySelector('#announcement').textContent = text; };
export function onAction(main, callback) {
  main.addEventListener('click', event => {
    const control = event.target.closest('[data-action]');
    if (control && !control.disabled) callback(control.dataset.action, control, event);
  });
}

export function show(main, html) {
  const active = document.activeElement;
  const action = active?.dataset.action;
  const key = active?.dataset.id;
  main.innerHTML = html;
  if (!action) return;
  const replacement = [...main.querySelectorAll('[data-action]')].find(control =>
    control.dataset.action === action && control.dataset.id === key && !control.disabled);
  (replacement ?? main.querySelector('h1'))?.focus({ preventScroll: true });
}


