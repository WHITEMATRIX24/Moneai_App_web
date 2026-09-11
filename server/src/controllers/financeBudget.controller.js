import User from "../models/User.js";
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  archiveBudget,
} from "../services/financeBudget.service.js";

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
  return req.auth?.user?._id || null;
}

async function resolveUserId(req) {
  if (req.auth?.type === "user" && req.auth?.user?._id) {
    return req.auth.user._id;
  }

  if (req.body?.userId && req.body.userId !== "000000000000000000000001") {
    return req.body.userId;
  }

  if (req.auth?.user?._id) {
    return req.auth.user._id;
  }

  try {
    const firstUser = await User.findOne().select("_id");
    if (firstUser) return firstUser._id;
  } catch {}

  return req.body?.userId || "000000000000000000000001";
}

/*
|--------------------------------------------------------------------------
| List Budgets
|--------------------------------------------------------------------------
*/

export async function listBudgets(req, res) {
  try {
    const userId = getTargetUserId(req);
    const budgets = await getAllBudgets(userId);

    return res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Get Budget
|--------------------------------------------------------------------------
*/

export async function getBudget(req, res) {
  try {
    const userId = getTargetUserId(req);
    const budget = await getBudgetById(req.params.id, userId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch budget.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Create Budget
|--------------------------------------------------------------------------
*/

export async function addBudget(req, res) {
  try {
    const payload = { ...req.body };
    payload.userId = await resolveUserId(req);

    const budget = await createBudget(payload);

    return res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      data: budget,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create budget.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Update Budget
|--------------------------------------------------------------------------
*/

export async function editBudget(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.body?.userId || req.query?.userId || null);
    const budget = await updateBudget(req.params.id, req.body, userId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      data: budget,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "Budget not found.") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update budget.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Archive Budget
|--------------------------------------------------------------------------
*/

export async function removeBudget(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.query?.userId || null);
    const budget = await archiveBudget(req.params.id, userId);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget archived successfully.",
      data: budget,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive budget.",
    });
  }
}
