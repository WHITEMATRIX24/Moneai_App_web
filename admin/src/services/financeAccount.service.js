import api from "./api";

export async function getAccounts() {
  const { data } = await api.get("/finance/accounts");
  return data.data;
}

export async function createAccount(account) {
  const { data } = await api.post("/finance/accounts", account);
  return data.data;
}

export async function updateAccount(id, account) {
  const { data } = await api.put(`/finance/accounts/${id}`, account);
  return data.data;
}

export async function archiveAccount(id) {
  const { data } = await api.patch(`/finance/accounts/${id}/archive`);
  return data.data;
}