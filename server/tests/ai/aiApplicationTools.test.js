import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Covers Doc §16/56 "Tool Tests" + "Security Tests: Tool authorization" —
 * the core "LLM -> Tool validator -> Authorization layer" boundary from
 * Doc §19. Every tool sub-module is mocked so this suite never touches
 * Mongo: what's under test is aiApplicationTools.service.js's own
 * enforcement logic, not the finance/todo/health/profile handlers.
 */

vi.mock("../../src/ai/tools/todo.tools.js", () => ({
  listTodosDeclaration: { name: "list_todos" },
  executeListTodos: vi.fn(async (userId, args) => ({ userId, args, todos: [] })),
  createTodoDeclaration: { name: "create_todo" },
  executeCreateTodo: vi.fn(async (userId, args) => ({ userId, args, created: true })),
  updateTodoDeclaration: { name: "update_todo" },
  executeUpdateTodo: vi.fn(async () => ({})),
  completeTodoDeclaration: { name: "complete_todo" },
  executeCompleteTodo: vi.fn(async () => ({})),
  deleteTodoDeclaration: { name: "delete_todo" },
  executeDeleteTodo: vi.fn(async () => ({})),
}));

vi.mock("../../src/ai/tools/finance.tools.js", () => ({
  getSpendingSummaryDeclaration: { name: "get_spending_summary" },
  executeGetSpendingSummary: vi.fn(async () => ({})),
  listBudgetsDeclaration: { name: "list_budgets" },
  executeListBudgets: vi.fn(async () => ({})),
  createBudgetDeclaration: { name: "create_budget" },
  executeCreateBudget: vi.fn(async (userId, args) => ({ userId, args, created: true })),
  getAccountsDeclaration: { name: "get_accounts" },
  executeGetAccounts: vi.fn(async () => ({})),
  getAccountBalanceDeclaration: { name: "get_account_balance" },
  executeGetAccountBalance: vi.fn(async () => ({})),
  getTransactionsDeclaration: { name: "get_transactions" },
  executeGetTransactions: vi.fn(async () => ({})),
  getIncomeSummaryDeclaration: { name: "get_income_summary" },
  executeGetIncomeSummary: vi.fn(async () => ({})),
  analyzeSpendingDeclaration: { name: "analyze_spending" },
  executeAnalyzeSpending: vi.fn(async () => ({})),
  listGoalsDeclaration: { name: "list_goals" },
  executeListGoals: vi.fn(async () => ({})),
  getGoalDeclaration: { name: "get_goal" },
  executeGetGoal: vi.fn(async () => ({})),
  createGoalDeclaration: { name: "create_goal" },
  executeCreateGoal: vi.fn(async () => ({})),
}));

vi.mock("../../src/ai/tools/health.tools.js", () => ({
  getHealthSummaryDeclaration: { name: "get_health_summary" },
  executeGetHealthSummary: vi.fn(async () => ({})),
  getActivitySummaryDeclaration: { name: "get_activity_summary" },
  executeGetActivitySummary: vi.fn(async () => ({})),
  getSleepSummaryDeclaration: { name: "get_sleep_summary" },
  executeGetSleepSummary: vi.fn(async () => ({})),
}));

vi.mock("../../src/ai/tools/profile.tools.js", () => ({
  getUserProfileDeclaration: { name: "get_user_profile" },
  executeGetUserProfile: vi.fn(async () => ({})),
  getSubscriptionDeclaration: { name: "get_subscription" },
  executeGetSubscription: vi.fn(async () => ({})),
  getNotificationPreferencesDeclaration: { name: "get_notification_preferences" },
  executeGetNotificationPreferences: vi.fn(async () => ({})),
}));

vi.mock("../../src/ai/tools/medicine.tools.js", () => ({
  listMedicinesDeclaration: { name: "list_medicines" },
  executeListMedicines: vi.fn(async () => ({ medicines: [] })),
  getTodayDosesDeclaration: { name: "get_today_doses" },
  executeGetTodayDoses: vi.fn(async () => ({ doses: [] })),
  markDoseTakenDeclaration: { name: "mark_dose_taken" },
  executeMarkDoseTaken: vi.fn(async (userId, args) => ({ userId, args, taken: true })),
  markDoseUntakenDeclaration: { name: "mark_dose_untaken" },
  executeMarkDoseUntaken: vi.fn(async (userId, args) => ({ userId, args, taken: false })),
}));

