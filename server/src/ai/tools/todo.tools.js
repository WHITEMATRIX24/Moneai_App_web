import Todo from "../../models/Todo.js";

/**
 * Tool declaration in Gemini's function-calling schema.
 * This is what the model sees — it decides WHEN to call this,
 * never what it returns. The actual data always comes from executeListTodos.
 */
export const listTodosDeclaration = {
  name: "list_todos",
  description:
    "List the authenticated user's todo items, optionally filtered by status.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["all", "active", "completed"],
        description: "Filter todos by completion status. Defaults to all.",
      },
    },
  },
};

/**
 * Write tool: proposes creating a todo. Note this only ever gets executed
 * after explicit user confirmation (see aiApplicationTools.service.js) — the LLM
 * requesting this tool does NOT create anything by itself.
 *
 * BUGFIX: dueDate used to be optional here (`description: "Optional due
 * date..."`, absent from `required`). Nothing told the model a due date
 * was mandatory, so it would happily call create_todo with just a title
 * and no due date instead of asking the user for one — which is why
 * tasks were being created with no due date even though the product
 * requires one. Now required in the schema, and executeCreateTodo below
 * enforces it server-side as a hard backstop regardless of what the
 * model does.
 */
export const createTodoDeclaration = {
  name: "create_todo",
  description:
    "Propose creating a new todo item for the user. Requires user confirmation before it takes effect. Both title and dueDate are mandatory — if the user hasn't given a due date, ask them for one in plain conversation BEFORE calling this tool. Never call this tool with a guessed or omitted due date.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description:
          "A short, clear task title written in your own words from the user's intent — never the user's literal request sentence. E.g. if they say 'I want to add a task to call the plumber tomorrow', the title is 'Call the plumber', not 'I want to add a task to call the plumber tomorrow'.",
      },
      dueDate: {
        type: "string",
        description:
          "Required. Due date in ISO format (YYYY-MM-DD). Must be a date the user actually stated or clearly implied (e.g. 'tomorrow', 'next Friday') — resolve relative dates yourself, but never invent one and never leave this out.",
      },
    },
    required: ["title", "dueDate"],
  },
};

// Common filler prefixes people say when asking the assistant to add a
// task — stripped as a backstop in case the model still echoes the raw
// request instead of following the description above. Matched
// case-insensitively, longest/most-specific phrases first so a shorter
// prefix doesn't partially match and leave a dangling fragment.
const TITLE_FILLER_PREFIXES = [
  "i want to add a task to",
  "i want to add a task",
  "i want to create a task to",
  "i want to create a task",
  "please add a task to",
  "please add a task",
  "add a task to",
  "add a task",
  "create a task to",
  "create a task",
  "remind me to",
  "can you add a task to",
  "can you add a task",
];

/**
 * Backstop cleanup for the title-echo bug: if the model still passes
 * through something like "I want to add a task to call the plumber"
 * verbatim despite the schema/prompt guidance, strip the leading filler
 * so the confirmation card at least shows "Call the plumber" instead of
 * the whole request sentence. This is a safety net, not the fix — the
 * real fix is the tool description above and the prompt rule in
 * todo.prompt.js; this only catches what those miss.
 *
 * Returns null (rather than an empty/filler-only string) when nothing
 * usable is left after stripping — e.g. the model called create_todo
 * with title "I want to add a task" and no actual task content at all.
 * Saving that verbatim would reproduce the exact bug being fixed here;
 * saving "" would be worse. The caller treats null as a hard error.
 */
function cleanTitle(rawTitle) {
  const title = String(rawTitle).trim();
  const lower = title.toLowerCase();
  for (const prefix of TITLE_FILLER_PREFIXES) {
    if (lower.startsWith(prefix)) {
      const rest = title.slice(prefix.length).trim();
      return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : null;
    }
  }
  return title || null;
}

/**
 * Only called after confirmation — see executeTool() in aiApplicationTools.service.js.
 * @param {string} userId
 * @param {{title: string, dueDate: string}} args
 */
export async function executeCreateTodo(userId, args = {}) {
  if (!args.title) throw new Error("title is required");
  // BUGFIX: dueDate is now enforced server-side too, not just in the
  // schema — a hard backstop in case a provider/model ignores the
  // schema's `required` array (this has happened with some providers'
  // partial function-calling support).
  if (!args.dueDate) throw new Error("dueDate is required");

  const title = cleanTitle(args.title);
  if (!title) {
    throw new Error(
      "title has no actual task content (looks like a request sentence with the details left out) — ask the user what the task actually is",
    );
  }

  const todo = await Todo.create({ userId, title, dueAt: args.dueDate });

  return { id: todo._id, title: todo.title, dueAt: todo.dueAt || null };
}

