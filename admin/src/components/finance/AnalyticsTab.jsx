import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  getFinanceAnalytics,
} from "../../services/financeAnalytics.service.js";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#9333ea",
  "#0ea5e9",
];

export default function AnalyticsTab() {

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadAnalytics();

  }, []);

  async function loadAnalytics() {

    try {

      const data =
        await getFinanceAnalytics();

      setAnalytics(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (
      <div className="accounts-table-card">

        <h2>
          Loading Analytics...
        </h2>

      </div>
    );

  }

  if (!analytics) {

    return (
      <div className="accounts-table-card">

        <h2>
          No analytics available
        </h2>

      </div>
    );

  }

  const summary =
    analytics.summary || {};

  const monthlyTrend =
    analytics.monthlyTrend || [];

  const expenseByCategory =
    analytics.expenseByCategory || {};

  const pieData =
    Object.entries(
      expenseByCategory
    ).map(([name, value]) => ({
      name,
      value,
    }));

  const highestExpense =
    pieData.length
      ? pieData.reduce(
          (a, b) =>
            a.value > b.value
              ? a
              : b
        )
      : null;

  return (

    <div>

  <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  }}
>

  <div className="accounts-table-card">

    <h2>Income vs Expense Trend</h2>

    <ResponsiveContainer
      width="100%"
      height={320}
    >

      <AreaChart data={monthlyTrend}>

        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="month" />

        <YAxis />

        <Tooltip />

        <Legend />

        <Area
          type="monotone"
          dataKey="income"
          stroke="#16a34a"
          fill="#16a34a33"
        />

        <Area
          type="monotone"
          dataKey="expense"
          stroke="#dc2626"
          fill="#dc262633"
        />

      </AreaChart>

    </ResponsiveContainer>

  </div>

  <div className="accounts-table-card">

    <h2>Expense by Category</h2>

    {pieData.length === 0 ? (

      <div
        style={{
          height: 320,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#888",
          fontSize: "16px",
        }}
      >

        No expense data available

      </div>

    ) : (

      <ResponsiveContainer
        width="100%"
        height={320}
      >

        <PieChart>

          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            outerRadius={110}
            label
          >

            {pieData.map((entry, index) => (

              <Cell
                key={index}
                fill={
                  COLORS[index % COLORS.length]
                }
              />

            ))}

          </Pie>

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    )}

  </div>

</div>

<div
  className="accounts-table-card"
  style={{
    marginTop: "20px",
  }}
>

  <h2>Finance Insights</h2>

  <table className="accounts-table">

    <tbody>

      <tr>

        <td>Top Expense Category</td>

        <td>

          {highestExpense
            ? highestExpense.name
            : "No Expense"}

        </td>

      </tr>

      <tr>

        <td>Top Expense Amount</td>

        <td>

          ₹
          {highestExpense
            ? Number(
                highestExpense.value
              ).toLocaleString()
            : 0}

        </td>

      </tr>

      <tr>

        <td>Expense Categories</td>

        <td>{pieData.length}</td>

      </tr>

      <tr>

        <td>Months Analysed</td>

        <td>{monthlyTrend.length}</td>

      </tr>

      <tr>

        <td>Total Income</td>

        <td>

          ₹
          {Number(
            summary.income || 0
          ).toLocaleString()}

        </td>

      </tr>

      <tr>

        <td>Total Expense</td>

        <td>

          ₹
          {Number(
            summary.expense || 0
          ).toLocaleString()}

        </td>

      </tr>

      <tr>

        <td>Total Savings</td>

        <td>

          ₹
          {Number(
            summary.savings || 0
          ).toLocaleString()}

        </td>

      </tr>

      <tr>

        <td>Net Worth</td>

        <td>

          ₹
          {Number(
            summary.netWorth || 0
          ).toLocaleString()}

        </td>

      </tr>

    </tbody>

  </table>

</div>

</div>

  );

}