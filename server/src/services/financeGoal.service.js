import FinanceGoal from "../models/FinanceGoal.js";

/*
|--------------------------------------------------------------------------
| Get All Goals
|--------------------------------------------------------------------------
*/

export async function getAllGoals() {
  return await FinanceGoal.find({
    archived: false,
  }).sort({
    createdAt: -1,
  });
}

/*
|--------------------------------------------------------------------------
| Get Goal By ID
|--------------------------------------------------------------------------
*/

export async function getGoalById(id) {
  return await FinanceGoal.findById(id);
}

/*
|--------------------------------------------------------------------------
| Create Goal
|--------------------------------------------------------------------------
*/

export async function createGoal(data) {

  if (
    !data.goalName ||
    !data.goalName.trim()
  ) {
    throw new Error(
      "Goal name is required."
    );
  }

  const targetAmount =
    Number(data.targetAmount);

  const savedAmount =
    Number(data.savedAmount ?? 0);

  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    throw new Error(
      "Target amount must be greater than zero."
    );
  }

  if (
    !Number.isFinite(savedAmount) ||
    savedAmount < 0
  ) {
    throw new Error(
      "Saved amount cannot be negative."
    );
  }

  if (savedAmount > targetAmount) {
    throw new Error(
      "Saved amount cannot exceed target amount."
    );
  }

  if (!data.targetDate) {
    throw new Error(
      "Target date is required."
    );
  }

  const targetDate =
    new Date(data.targetDate);

  if (isNaN(targetDate.getTime())) {
    throw new Error(
      "Invalid target date."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  let status =
    data.status || "In Progress";

  if (status === "Cancelled") {
    status = "Cancelled";
  } else if (status === "Completed") {
    status = "Completed";
  } else if (
    savedAmount >= targetAmount
  ) {
    status = "Completed";
  } else {
    status = "In Progress";
  }

  const duplicate =
    await FinanceGoal.findOne({
      userId: data.userId,
      goalName: data.goalName.trim(),
      archived: false,
    });

  if (duplicate) {
    throw new Error(
      "A goal with this name already exists."
    );
  }

  return await FinanceGoal.create({
    userId: data.userId,

    goalName:
      data.goalName.trim(),

    targetAmount,

    savedAmount,

    targetDate,

    status,

    archived: false,
  });
}

/*
|--------------------------------------------------------------------------
| Update Goal
|--------------------------------------------------------------------------
*/

export async function updateGoal(
  id,
  data
) {

  const existing =
    await FinanceGoal.findById(id);

  if (!existing) {
    throw new Error(
      "Goal not found."
    );
  }

  const targetAmount =
    data.targetAmount !== undefined
      ? Number(data.targetAmount)
      : Number(existing.targetAmount);

  const savedAmount =
    data.savedAmount !== undefined
      ? Number(data.savedAmount)
      : Number(existing.savedAmount);

  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    throw new Error(
      "Target amount must be greater than zero."
    );
  }

  if (
    !Number.isFinite(savedAmount) ||
    savedAmount < 0
  ) {
    throw new Error(
      "Saved amount cannot be negative."
    );
  }

  if (savedAmount > targetAmount) {
    throw new Error(
      "Saved amount cannot exceed target amount."
    );
  }

  const goalName =
    data.goalName !== undefined
      ? data.goalName.trim()
      : existing.goalName;

  if (!goalName) {
    throw new Error(
      "Goal name is required."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT STATUS LOGIC
  |--------------------------------------------------------------------------
  */

  let status =
    data.status ||
    existing.status ||
    "In Progress";

  if (status === "Cancelled") {

    status = "Cancelled";

  } else if (status === "Completed") {

    status = "Completed";

  } else if (
    savedAmount >= targetAmount
  ) {

    status = "Completed";

  } else {

    status = "In Progress";

  }

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  const updatedGoal =
    await FinanceGoal.findByIdAndUpdate(
      id,

      {
        userId:
          data.userId ||
          existing.userId,

        goalName,

        targetAmount,

        savedAmount,

        targetDate:
          data.targetDate ||
          existing.targetDate,

        status,

        archived:
          existing.archived,
      },

      {
        new: true,
        runValidators: true,
      }
    );

  return updatedGoal;
}

/*
|--------------------------------------------------------------------------
| Archive Goal
|--------------------------------------------------------------------------
*/

export async function archiveGoal(id) {

  return await FinanceGoal.findByIdAndUpdate(
    id,

    {
      archived: true,
    },

    {
      new: true,
    }
  );
}