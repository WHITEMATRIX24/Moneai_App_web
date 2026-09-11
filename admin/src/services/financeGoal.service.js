import api from "./api";

/*
|--------------------------------------------------------------------------
| Get All Goals
|--------------------------------------------------------------------------
*/

export async function getGoals() {
  const { data } = await api.get("/finance/goals");
  return data.data;
}

/*
|--------------------------------------------------------------------------
| Get Goal
|--------------------------------------------------------------------------
*/

export async function getGoal(id) {
  const { data } = await api.get(
    `/finance/goals/${id}`
  );

  return data.data;
}

/*
|--------------------------------------------------------------------------
| Create Goal
|--------------------------------------------------------------------------
*/

export async function createGoal(goal) {
  const { data } = await api.post(
    "/finance/goals",
    goal
  );

  return data.data;
}

/*
|--------------------------------------------------------------------------
| Update Goal
|--------------------------------------------------------------------------
*/

export async function updateGoal(id, goal) {
  const { data } = await api.put(
    `/finance/goals/${id}`,
    goal
  );

  return data.data;
}

/*
|--------------------------------------------------------------------------
| Archive Goal
|--------------------------------------------------------------------------
*/

export async function archiveGoal(id) {
  const { data } = await api.patch(
    `/finance/goals/${id}/archive`
  );

  return data.data;
}