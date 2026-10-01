/** Fetches JSON from the local server and turns error responses into exceptions. */
export async function api(endpoint, parameters = {}, signal) {
  const response = await fetch(
    `/api/${endpoint}?${new URLSearchParams(parameters)}`,
    { signal },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load this file.');
  return data;
}