/**
 * The actual read handler. Always scoped to userId — the LLM never sees or
 * chooses this, it's injected by the backend from the authenticated request.
 * @param {string} userId
 * @param {{status?: string}} args
 */
export async function executeListTodos(userId, args = {}) {
  const q = { userId, deletedAt: null };
  if (args.status === "active") q.completed = false;
  if (args.status === "completed") q.completed = true;

  const todos = await Todo.find(q).sort({ createdAt: -1 }).limit(20);

  // Return a compact summary, not raw Mongo docs — keeps tokens down
  // and matches the doc's "summarize before sending to the LLM" rule.
  // `id` is included (unlike other read tools) because update_todo/
  // complete_todo/delete_todo need something to target — the model has
  // to list_todos first to learn an id before it can act on one.
  return todos.map((t) => ({
    id: t._id,
    title: t.title,
    completed: t.completed,
    dueAt: t.dueAt || null,
  }));
}

/**
 * Write tool: proposes editing an existing todo's title/due date/priority.
 * Requires user confirmation (Section 20) — same pattern as create_todo.
 */
export const updateTodoDeclaration = {
  name: "update_todo",
  description:
    "Propose changing an existing todo's title, due date or priority. Requires the todo's id (from list_todos) and user confirmation before it takes effect.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "The todo's id, from list_todos." },
      title: { type: "string", description: "New title, if changing it." },
      dueDate: {
        type: "string",
        description: "New due date in ISO format (YYYY-MM-DD), if changing it.",
      },
      priority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH"],
        description: "New priority, if changing it.",
      },
    },
    required: ["id"],
  },
};

/**
 * Write tool: proposes marking a todo complete. Requires confirmation —
 * kept separate from update_todo so the model has an unambiguous single-
 * purpose action for the single most common write request ("mark X done").
 */
export const completeTodoDeclaration = {
  name: "complete_todo",
  description:
    "Propose marking a todo as completed. Requires the todo's id (from list_todos) and user confirmation before it takes effect.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "The todo's id, from list_todos." },
    },
    required: ["id"],
  },
};

/**
 * Write tool: proposes deleting (soft-delete) a todo. Requires
 * confirmation — this is a destructive action, never auto-executed.
 */
export const deleteTodoDeclaration = {
  name: "delete_todo",
  description:
    "Propose deleting a todo. Requires the todo's id (from list_todos) and user confirmation before it takes effect.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "The todo's id, from list_todos." },
    },
    required: ["id"],
  },
};

/**
 * Only called after confirmation — see executeTool() in aiApplicationTools.service.js.
 * @param {string} userId
 * @param {{id: string, title?: string, dueDate?: string, priority?: string}} args
 */
export async function executeUpdateTodo(userId, args = {}) {
  if (!args.id) throw new Error("id is required");

  const update = {};
  if (args.title !== undefined) update.title = args.title;
  if (args.dueDate !== undefined) update.dueAt = args.dueDate;
  if (args.priority !== undefined) update.priority = args.priority;

  const todo = await Todo.findOneAndUpdate(
    { _id: args.id, userId, deletedAt: null },
    update,
    { new: true },
  );
  if (!todo) throw new Error("Todo not found");

  return {
    id: todo._id,
    title: todo.title,
    dueAt: todo.dueAt || null,
    priority: todo.priority,
  };
}

/**
 * @param {string} userId
 * @param {{id: string}} args
 */
export async function executeCompleteTodo(userId, args = {}) {
  if (!args.id) throw new Error("id is required");

  const todo = await Todo.findOneAndUpdate(
    { _id: args.id, userId, deletedAt: null },
    { completed: true, completedAt: new Date() },
    { new: true },
  );
  if (!todo) throw new Error("Todo not found");

  return { id: todo._id, title: todo.title, completed: true };
}

/**
 * Soft-delete only (Doc Section 29 pattern) — never a hard Mongo delete.
 * @param {string} userId
 * @param {{id: string}} args
 */
export async function executeDeleteTodo(userId, args = {}) {
  if (!args.id) throw new Error("id is required");

  const todo = await Todo.findOneAndUpdate(
    { _id: args.id, userId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true },
  );
  if (!todo) throw new Error("Todo not found");

  return { id: todo._id, deleted: true };
}