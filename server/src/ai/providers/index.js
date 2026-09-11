import * as gemini from "./gemini.provider.js";
import * as openai from "./openai.provider.js";
import * as anthropic from "./anthropic.provider.js";
import * as qwen from "./qwen.provider.js";

/**
 * providers/index.js
 *
 * The provider registry. aiProvider.service.js looks providers up by
 * name from here — this is the only file that needs an entry added
 * when a new vendor shows up.
 */
const registry = {
  gemini,
  openai,
  anthropic,
  qwen,
};

/**
 * @param {string} name - "gemini" | "openai" | "anthropic" | "qwen"
 * @returns {{generate: Function, stream: Function, embed: Function, countTokens: Function}}
 */
export function getProvider(name) {
  const provider = registry[(name || "").toLowerCase()];
  if (!provider) {
    throw new Error(
      `Unknown AI provider "${name}". Supported: ${Object.keys(registry).join(", ")}`,
    );
  }
  return provider;
}

export function listProviders() {
  return Object.keys(registry);
}

export default { getProvider, listProviders };
