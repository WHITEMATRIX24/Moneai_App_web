import { generate, stream } from "./aiProvider.service.js";
import { getToolDeclarations, executeTool, toolRequiresConfirmation } from "./aiApplicationTools.service.js";
import { getUserContext } from "./aiContext.service.js";
import { buildSystemPrompt } from "./aiPrompt.service.js";
import { list as listMemory } from "./aiMemory.service.js";
import { hasPersonalizationConsent } from "./aiConsent.service.js";
import { screenInput, validateOutput } from "./aiSafety.service.js";
import { classifyTier } from "./aiModelRouter.service.js";
import { summarizeConversationIfNeeded } from "./aiSummarization.service.js";
import { trimHistoryToBudget } from "../../utils/tokenBudget.js";
import AIConversation from "../../models/AIConversation.js";
import AIMessage from "../../models/AIMessage.js";

/**
 * ai.service.js
 *
 * The AI Orchestrator (architecture diagram's "AI Orchestrator" box).
 * Controllers should only ever call into here — they never import
 * aiProvider.service.js, aiPrompt.service.js, aiSafety.service.js, etc.
 * directly. This is the seam where context, prompt-building, model
 * routing, tool-calling and safety all get wired together per turn.
 *
 * Member 1 ownership recap (what changed in this pass, see CHANGES.md):
 *   - Provider abstraction + fallback -> aiProvider.service.js / ai/providers/*
 *   - Prompt engine                    -> aiPrompt.service.js / ai/prompts/*
 *   - Fast/primary model routing       -> aiModelRouter.service.js (now actually used below)
 *   - AI safety / injection screening  -> aiSafety.service.js
 *   - Conversation summarization       -> aiSummarization.service.js
 *   - Token optimization               -> utils/tokenBudget.js
 *   - Multi-step tool orchestration    -> runToolLoop() below (was single-call only)
 */

const HISTORY_LIMIT = 10; // Section 42/43: last N messages, not the whole thread.
const HISTORY_TOKEN_BUDGET = Number(process.env.AI_HISTORY_TOKEN_BUDGET || 2000);
const MAX_TOOL_ITERATIONS = Number(process.env.AI_MAX_TOOL_ITERATIONS || 3);

/**
 * Builds the composed system prompt for a real user turn: fetches the
 * context-engine snapshot and (if present) the conversation summary,
 * and folds both into the prompt engine's output.
 * @param {string} userId
 * @param {string} [conversationSummary]
 */
async function buildSystemPromptWithContext(userId, conversationSummary) {
  // BUGFIX: previously called listMemory(userId) unconditionally, so a
  // user who explicitly revoked personalization consent still had their
  // stated facts (source: "user_stated", which revocation does NOT
  // delete — see aiConsent.service.js) read into every prompt. Turning
  // personalization "off" must also mean the AI stops *using* what it
  // already knows, not just stop learning anything new. Facts remain
  // stored and visible/deletable via GET /api/v1/ai/memory regardless of
  // consent state — only their use in conversation is gated here.
  const [context, consented] = await Promise.all([
    getUserContext(userId),
    hasPersonalizationConsent(userId),
  ]);
  const memory = consented ? await listMemory(userId) : [];
  return buildSystemPrompt({ context, conversationSummary, memory });
}

// ------------------------------------------------------------------
// Conversation management (Section 24-30) — unchanged from prior pass
// ------------------------------------------------------------------

/**
 * @param {string} userId
 * @param {string} [title]
 */
export async function createConversation(userId, title) {
  return AIConversation.create({ userId, title: title || "New Conversation" });
}

/**
 * @param {string} userId
 * @param {{page?: number, limit?: number, search?: string}} [options]
 */
export async function listConversations(userId, { page = 1, limit = 20, search = "" } = {}) {
  const q = { userId, status: { $ne: "DELETED" } };
  if (search) q.title = { $regex: search, $options: "i" };

  const [conversations, total] = await Promise.all([
    AIConversation.find(q)
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AIConversation.countDocuments(q),
  ]);

  return { conversations, total, page: Number(page), limit: Number(limit) };
}

/**
 * @param {string} userId
 * @param {string} conversationId
 */
export async function getConversationWithMessages(userId, conversationId) {
  const conversation = await AIConversation.findOne({ _id: conversationId, userId, status: { $ne: "DELETED" } });
  if (!conversation) return null;

  const messages = await AIMessage.find({ conversation: conversationId, userId }).sort({ createdAt: 1 });
  return { conversation, messages };
}

