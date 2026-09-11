import AIMessage from "../../models/AIMessage.js";
import AIConversation from "../../models/AIConversation.js";
import { generate } from "./aiProvider.service.js";

/**
 * aiSummarization.service.js
 *
 * Doc Section 43 — Conversation Summarization. AIConversation already
 * had `summary`/`summaryUpdatedAt` fields reserved for this (see the
 * model's own comment) but nothing wrote to them yet — this is that
 * piece, and the "Token optimization" deliverable it enables: once a
 * thread is long, ai.service.js sends `summary + last N messages`
 * instead of replaying the whole history into the prompt every turn.
 *
 * Runs on the FAST tier (Section 6: "short summaries" is a named
 * fast-model example) and never touches finance/todo tool calls itself.
 */

const SUMMARY_TRIGGER_COUNT = Number(process.env.AI_SUMMARY_TRIGGER_COUNT || 20);
const KEEP_RECENT_COUNT = Number(process.env.AI_SUMMARY_KEEP_RECENT || 10);

const SUMMARY_SYSTEM_PROMPT = `Summarize the following conversation between a user and MONE AI in 3-5 sentences.
Preserve concrete facts the assistant should remember (amounts, categories, dates, decisions made), not the back-and-forth phrasing.
Do not add information that wasn't in the conversation.`;

/**
 * Checks whether a conversation has grown past the trigger threshold
 * and, if so, folds everything except the most recent KEEP_RECENT_COUNT
 * messages into conversation.summary. Safe to call on every turn — it's
 * a cheap count query when below the threshold, and idempotent (re-runs
 * just regenerate a fresh summary that includes the newly-folded turns).
 * @param {string} conversationId
 * @returns {Promise<string|null>} the (possibly updated) summary, or null if not due yet
 */
export async function summarizeConversationIfNeeded(conversationId) {
  const total = await AIMessage.countDocuments({
    conversation: conversationId,
    role: { $in: ["USER", "ASSISTANT"] },
    status: "COMPLETED",
  });

  if (total <= SUMMARY_TRIGGER_COUNT) return null;

  const toFold = await AIMessage.find({
    conversation: conversationId,
    role: { $in: ["USER", "ASSISTANT"] },
    status: "COMPLETED",
  })
    .sort({ createdAt: 1 })
    .limit(total - KEEP_RECENT_COUNT)
    .lean();

  if (toFold.length === 0) return null;

  const conversation = await AIConversation.findById(conversationId);
  if (!conversation) return null;

  const transcript = toFold
    .map((m) => `${m.role === "ASSISTANT" ? "MONE AI" : "User"}: ${m.content}`)
    .join("\n");

  const priorSummary = conversation.summary ? `Existing summary so far: ${conversation.summary}\n\n` : "";

  try {
    const result = await generate({
      systemPrompt: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${priorSummary}New messages to fold in:\n${transcript}` }],
      tier: "fast",
    });

    conversation.summary = result.text.trim();
    conversation.summaryUpdatedAt = new Date();
    await conversation.save();
    return conversation.summary;
  } catch (err) {
    // Summarization failing must never break the actual chat turn —
    // just skip it this time and let loadRecentHistory's hard limit
    // keep the prompt bounded regardless.
    console.error("Conversation summarization failed:", err.message);
    return conversation.summary || null;
  }
}

export default { summarizeConversationIfNeeded };
