import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Covers Doc §16/56 "Cross-user access prevention" + Doc §49's rule
 * that "every data query must include user: req.user._id" / "never
 * allow cross-user access". This isn't a full integration test against
 * a live database — it asserts the code-level contract that matters
 * for that requirement: every read/update/delete a user can trigger by
 * ID is scoped to their own userId in the same query, not checked as a
 * separate step after fetching by ID alone (which would leak a 403 vs
 * 404 timing/existence signal and is easy to accidentally bypass).
 *
 * Two controllers are covered to show the pattern holds generally, not
 * just on the one module that happened to get written last: the new
 * Account controller, and the pre-existing Todo controller.
 */

function mockModel() {
  return {
    find: vi.fn(() => ({ sort: vi.fn().mockResolvedValue([]) })),
    findOne: vi.fn().mockResolvedValue(null),
    findOneAndUpdate: vi.fn().mockResolvedValue(null),
    findOneAndDelete: vi.fn().mockResolvedValue(null),
    countDocuments: vi.fn().mockResolvedValue(0),
  };
}

const AccountMock = mockModel();
const TodoMock = mockModel();

vi.mock("../../src/models/Account.js", () => ({ default: AccountMock }));
vi.mock("../../src/models/Todo.js", () => ({ default: TodoMock }));

const { getAccount, updateAccount, deleteAccount } = await import(
  "../../src/controllers/account.controller.js"
);
const { getTodo, updateTodo, deleteTodo } = await import(
  "../../src/controllers/todo.controller.js"
);

const USER_A = "user-a-id";
const OTHER_USERS_RESOURCE_ID = "resource-belonging-to-user-b";

function mockReqRes(overrides = {}) {
  const req = {
    auth: { user: { _id: USER_A } },
    params: { id: OTHER_USERS_RESOURCE_ID },
    body: {},
    ...overrides,
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

beforeEach(() => {
  vi.clearAllMocks();
  AccountMock.findOne.mockResolvedValue(null);
  AccountMock.findOneAndUpdate.mockResolvedValue(null);
  AccountMock.findOneAndDelete.mockResolvedValue(null);
  TodoMock.findOne.mockResolvedValue(null);
  TodoMock.findOneAndUpdate.mockResolvedValue(null);
});

describe("account.controller — every lookup is scoped to the caller's userId", () => {
  it("getAccount filters by userId in the same query as the id", async () => {
    const { req, res } = mockReqRes();
    await getAccount(req, res);

    expect(AccountMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
    );
    // Mocked model returns null (as it would for a real cross-user
    // lookup, since the userId in the filter wouldn't match) — confirm
    // that's surfaced as a plain 404, not leaked as a 403/other-user data.
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateAccount cannot be used to write to another user's account", async () => {
    const { req, res } = mockReqRes({ body: { balance: 999999 } });
    await updateAccount(req, res);

    expect(AccountMock.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
      expect.anything(),
      expect.anything(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteAccount cannot be used to delete another user's account", async () => {
    const { req, res } = mockReqRes();
    await deleteAccount(req, res);

    expect(AccountMock.findOneAndDelete).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("todo.controller — every lookup is scoped to the caller's userId", () => {
  it("getTodo filters by userId in the same query as the id", async () => {
    const { req, res } = mockReqRes();
    await getTodo(req, res);

    expect(TodoMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateTodo cannot be used to modify another user's todo", async () => {
    const { req, res } = mockReqRes({ body: { title: "hijacked" } });
    await updateTodo(req, res);

    expect(TodoMock.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
      expect.anything(),
      expect.anything(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteTodo cannot be used to delete another user's todo", async () => {
    const { req, res } = mockReqRes();
    await deleteTodo(req, res);

    expect(TodoMock.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: OTHER_USERS_RESOURCE_ID, userId: USER_A }),
      expect.anything(),
      expect.anything(),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
