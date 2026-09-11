import Todo from "../models/Todo.js";

export async function listTodos(req, res) {
  try {
    const { status } = req.query;
    const q = { userId: req.auth.user._id, deletedAt: null };

    if (status === "active") q.completed = false;
    if (status === "completed") q.completed = true;

    const todos = await Todo.find(q).sort({ createdAt: -1 });
    return res.json({ todos });
  } catch (error) {
    console.error("listTodos error:", error);
    return res.status(500).json({ message: "Failed to list todos" });
  }
}

export async function getTodo(req, res) {
  try {
    const t = await Todo.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
      deletedAt: null,
    });
    if (!t) return res.status(404).json({ message: "Todo not found" });
    return res.json(t);
  } catch (error) {
    console.error("getTodo error:", error);
    return res.status(500).json({ message: "Failed to get todo" });
  }
}

export async function createTodo(req, res) {
  try {
    const todo = await Todo.create({ userId: req.auth.user._id, ...req.body });
    return res.status(201).json(todo);
  } catch (error) {
    console.error("createTodo error:", error);
    return res.status(500).json({ message: error.message || "Failed to create todo" });
  }
}

export async function updateTodo(req, res) {
  try {
    const t = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.user._id, deletedAt: null },
      req.body,
      { new: true },
    );
    if (!t) return res.status(404).json({ message: "Todo not found" });
    return res.json(t);
  } catch (error) {
    console.error("updateTodo error:", error);
    return res.status(500).json({ message: "Failed to update todo" });
  }
}

export async function completeTodo(req, res) {
  try {
    const t = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.user._id, deletedAt: null },
      { completed: true, completedAt: new Date() },
      { new: true },
    );
    if (!t) return res.status(404).json({ message: "Todo not found" });
    return res.json(t);
  } catch (error) {
    console.error("completeTodo error:", error);
    return res.status(500).json({ message: "Failed to complete todo" });
  }
}

export async function reopenTodo(req, res) {
  try {
    const t = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.user._id, deletedAt: null },
      { completed: false, completedAt: null },
      { new: true },
    );
    if (!t) return res.status(404).json({ message: "Todo not found" });
    return res.json(t);
  } catch (error) {
    console.error("reopenTodo error:", error);
    return res.status(500).json({ message: "Failed to reopen todo" });
  }
}

export async function deleteTodo(req, res) {
  try {
    const t = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );
    if (!t) return res.status(404).json({ message: "Todo not found" });
    return res.json({ message: "Todo deleted" });
  } catch (error) {
    console.error("deleteTodo error:", error);
    return res.status(500).json({ message: "Failed to delete todo" });
  }
}

export async function getTodoSummary(req, res) {
  try {
    const userId = req.auth.user._id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [dueToday, completedCount, overdue] = await Promise.all([
      Todo.countDocuments({
        userId,
        deletedAt: null,
        completed: false,
        dueAt: { $gte: startOfToday, $lte: endOfToday },
      }),
      Todo.countDocuments({ userId, deletedAt: null, completed: true }),
      Todo.countDocuments({
        userId,
        deletedAt: null,
        completed: false,
        dueAt: { $lt: startOfToday },
      }),
    ]);

    return res.json({ dueToday, completed: completedCount, overdue });
  } catch (error) {
    console.error("getTodoSummary error:", error);
    return res.status(500).json({ message: "Failed to get todo summary" });
  }
}