/**
 * @param {string} userId
 * @param {string} conversationId
 * @param {string} title
 */
export async function renameConversation(userId, conversationId, title) {
  return AIConversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { title },
    { new: true },
  );
}

/**
 * Soft delete, per Section 29's recommendation.
 * @param {string} userId
 * @param {string} conversationId
 */
export async function deleteConversation(userId, conversationId) {
  return AIConversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { status: "DELETED" },
    { new: true },
  );
}

/**
 * @param {string} conversationId
 */
async function loadRecentHistory(conversationId) {
  const rows = await AIMessage.find({
    conversation: conversationId,
    role: { $in: ["USER", "ASSISTANT"] },
    status: "COMPLETED",
  })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .lean();

  const ordered = rows
    .reverse()
    .map((m) => ({ role: m.role === "ASSISTANT" ? "assistant" : "user", content: m.content }));

  // Section 42's token-budget trim on top of the message-count limit —
  // matters when individual messages are long (e.g. pasted spending lists).
  return trimHistoryToBudget(ordered, HISTORY_TOKEN_BUDGET);
}

// ------------------------------------------------------------------
// Tool orchestration loop — shared by conversation-aware and legacy
// stateless flows. This is what makes tool calling multi-step: after
// executing a read tool, the model can decide it needs *another* tool
// before it has enough to answer, up to MAX_TOOL_ITERATIONS.
// ------------------------------------------------------------------

/**
 * @param {Object} options
 * @param {string} options.userId
 * @param {string} options.systemPrompt
 * @param {Array} options.messages - vendor-neutral message array, already
 *   seeded with history + the current user turn (or, when resuming after
 *   a confirmation, with the confirmed tool's result already appended)
 * @param {"fast"|"primary"} options.tier
 * @param {string} options.userMessage - original text, echoed into any pendingAction
 * @param {string|null} [options.conversationId=null] - threaded into
 *   executeTool()'s AIToolExecution audit log; null for legacy stateless calls
 * @returns {Promise<{text:string|null, usage:Object, model:string, provider:string, latencyMs:number, toolUsed:string|null, pendingAction:Object|null}>}
 */
async function runToolLoop({ userId, systemPrompt, messages, tier, userMessage, conversationId = null }) {
  const tools = getToolDeclarations().map((d) => ({
    name: d.name,
    description: d.description,
    parameters: d.parametersJsonSchema,
  }));

  let lastUsage = null;
  let lastModel = null;
  let lastProvider = null;
  let totalLatencyMs = 0; // sum across tool-loop iterations — the user waited for all of them
  let toolUsed = null;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const res = await generate({ systemPrompt, messages, tier, tools });
    lastUsage = res.usage;
    lastModel = res.model;
    lastProvider = res.providerUsed;
    totalLatencyMs += res.latencyMs || 0;

    if (!res.toolCalls || res.toolCalls.length === 0) {
      const check = validateOutput(res.text);
      const safeText = check.safe ? res.text : "I can't share that — let me know what you'd like help with instead.";
      return {
        text: safeText,
        usage: lastUsage,
        model: lastModel,
        provider: lastProvider,
        latencyMs: totalLatencyMs,
        toolUsed,
        pendingAction: null,
        messages,
      };
    }

    const call = res.toolCalls[0];

    if (toolRequiresConfirmation(call.name)) {
      return {
        text: null,
        usage: lastUsage,
        model: lastModel,
        provider: lastProvider,
        latencyMs: totalLatencyMs,
        toolUsed,
        pendingAction: {
          type: "CONFIRM_ACTION",
          tool: call.name,
          parameters: call.args,
          userMessage,
          call,
          // Carries the accumulated turn history so confirmConversationMessage
          // can resume the same tool loop instead of starting a fresh 3-turn
          // exchange — additive field, old clients that only echo `call`
          // still work since confirm() falls back to a minimal history.
          messages,
        },
      };
    }

    const toolResult = await executeTool(call.name, call.args, userId, false, conversationId);
    toolUsed = call.name;
    messages = [...messages, { role: "assistant", toolCall: call }, { role: "tool", toolName: call.name, content: toolResult }];
  }

  // Iteration cap hit without a final text answer — fail safely rather
  // than looping forever (Section 20's "provider failures ... fail safely").
  return {
    text: "I wasn't able to finish that after a few tool lookups — could you narrow down the question?",
    usage: lastUsage,
    model: lastModel,
    provider: lastProvider,
    latencyMs: totalLatencyMs,
    toolUsed,
    pendingAction: null,
    messages,
  };
}

