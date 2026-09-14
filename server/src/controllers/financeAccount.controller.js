import User from "../models/User.js";
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  archiveAccount,
} from "../services/financeAccount.service.js";

/*
|--------------------------------------------------------------------------
| Helper - Resolve User ID
|--------------------------------------------------------------------------
*/

export function getTargetUserId(req) {
  if (req.auth?.type === "user" && req.auth?.user?._id) {
    return req.auth.user._id;
  }
  if (req.query?.userId) {
    return req.query.userId;
  }
  if (req.auth?.type === "admin") {
    return null;
  }
  return req.auth?.user?._id || null;
}

async function resolveUserId(req) {
  if (req.auth?.type === "user" && req.auth?.user?._id) {
    return req.auth.user._id;
  }

  if (req.body?.userId && req.body.userId !== "000000000000000000000001") {
    return req.body.userId;
  }

  try {
    const firstUser = await User.findOne().select("_id");
    if (firstUser) return firstUser._id;
  } catch {}

  if (req.auth?.user?._id) {
    return req.auth.user._id;
  }

  return req.body?.userId || "000000000000000000000001";
}

/*
|--------------------------------------------------------------------------
| List Accounts
|--------------------------------------------------------------------------
*/

export async function listAccounts(req, res) {
  try {
    const userId = getTargetUserId(req);
    const accounts = await getAllAccounts(userId);

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Get Account
|--------------------------------------------------------------------------
*/

export async function getAccount(req, res) {
  try {
    const userId = getTargetUserId(req);
    const account = await getAccountById(req.params.id, userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Create Account
|--------------------------------------------------------------------------
*/

export async function addAccount(req, res) {
  try {
    const payload = { ...req.body };
    payload.userId = await resolveUserId(req);

    const account = await createAccount(payload);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: account,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Update Account
|--------------------------------------------------------------------------
*/

export async function editAccount(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.body?.userId || req.query?.userId || null);
    const account = await updateAccount(
      req.params.id,
      req.body,
      userId
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully.",
      data: account,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update account.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Archive Account
|--------------------------------------------------------------------------
*/

export async function removeAccount(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.query?.userId || null);
    const account = await archiveAccount(req.params.id, userId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account archived successfully.",
      data: account,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to archive account.",
    });
  }
}