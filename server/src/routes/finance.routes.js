import express from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";

import {
  listTransactions,
  financeSummary,
  addTransaction,
  editTransaction,
  removeTransaction,
  importStatement,
} from "../controllers/finance.controller.js";

import {
  listAccounts,
  getAccount,
  addAccount,
  editAccount,
  removeAccount,
} from "../controllers/financeAccount.controller.js";

import {
  listBudgets,
  getBudget,
  addBudget,
  editBudget,
  removeBudget,
} from "../controllers/financeBudget.controller.js";

import {
  listGoals,
  getGoal,
  addGoal,
  editGoal,
  removeGoal,
} from "../controllers/financeGoal.controller.js";

import { analytics } from "../controllers/financeAnalytics.controller.js";
import { getFinanceSummary } from "../controllers/financeSummary.controller.js";

import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TRANSACTIONS
|--------------------------------------------------------------------------
*/
router.get("/transactions", optionalAuth, listTransactions);
router.post("/transactions", optionalAuth, addTransaction);
router.put("/transactions/:id", optionalAuth, editTransaction);
router.delete("/transactions/:id", optionalAuth, removeTransaction);
router.post(
  "/transactions/import",
  optionalAuth,
  upload.single("statement"),
  importStatement
);

// Base route fallback to transactions
router.get("/", optionalAuth, listTransactions);
router.post("/", optionalAuth, addTransaction);

/*
|--------------------------------------------------------------------------
| SUMMARY & ANALYTICS
|--------------------------------------------------------------------------
*/
router.get("/summary", optionalAuth, financeSummary);
router.get("/analytics", optionalAuth, analytics);

/*
|--------------------------------------------------------------------------
| ACCOUNTS
|--------------------------------------------------------------------------
*/
router.get("/accounts", optionalAuth, listAccounts);
router.get("/accounts/:id", optionalAuth, getAccount);
router.post("/accounts", optionalAuth, addAccount);
router.put("/accounts/:id", optionalAuth, editAccount);
router.patch("/accounts/:id/archive", optionalAuth, removeAccount);
router.delete("/accounts/:id", optionalAuth, removeAccount);

/*
|--------------------------------------------------------------------------
| BUDGETS
|--------------------------------------------------------------------------
*/
router.get("/budgets", optionalAuth, listBudgets);
router.get("/budgets/:id", optionalAuth, getBudget);
router.post("/budgets", optionalAuth, addBudget);
router.put("/budgets/:id", optionalAuth, editBudget);
router.delete("/budgets/:id", optionalAuth, removeBudget);
router.patch("/budgets/:id/archive", optionalAuth, removeBudget);

/*
|--------------------------------------------------------------------------
| GOALS
|--------------------------------------------------------------------------
*/
router.get("/goals", optionalAuth, listGoals);
router.get("/goals/:id", optionalAuth, getGoal);
router.post("/goals", optionalAuth, addGoal);
router.put("/goals/:id", optionalAuth, editGoal);
router.delete("/goals/:id", optionalAuth, removeGoal);
router.patch("/goals/:id/archive", optionalAuth, removeGoal);

export default router;