// ------------------------------------------------------------------
// Conversation-aware chat (persists every turn, uses history + context)
// ------------------------------------------------------------------

/**
 * Full round trip for a message inside a persisted conversation: screens
 * the input, summarizes the thread if it's grown long, loads trimmed
 * history, injects context via the prompt engine, classifies fast vs
 * primary tier, and runs the tool loop. Every USER/ASSISTANT message is
 * saved to AIMessage so the thread survives across requests (Section 13/14).
 *
 * @param {string} userId - from req.auth.user._id, never the model
 * @param {string} conversationId
 * @param {string} rawUserMessage
 */
export async function sendConversationMessage(userId, conversationId, rawUserMessage) {
  if (!rawUserMessage || typeof rawUserMessage !== "string") {
    throw new Error("userMessage is required");
  }

  const conversation = await AIConversation.findOne({ _id: conversationId, userId, status: { $ne: "DELETED" } });
  if (!conversation) throw new Error("Conversation not found");

  const { text: userMessage, flagged } = screenInput(rawUserMessage);
  if (flagged) {
    console.warn(`Prompt-injection-like input flagged for conversation ${conversationId} (user ${userId})`);
  }

  await AIMessage.create({ conversation: conversationId, userId, role: "USER", content: userMessage });

  const [summary] = await Promise.all([
    summarizeConversationIfNeeded(conversationId),
  ]);

  const [systemPrompt, history] = await Promise.all([
    buildSystemPromptWithContext(userId, summary || conversation.summary),
    loadRecentHistory(conversationId),
  ]);

  const tier = classifyTier(userMessage);
  const messages = [...history, { role: "user", content: userMessage }];

  const result = await runToolLoop({ userId, systemPrompt, messages, tier, userMessage, conversationId });

  conversation.lastMessageAt = new Date();
  if (!conversation.metadata?.model) conversation.metadata = { ...conversation.metadata, model: result.model };
  if (conversation.title === "New Conversation") {
    conversation.title = userMessage.slice(0, 60);
  }
  await conversation.save();

  if (result.pendingAction) {
    await AIMessage.create({
      conversation: conversationId,
      userId,
      role: "ASSISTANT",
      content: "",
      model: result.model,
      toolCalls: [{ name: result.pendingAction.call.name, args: result.pendingAction.call.args }],
      status: "PENDING_CONFIRMATION",
    });

    return {
      text: null,
      usage: result.usage,
      model: result.model,
      provider: result.provider,
      latencyMs: result.latencyMs,
      toolUsed: null,
      conversationId,
      pendingAction: result.pendingAction,
    };
  }

  await AIMessage.create({
    conversation: conversationId,
    userId,
    role: "ASSISTANT",
    content: result.text,
    model: result.model,
    inputTokens: result.usage?.inputTokens || 0,
    outputTokens: result.usage?.outputTokens || 0,
    latencyMs: result.latencyMs,
    toolCalls: result.toolUsed ? [{ name: result.toolUsed }] : [],
  });

  return {
    text: result.text,
    usage: result.usage,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
    toolUsed: result.toolUsed,
    pendingAction: null,
    conversationId,
  };
}

/**
 * Streaming version of sendConversationMessage for tool-free replies.
 * Tool calls aren't supported mid-stream (matches the doc's Section 28
 * event set: message_start/token/message_complete) — if the model
 * wants a tool, the caller should fall back to sendConversationMessage.
 * Persists the user message immediately and the assistant reply once
 * streaming completes.
 * @param {string} userId
 * @param {string} conversationId
 * @param {string} rawUserMessage
 */
