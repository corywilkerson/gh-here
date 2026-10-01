const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILE_LINES = 20000;

function classifyBuffer(buffer) {
  if (buffer.length > MAX_FILE_BYTES) return { kind: 'large' };
  if (buffer.includes(0)) return { kind: 'binary' };
  const contents = buffer.toString('utf8');
  if (contents.split('\n').length > MAX_FILE_LINES) return { kind: 'large' };
  return { kind: 'text', contents };
}

module.exports = { MAX_FILE_BYTES, classifyBuffer };
