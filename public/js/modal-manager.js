/**
 * Modal management utilities
 * @module modal-manager
 */

/**
 * Creates a modal overlay with content
 * @param {string} content - HTML content for the modal
 * @param {string} [className=''] - Additional CSS classes
 * @returns {{element: HTMLElement, close: Function}} Modal control object
 */
export function createModal(content, className = '') {
  const modal = document.createElement('div');
  modal.className = `modal-overlay ${className}`;
  modal.innerHTML = content;

  document.body.appendChild(modal);

  return {
    element: modal,
    close: () => modal.remove()
  };
}

/**
 * Shows a confirmation dialog
 * @param {string} message - Message to display
 * @param {string} [confirmText='Confirm'] - Confirm button text
 * @param {string} [cancelText='Cancel'] - Cancel button text
 * @returns {Promise<boolean>} Resolves to true if confirmed
 */
export function showConfirmDialog(message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
          <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', e => {
      if (e.target.matches('[data-action]') || e.target === modal) {
        const confirmed = e.target.dataset?.action === 'confirm';
        modal.remove();
        resolve(confirmed);
      }
    });

    document.body.appendChild(modal);
  });
}
