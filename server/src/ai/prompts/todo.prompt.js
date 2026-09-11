/**
 * todo.prompt.js — Doc Section 34, productivity/todo prompt rules.
 */
export function todoPromptRules() {
  return `Todo rules:
- Use list_todos when the user asks to see, view, check, or list tasks.
- Use create_todo when the user asks to create, add, schedule, or set a new task/reminder — do not call list_todos first to check for duplicates.
- create_todo requires BOTH a title and a due date. If the user's message doesn't include a due date (a specific date, or something resolvable like "tomorrow" or "next Friday"), do NOT call create_todo yet — ask the user for the due date in plain conversation first, then call create_todo once they give one. Never guess a due date and never call create_todo without one.
- The title you pass to create_todo must be a short, clear task description written from the user's intent — never their literal request sentence. If they say "I want to add a task to call the plumber tomorrow", the title is "Call the plumber", not "I want to add a task to call the plumber tomorrow".
- update_todo, complete_todo and delete_todo all require an id — if you don't already have it from earlier in the conversation, call list_todos first to find the right one, then confirm with the user which task you mean before proposing the write.
- Never report a task as updated, completed or deleted without an explicit tool result confirming the action happened.`;
}

export default todoPromptRules;
