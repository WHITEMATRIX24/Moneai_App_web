/**
 * sse.js
 *
 * Small shared helper for reading a Server-Sent-Events (text/event-stream)
 * fetch() response body line-by-line. Uses response.body.getReader()
 * directly rather than `for await (const chunk of response.body)` —
 * whether a WHATWG ReadableStream supports async iteration varies by
 * Node version/undici release, while getReader() has been stable since
 * fetch landed in Node 18. Used by openai.provider.js and
 * anthropic.provider.js so streaming works the same way for both.
 */

/**
 * @param {Response} response - a fetch() Response whose body is an SSE stream
 * @returns {AsyncGenerator<string>} yields each raw "data: ..." payload
 *   (already stripped of the "data:" prefix and surrounding whitespace),
 *   skipping non-data lines and blank keep-alives.
 */
export async function* readSSELines(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload) yield payload;
      }
    }
  } finally {
    reader.releaseLock?.();
  }
}

export default { readSSELines };
