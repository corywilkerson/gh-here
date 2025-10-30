/**
 * Modal management utilities
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

export function showDraftDialog(filePath) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content draft-modal">
        <h3>Unsaved Changes Found</h3>
        <p>You have unsaved changes for this file. What would you like to do?</p>
        <div class="draft-actions">
          <button class="btn btn-primary" data-action="load">Load Draft</button>
          <button class="btn btn-secondary" data-action="discard">Discard Draft</button>
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', e => {
      if (e.target.matches('[data-action]') || e.target === modal) {
        const action = e.target.dataset?.action || 'cancel';
        modal.remove();
        resolve(action);
      }
    });

    document.body.appendChild(modal);
  });
}

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
