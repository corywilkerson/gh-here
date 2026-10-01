/** Tiny DOM helpers shared by the shell and views. */

export const $ = (selector) => document.querySelector(selector);

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for HTML templates. Every interpolated value goes through this. */
export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ENTITIES[character]);

let toastTimer;

export function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify('Copied to clipboard');
  } catch {
    notify('Clipboard access is unavailable');
  }
}
