import api from "./api";

/*
|--------------------------------------------------------------------------
| Finance Analytics
|--------------------------------------------------------------------------
*/

export async function getFinanceAnalytics() {
  const { data } = await api.get("/finance/analytics");

  return data.data;
}
