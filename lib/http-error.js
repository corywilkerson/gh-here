/** An Error carrying the HTTP status the server should answer with. */
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

module.exports = { httpError };
