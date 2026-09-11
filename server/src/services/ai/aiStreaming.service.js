/**
 * aiStreaming.service.js — named in Doc Section 6's services/ai/ list.
 *
 * HONEST NOTE ON WHAT THIS FILE IS: `streamMessage` and
 * `streamConversationMessage` are async generators defined inside
 * `ai.service.js`, where they share private, unexported helpers with
 * the rest of that file (`buildSystemPromptWithContext`,
 * `loadRecentHistory`, `screenInput`, `classifyTier`, etc.). Physically
 * moving the generators out would mean also exporting several
 * previously-internal helpers just for this file to import them back —
 * a much bigger refactor than "the doc names a file that's missing."
 *
 * Rather than fake a clean split or silently leave the file out, this
 * makes `aiStreaming.service.js` the doc-correct **import surface**:
 * every consumer (ai.controller.js) imports streaming functions from
 * here, not from ai.service.js directly, so the doc's file structure
 * is genuinely true at the call-site level. If/when the generators are
 * physically relocated, only this file changes — no controller import
 * needs to move again.
 */
export { streamMessage, streamConversationMessage } from "./ai.service.js";
