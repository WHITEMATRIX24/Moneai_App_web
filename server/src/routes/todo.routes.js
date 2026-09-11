import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listTodos,
  getTodo,
  getTodoSummary,
  createTodo,
  updateTodo,
  completeTodo,
  reopenTodo,
  deleteTodo,
} from "../controllers/todo.controller.js";

const r = express.Router();

r.use(protect);

r.get("/", listTodos);
r.get("/summary", getTodoSummary);
r.get("/:id", getTodo);

r.post("/", createTodo);
r.post("/:id/complete", completeTodo);
r.post("/:id/reopen", reopenTodo);

r.patch("/:id", updateTodo);
r.delete("/:id", deleteTodo);

export default r;
