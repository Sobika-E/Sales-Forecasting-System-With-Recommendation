import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar";
import { predictProductMonthly, getProducts } from "../services/api";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#e11d48"];

function PredictPage() {
  const currentYear = new Date().getFullYear();
  const [productName, setProductName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthOptions = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName || !year || !month) {
      setError("Please select a product, year, and month");
      return;
    }
    setLoading(true);
    setError("");
    setPrediction(null);
    setMonthlyData([]);

    try {
      const selectedYear = parseInt(year, 10);
      const selectedMonth = parseInt(month, 10);

      if (selectedYear < currentYear) {
        setError(`Please enter ${currentYear} or later.`);
        return;
      }

      const monthlyRes = await predictProductMonthly(productName, selectedYear);
      const monthly = monthlyRes.data.monthly || [];
      const selectedMonthData = monthly[selectedMonth - 1];

      if (!selectedMonthData) {
        setError("Unable to find prediction data for selected month");
        return;
      }

      setMonthlyData(monthly);
      setPrediction({
        product: monthlyRes.data.product || productName,
        year: selectedYear,
        month: selectedMonth,
        month_name: selectedMonthData.month,
        predicted_units: selectedMonthData.units,
        predicted_sales: selectedMonthData.sales,
        predicted_profit: selectedMonthData.profit,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const pieData = prediction
    ? [
        { name: "Profit", value: prediction.predicted_profit },
        { name: "Cost", value: prediction.predicted_sales - prediction.predicted_profit },
      ]
    : [];

  const handleDownload = () => {
    if (!prediction) return;

    const rows = [
      {
        Product: prediction.product,
        Year: prediction.year,
        Month: prediction.month_name,
        "Predicted Units": prediction.predicted_units,
        "Predicted Sales (₹)": prediction.predicted_sales,
        "Predicted Profit (₹)": prediction.predicted_profit,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 8 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prediction");
    XLSX.writeFile(wb, `${prediction.product}_prediction_${prediction.year}.xlsx`);
  };

  return (
    <>
      <Navbar title="Product Sales Prediction" />

      <div className="form-container">
        <h2>Predict Product Sales</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p._id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2027"
                min={currentYear}
                max="2100"
                required
              />
            </div>
            <div className="form-group">
              <label>Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              >
                <option value="">Select Month</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Predicting..." : "Predict Sales"}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={!prediction || loading}
              style={{ width: "auto" }}
            >
              Download Report
            </button>
          </div>
        </form>
        {error && <p className="error-message" style={{ textAlign: "left", marginTop: "10px" }}>{error}</p>}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Running AI prediction...
        </div>
      )}

      {prediction && (
        <>
          <div className="prediction-card">
            <h3>
              Prediction Result: {prediction.product}
              {prediction.month_name ? ` (${prediction.month_name} ${prediction.year})` : ""}
            </h3>
            <div className="prediction-stats">
              <div className="prediction-stat">
                <div className="label">Predicted Units</div>
                <div className="value units">{prediction.predicted_units?.toLocaleString()}</div>
              </div>
              <div className="prediction-stat">
                <div className="label">Predicted Sales</div>
                <div className="value sales">₹{prediction.predicted_sales?.toLocaleString()}</div>
              </div>
              <div className="prediction-stat">
                <div className="label">Predicted Profit</div>
                <div className="value profit">₹{prediction.predicted_profit?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {monthlyData.length > 0 && (
            <div className="charts-grid">
              {/* Monthly Sales Bar Chart */}
              <div className="chart-card">
                <h3>Monthly Sales Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      formatter={(value) => ["₹" + value.toLocaleString(), undefined]}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="Sales (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Units Line Chart */}
              <div className="chart-card">
                <h3>Monthly Units Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="units"
                      name="Units Sold"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Sales Area Chart */}
              <div className="chart-card">
                <h3>Sales & Profit Area</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      formatter={(value) => ["₹" + value.toLocaleString(), undefined]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Sales" stroke="#6366f1" fill="url(#salesGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Profit vs Cost Pie Chart */}
              <div className="chart-card">
                <h3>Profit vs Cost Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      formatter={(value) => "₹" + value.toLocaleString()}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default PredictPage;
