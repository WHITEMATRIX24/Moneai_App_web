import api from "./api";

/*
|--------------------------------------------------------------------------
| Finance Summary
|--------------------------------------------------------------------------
*/

export async function getFinanceSummary() {
  const { data } = await api.get("/finance/summary");
  return data.data;
}

/*
|--------------------------------------------------------------------------
| Transactions
|--------------------------------------------------------------------------
*/

export async function getTransactions() {
  const { data } = await api.get("/finance/transactions");
  return data.data;
}

export async function createTransaction(transaction) {
  const { data } = await api.post(
    "/finance/transactions",
    transaction
  );

  return data.data;
}

/*
|--------------------------------------------------------------------------
| Update Transaction
|--------------------------------------------------------------------------
*/

export async function updateTransaction(id, transaction) {
  const { data } = await api.put(
    `/finance/transactions/${id}`,
    transaction
  );

  return data.data;
}

/*
|--------------------------------------------------------------------------
| Delete Transaction
|--------------------------------------------------------------------------
*/

export async function deleteTransaction(id) {
  const { data } = await api.delete(
    `/finance/transactions/${id}`
  );

  return data;
}