vi.mock("../../src/ai/tools/memory.tools.js", () => ({
  rememberPreferenceDeclaration: { name: "remember_preference" },
  executeRememberPreference: vi.fn(async (userId, args) => ({ userId, args, saved: true })),
  forgetPreferenceDeclaration: { name: "forget_preference" },
  executeForgetPreference: vi.fn(async (userId, args) => ({ userId, args, forgotten: true })),
  listRememberedPreferencesDeclaration: { name: "list_remembered_preferences" },
  executeListRememberedPreferences: vi.fn(async () => ({ facts: [] })),
}));

vi.mock("../../src/models/AIToolExecution.js", () => ({
  default: { create: vi.fn(async () => ({})) },
}));

// executeTool() fires runInferenceForUser() (fire-and-forget) after every
// successful call. It self-catches, so it can't fail an assertion here,
// but left unmocked it hits a real User.findById() with a fake test
// userId and logs a CastError to stderr on every single test in this
// file. Mocked purely to keep test output clean — behavior under test
// is aiApplicationTools.service.js's own registry/confirmation logic,
// not inference.
vi.mock("../../src/services/ai/aiInference.service.js", () => ({
  runInferenceForUser: vi.fn(async () => {}),
}));

const {
  executeTool,
  toolRequiresConfirmation,
  getToolDeclarations,
} = await import("../../src/services/ai/aiApplicationTools.service.js");
const { executeCreateTodo, executeListTodos } = await import(
  "../../src/ai/tools/todo.tools.js"
);
const { executeCreateBudget } = await import("../../src/ai/tools/finance.tools.js");
const { executeMarkDoseTaken, executeListMedicines } = await import(
  "../../src/ai/tools/medicine.tools.js"
);
const { executeRememberPreference, executeListRememberedPreferences } = await import(
  "../../src/ai/tools/memory.tools.js"
);

const USER_A = "user-a-id";
const USER_B = "user-b-id";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("aiApplicationTools.service — tool registry", () => {
  it("rejects a tool name the model invented", async () => {
    await expect(executeTool("delete_all_users", {}, USER_A)).rejects.toThrow(
      /Unknown or unauthorized tool/,
    );
  });

  it("toolRequiresConfirmation throws for unknown tools too", () => {
    expect(() => toolRequiresConfirmation("not_a_real_tool")).toThrow(
      /Unknown or unauthorized tool/,
    );
  });

  it("exposes a declaration for every registered tool", () => {
    const names = getToolDeclarations().map((d) => d.name);
    expect(names).toContain("create_todo");
    expect(names).toContain("get_accounts");
    expect(names).toContain("create_budget");
    expect(names).toContain("list_medicines");
    expect(names).toContain("mark_dose_taken");
  });
});

describe("aiApplicationTools.service — write-tool confirmation gate", () => {
  it("flags write tools as requiring confirmation, read tools as not", () => {
    expect(toolRequiresConfirmation("create_todo")).toBe(true);
    expect(toolRequiresConfirmation("create_budget")).toBe(true);
    expect(toolRequiresConfirmation("list_todos")).toBe(false);
    expect(toolRequiresConfirmation("get_accounts")).toBe(false);
  });

  it("refuses to run a write tool without confirmed: true", async () => {
    await expect(executeTool("create_todo", { title: "x" }, USER_A)).rejects.toThrow(
      /requires user confirmation/,
    );
    expect(executeCreateTodo).not.toHaveBeenCalled();
  });

  it("refuses even when the caller passes confirmed: false explicitly", async () => {
    await expect(
      executeTool("create_budget", { category: "Food", amount: 100 }, USER_A, false),
    ).rejects.toThrow(/requires user confirmation/);
    expect(executeCreateBudget).not.toHaveBeenCalled();
  });

  it("runs a write tool once confirmed: true is passed", async () => {
    const result = await executeTool("create_todo", { title: "Pay bill" }, USER_A, true);
    expect(executeCreateTodo).toHaveBeenCalledTimes(1);
    expect(result.created).toBe(true);
  });

  it("runs read tools with no confirmation needed", async () => {
    await executeTool("list_todos", {}, USER_A);
    expect(executeListTodos).toHaveBeenCalledTimes(1);
  });
});

