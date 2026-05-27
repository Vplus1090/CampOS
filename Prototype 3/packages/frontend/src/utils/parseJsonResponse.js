/**
 * Parse a fetch Response as JSON; surface HTML/error pages with a clear message.
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 80);
    throw new Error(
      res.ok
        ? `Server returned invalid JSON: ${preview}`
        : `API unavailable (${res.status}). ${preview}`
    );
  }
}
