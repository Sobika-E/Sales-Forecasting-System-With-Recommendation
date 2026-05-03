import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
  "#6baed6", "#fd8d3c", "#74c476", "#9e9ac8", "#e377c2",
];

function ForecastCharts({ predictions }) {
  if (!predictions || predictions.length === 0) return null;

  // Top 10 products by sales for bar chart readability
  const sorted = [...predictions].sort((a, b) => b.predicted_sales - a.predicted_sales);
  const top10 = sorted.slice(0, 10);

  // Pie data – show top 8 individually, group rest as "Others"
  const top8 = sorted.slice(0, 8);
  const othersTotal = sorted.slice(8).reduce((s, p) => s + p.predicted_sales, 0);
  const pieData = [
    ...top8.map((p) => ({ name: p.product, value: p.predicted_sales })),
    ...(othersTotal > 0 ? [{ name: "Others", value: othersTotal }] : []),
  ];

  return (
    <div style={{ marginTop: "30px" }}>
      {/* ---- Bar Chart: Top 10 Products ---- */}
      <div className="table-container" style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Top 10 Products – Sales, Units & Profit</h2>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={top10} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            <Legend verticalAlign="top" />
            <Bar dataKey="predicted_sales" name="Sales (₹)" fill="#4e79a7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="predicted_profit" name="Profit (₹)" fill="#59a14f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Units Bar Chart ---- */}
      <div className="table-container" style={{ padding: "20px", marginTop: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Top 10 Products – Predicted Units</h2>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={top10} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="predicted_units" name="Units" fill="#f28e2b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Pie Chart: Sales Distribution ---- */}
      <div className="table-container" style={{ padding: "20px", marginTop: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>Sales Distribution by Product</h2>
        <ResponsiveContainer width="100%" height={420}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ForecastCharts;