describe("aiApplicationTools.service — medicine tools (deliberately narrow scope)", () => {
  it("flags mark_dose_taken/untaken as requiring confirmation, list/get as not", () => {
    expect(toolRequiresConfirmation("mark_dose_taken")).toBe(true);
    expect(toolRequiresConfirmation("mark_dose_untaken")).toBe(true);
    expect(toolRequiresConfirmation("list_medicines")).toBe(false);
    expect(toolRequiresConfirmation("get_today_doses")).toBe(false);
  });

  it("refuses to mark a dose taken without confirmation", async () => {
    await expect(
      executeTool("mark_dose_taken", { medicineId: "m1", time: "08:00" }, USER_A),
    ).rejects.toThrow(/requires user confirmation/);
    expect(executeMarkDoseTaken).not.toHaveBeenCalled();
  });

  it("marks a dose taken once confirmed", async () => {
    await executeTool("mark_dose_taken", { medicineId: "m1", time: "08:00" }, USER_A, true);
    expect(executeMarkDoseTaken).toHaveBeenCalledTimes(1);
    const [calledUserId] = executeMarkDoseTaken.mock.calls[0];
    expect(calledUserId).toBe(USER_A);
  });

  it("lists medicines with no confirmation needed", async () => {
    await executeTool("list_medicines", {}, USER_A);
    expect(executeListMedicines).toHaveBeenCalledTimes(1);
  });

  it("there is deliberately no create/update/delete_medicine tool registered — editing the medicine itself is out of scope for the AI", async () => {
    for (const name of ["create_medicine", "update_medicine", "delete_medicine"]) {
      expect(() => toolRequiresConfirmation(name)).toThrow(/Unknown or unauthorized tool/);
    }
  });
});

describe("aiApplicationTools.service — memory tools", () => {
  it("does not require confirmation for remember/forget/list — low-risk, easily-reversible preference, not a data write", () => {
    expect(toolRequiresConfirmation("remember_preference")).toBe(false);
    expect(toolRequiresConfirmation("forget_preference")).toBe(false);
    expect(toolRequiresConfirmation("list_remembered_preferences")).toBe(false);
  });

  it("saves a preference immediately with no confirmation step, with the caller's userId", async () => {
    await executeTool("remember_preference", { key: "responseStyle", value: "short" }, USER_A);
    expect(executeRememberPreference).toHaveBeenCalledTimes(1);
    const [calledUserId] = executeRememberPreference.mock.calls[0];
    expect(calledUserId).toBe(USER_A);
  });

  it("lists remembered preferences with no confirmation needed", async () => {
    await executeTool("list_remembered_preferences", {}, USER_A);
    expect(executeListRememberedPreferences).toHaveBeenCalledTimes(1);
  });
});

describe("aiApplicationTools.service — userId always comes from the caller, never the model", () => {
  it("passes the authenticated userId through untouched", async () => {
    await executeTool("list_todos", {}, USER_A);
    const [calledUserId] = executeListTodos.mock.calls[0];
    expect(calledUserId).toBe(USER_A);
  });

  it("ignores a userId the model tries to smuggle in via args", async () => {
    // Doc §19: "Tool access always remains restricted by server
    // authorization" — args are attacker-controlled (the model can be
    // prompt-injected into emitting anything), so even if a malicious
    // or confused tool call includes a userId/args.userId field, the
    // handler must still be invoked with the real authenticated user.
    await executeTool("list_todos", { userId: USER_B, status: "active" }, USER_A);
    const [calledUserId, calledArgs] = executeListTodos.mock.calls[0];
    expect(calledUserId).toBe(USER_A);
    expect(calledUserId).not.toBe(USER_B);
    // args pass through as-is (that's fine — it's userId specifically
    // that must never be attacker-supplied), so confirm the shape:
    expect(calledArgs.status).toBe("active");
  });

  it("a confirmed write tool also always uses the caller's userId, not args", async () => {
    await executeTool(
      "create_todo",
      { title: "x", userId: USER_B },
      USER_A,
      true,
    );
    const [calledUserId] = executeCreateTodo.mock.calls[0];
    expect(calledUserId).toBe(USER_A);
  });
});