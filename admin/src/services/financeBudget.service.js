import api from "./api";

export async function getBudgets() {
  const { data } = await api.get("/finance/budgets");
  return data.data;
}

export async function createBudget(budget) {
  const { data } = await api.post("/finance/budgets", budget);
  return data.data;
}

export async function updateBudget(id, budget) {
  const { data } = await api.put(
    `/finance/budgets/${id}`,
    budget
  );
  return data.data;
}

export async function archiveBudget(id) {
  const { data } = await api.patch(
    `/finance/budgets/${id}/archive`
  );
  return data;
}