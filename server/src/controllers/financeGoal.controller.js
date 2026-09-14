import User from "../models/User.js";
import {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  archiveGoal,
} from "../services/financeGoal.service.js";

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
| List Goals
|--------------------------------------------------------------------------
*/

export async function listGoals(req, res) {
  try {
    const userId = getTargetUserId(req);
    const goals = await getAllGoals(userId);

    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch goals.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Get Goal
|--------------------------------------------------------------------------
*/

export async function getGoal(req, res) {
  try {
    const userId = getTargetUserId(req);
    const goal = await getGoalById(req.params.id, userId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch goal.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Create Goal
|--------------------------------------------------------------------------
*/

export async function addGoal(req, res) {
  try {
    const payload = { ...req.body };
    payload.userId = await resolveUserId(req);

    const goal = await createGoal(payload);

    return res.status(201).json({
      success: true,
      message: "Goal created successfully.",
      data: goal,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create goal.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Update Goal
|--------------------------------------------------------------------------
*/

export async function editGoal(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.body?.userId || req.query?.userId || null);
    const goal = await updateGoal(req.params.id, req.body, userId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Goal updated successfully.",
      data: goal,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "Goal not found.") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update goal.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Archive Goal
|--------------------------------------------------------------------------
*/

export async function removeGoal(req, res) {
  try {
    const userId = req.auth?.type === "user" ? req.auth.user._id : (req.query?.userId || null);
    const goal = await archiveGoal(req.params.id, userId);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Goal archived successfully.",
      data: goal,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive goal.",
    });
  }
}