export async function* streamConversationMessage(userId, conversationId, rawUserMessage) {
  if (!rawUserMessage || typeof rawUserMessage !== "string") {
    throw new Error("userMessage is required");
  }

  const conversation = await AIConversation.findOne({ _id: conversationId, userId, status: { $ne: "DELETED" } });
  if (!conversation) throw new Error("Conversation not found");

  const { text: userMessage, flagged } = screenInput(rawUserMessage);
  if (flagged) {
    console.warn(`Prompt-injection-like input flagged for conversation ${conversationId} (user ${userId})`);
  }

  await AIMessage.create({ conversation: conversationId, userId, role: "USER", content: userMessage });

  const summary = await summarizeConversationIfNeeded(conversationId);

  const [systemPrompt, history] = await Promise.all([
    buildSystemPromptWithContext(userId, summary || conversation.summary),
    loadRecentHistory(conversationId),
  ]);

  const tier = classifyTier(userMessage);

  yield { type: "message_start" };

  const generator = stream({
    systemPrompt,
    messages: [...history, { role: "user", content: userMessage }],
    tier,
  });

  let fullText = "";
  let finalUsage = null;
  let finalModel = null;
  let finalLatencyMs = null;

  for await (const chunk of generator) {
    if (chunk.type === "token") {
      fullText += chunk.text;
      yield { type: "token", text: chunk.text };
    }
    if (chunk.type === "done") {
      finalUsage = chunk.usage;
      finalModel = chunk.model;
      finalLatencyMs = chunk.latencyMs;
      yield {
        type: "message_complete",
        usage: chunk.usage,
        model: chunk.model,
        provider: chunk.providerUsed,
        latencyMs: chunk.latencyMs,
      };
    }
  }

  await AIMessage.create({
    conversation: conversationId,
    userId,
    role: "ASSISTANT",
    content: fullText,
    model: finalModel,
    inputTokens: finalUsage?.inputTokens || 0,
    outputTokens: finalUsage?.outputTokens || 0,
    latencyMs: finalLatencyMs,
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();
}

/**
 * Executes a previously proposed write action after explicit user
 * confirmation, resuming the same tool loop (so a confirmed action can
 * itself be followed by another tool call, e.g. create_budget then a
 * summary lookup) rather than always ending after one follow-up.
 * @param {string} userId
 * @param {string} conversationId
 * @param {{userMessage: string, call: {name: string, args: Object}, messages?: Array}} pendingAction
 */
export async function confirmConversationMessage(userId, conversationId, pendingAction) {
  const { userMessage, call, messages: priorMessages } = pendingAction;

  const conversation = await AIConversation.findOne({ _id: conversationId, userId, status: { $ne: "DELETED" } });
  if (!conversation) throw new Error("Conversation not found");

  // The placeholder this confirmation resolves — created by
  // sendConversationMessage (or a prior confirm, if this is a chained
  // confirmation) when the action was first proposed. We update it in
  // place below instead of creating a second message, so confirming
  // doesn't leave an empty orphaned bubble sitting in the transcript.
  const placeholder = await AIMessage.findOne({
    conversation: conversationId,
    userId,
    role: "ASSISTANT",
    status: "PENDING_CONFIRMATION",
  }).sort({ createdAt: -1 });

  const systemPrompt = await buildSystemPromptWithContext(userId, conversation.summary);
  const toolResult = await executeTool(call.name, call.args, userId, true, conversationId);

  // Fall back to a minimal two-turn history if an older client echoed a
  // pendingAction from before `messages` was added to the contract.
  const baseMessages = priorMessages && priorMessages.length ? priorMessages : [{ role: "user", content: userMessage }];
  const messages = [...baseMessages, { role: "assistant", toolCall: call }, { role: "tool", toolName: call.name, content: toolResult }];

  const tier = classifyTier(userMessage);
  const result = await runToolLoop({ userId, systemPrompt, messages, tier, userMessage, conversationId });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  if (result.pendingAction) {
    const nextToolCalls = [{ name: result.pendingAction.call.name, args: result.pendingAction.call.args }];
    if (placeholder) {
      placeholder.model = result.model;
      placeholder.toolCalls = nextToolCalls;
      await placeholder.save();
    } else {
      await AIMessage.create({
        conversation: conversationId,
        userId,
        role: "ASSISTANT",
        content: "",
        model: result.model,
        toolCalls: nextToolCalls,
        status: "PENDING_CONFIRMATION",
      });
    }
    return {
      text: null,
      usage: result.usage,
      model: result.model,
      provider: result.provider,
      latencyMs: result.latencyMs,
      toolUsed: call.name,
      pendingAction: result.pendingAction,
      conversationId,
    };
  }

  if (placeholder) {
    placeholder.content = result.text;
    placeholder.status = "COMPLETED";
    placeholder.model = result.model;
    placeholder.inputTokens = result.usage?.inputTokens || 0;
    placeholder.outputTokens = result.usage?.outputTokens || 0;
    placeholder.latencyMs = result.latencyMs;
    placeholder.toolCalls = [{ name: call.name, args: call.args }];
    await placeholder.save();
  } else {
    await AIMessage.create({
      conversation: conversationId,
      userId,
      role: "ASSISTANT",
      content: result.text,
      model: result.model,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      latencyMs: result.latencyMs,
      toolCalls: [{ name: call.name, args: call.args }],
    });
  }

  return {
    text: result.text,
    usage: result.usage,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
    toolUsed: call.name,
    pendingAction: null,
    conversationId,
  };
}

// ------------------------------------------------------------------
// Legacy Phase 1 endpoints — stateless, no conversation, kept for
// backward compatibility with anything already wired to /chat. Now
// routed through the same prompt engine/safety/tool-loop machinery
// instead of duplicating a slimmer version of it.
// ------------------------------------------------------------------

/**
 * @param {string} rawUserMessage
 */
export async function sendMessage(rawUserMessage) {
  if (!rawUserMessage || typeof rawUserMessage !== "string") {
    throw new Error("userMessage is required");
  }
  const { text: userMessage } = screenInput(rawUserMessage);
  const systemPrompt = buildSystemPrompt({});

  const result = await generate({
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tier: classifyTier(userMessage),
  });

  // Normalize field names to match the other sendX functions below
  // (generate() itself uses providerUsed/fallbackUsed — see aiProvider.service.js).
  return { text: result.text, usage: result.usage, model: result.model, provider: result.providerUsed, latencyMs: result.latencyMs };
}

/**
 * @param {string} rawUserMessage
 */
export async function* streamMessage(rawUserMessage) {
  if (!rawUserMessage || typeof rawUserMessage !== "string") {
    throw new Error("userMessage is required");
  }
  const { text: userMessage } = screenInput(rawUserMessage);
  const systemPrompt = buildSystemPrompt({});

  yield { type: "message_start" };

  const generator = stream({
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tier: classifyTier(userMessage),
  });

  for await (const chunk of generator) {
    if (chunk.type === "token") yield { type: "token", text: chunk.text };
    if (chunk.type === "done") {
      yield {
        type: "message_complete",
        usage: chunk.usage,
        model: chunk.model,
        provider: chunk.providerUsed,
        latencyMs: chunk.latencyMs,
      };
    }
  }
}

/**
 * @param {string} userId
 * @param {string} rawUserMessage
 */
export async function sendMessageWithTools(userId, rawUserMessage) {
  if (!rawUserMessage || typeof rawUserMessage !== "string") {
    throw new Error("userMessage is required");
  }
  const { text: userMessage } = screenInput(rawUserMessage);
  // BUGFIX: this legacy-but-still-live endpoint has userId and never
  // fetched memory, so the same user got personalized answers on
  // /conversations/:id/messages but not here on /chat/tools — an
  // inconsistency with no intentional reason (unlike sendMessage/
  // streamMessage above, which are truly anonymous and can't apply it).
  const consented = await hasPersonalizationConsent(userId);
  const memory = consented ? await listMemory(userId) : [];
  const systemPrompt = buildSystemPrompt({ forceDomains: ["finance", "todo", "health"], memory });
  const tier = classifyTier(userMessage);

  const result = await runToolLoop({
    userId,
    systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tier,
    userMessage,
  });

  return {
    text: result.text,
    usage: result.usage,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
    toolUsed: result.toolUsed,
    pendingAction: result.pendingAction,
  };
}

/**
 * @param {string} userId
 * @param {{userMessage: string, call: Object, messages?: Array}} pendingAction
 */
export async function confirmMessage(userId, pendingAction) {
  const { userMessage, call, messages: priorMessages } = pendingAction;
  // BUGFIX: same as sendMessageWithTools above — keep the resumed loop's
  // prompt consistent with the one that generated the pending action.
  const consented = await hasPersonalizationConsent(userId);
  const memory = consented ? await listMemory(userId) : [];
  const systemPrompt = buildSystemPrompt({ forceDomains: ["finance", "todo", "health"], memory });
  const toolResult = await executeTool(call.name, call.args, userId, true);

  const baseMessages = priorMessages && priorMessages.length ? priorMessages : [{ role: "user", content: userMessage }];
  const messages = [...baseMessages, { role: "assistant", toolCall: call }, { role: "tool", toolName: call.name, content: toolResult }];

  const result = await runToolLoop({ userId, systemPrompt, messages, tier: classifyTier(userMessage), userMessage });
  return {
    text: result.text,
    usage: result.usage,
    model: result.model,
    provider: result.provider,
    latencyMs: result.latencyMs,
    toolUsed: call.name,
    pendingAction: result.pendingAction,
  };
}

export default {
  createConversation,
  listConversations,
  getConversationWithMessages,
  renameConversation,
  deleteConversation,
  sendConversationMessage,
  streamConversationMessage,
  confirmConversationMessage,
  sendMessage,
  streamMessage,
  sendMessageWithTools,
  confirmMessage,
};
