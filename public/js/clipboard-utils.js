/**
 * Clipboard utilities
 */

export async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    showCopySuccess(button);
  } catch (err) {
    fallbackCopy(text, button);
  }
}

function showCopySuccess(button) {
  const originalIcon = button.innerHTML;
  const checkIcon = '<svg class="quick-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>';

  button.innerHTML = checkIcon;
  button.style.color = '#28a745';

  setTimeout(() => {
    button.innerHTML = originalIcon;
    button.style.color = '';
  }, 1000);
}

function fallbackCopy(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (fallbackErr) {
    console.error('Could not copy text: ', fallbackErr);
  }

  document.body.removeChild(textArea);
}
