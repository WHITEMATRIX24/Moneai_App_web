import api from "./api";

export async function getFinanceSummary() {
  const { data } = await api.get(
    "/finance/summary"
  );

  return data.data || data;
}