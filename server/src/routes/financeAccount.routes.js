import express from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";

import {
  listAccounts,
  getAccount,
  addAccount,
  editAccount,
  removeAccount,
} from "../controllers/financeAccount.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| List Accounts
|--------------------------------------------------------------------------
*/

router.get("/", optionalAuth, listAccounts);

/*
|--------------------------------------------------------------------------
| Get Single Account
|--------------------------------------------------------------------------
*/

router.get("/:id", optionalAuth, getAccount);

/*
|--------------------------------------------------------------------------
| Create Account
|--------------------------------------------------------------------------
*/

router.post("/", optionalAuth, addAccount);

/*
|--------------------------------------------------------------------------
| Update Account
|--------------------------------------------------------------------------
*/

router.put("/:id", optionalAuth, editAccount);

/*
|--------------------------------------------------------------------------
| Archive Account
|--------------------------------------------------------------------------
*/

router.patch("/:id/archive", optionalAuth, removeAccount);
router.delete("/:id", optionalAuth, removeAccount);

export default router;