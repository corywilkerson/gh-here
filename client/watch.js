/**
 * Polls for local changes while the page is visible, so the change count
 * and an open review stay current as files are edited.
 */
import { api } from './lib/api.js';

const INTERVAL = 2000;

/** Calls `onChange` whenever the fingerprint moves on from `initialStamp`. */
export function watchChanges(initialStamp, onChange) {
  let stamp = initialStamp;
  let busy = false;
  setInterval(async () => {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const data = await api('changes');
      if (data.stamp !== stamp) await onChange(data);
      stamp = data.stamp;
    } catch {
      // The server may be restarting; the next tick tries again.
    } finally {
      busy = false;
    }
  }, INTERVAL);
}
