import React, { useState } from "react";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar";
import PredictionTable from "../components/PredictionTable";
import ForecastCharts from "../components/ForecastCharts";
import { predictYear } from "../services/api";

function ForecastPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!year) return;

    const selectedYear = Number(year);
    if (selectedYear < currentYear) {
      setError(`Please enter ${currentYear} or later.`);
      return;
    }

    setLoading(true);
    setError("");
    setPredictions([]);

    try {
      const res = await predictYear(selectedYear);
      setPredictions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (predictions.length === 0) return;

    const rows = predictions.map((p) => ({
      Product: p.product,
      "Predicted Units": p.predicted_units,
      "Predicted Sales (₹)": p.predicted_sales,
      "Predicted Profit (₹)": p.predicted_profit,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Year Forecast");
    XLSX.writeFile(wb, `year_forecast_${year}.xlsx`);
  };

  return (
    <>
      <Navbar title="Full Year Sales Forecast" />

      <div className="form-container">
        <h2>Generate Year Forecast</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
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
          <button type="submit" className="btn-primary" disabled={loading} style={{ height: "42px" }}>
            {loading ? "Predicting..." : "Generate Forecast"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownload}
            disabled={predictions.length === 0 || loading}
            style={{ height: "42px", width: "auto" }}
          >
            Download Report
          </button>
        </form>
        {error && <p className="error-message" style={{ textAlign: "left", marginTop: "10px" }}>{error}</p>}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Running AI predictions for all products...
        </div>
      )}

      {predictions.length > 0 && (
        <div className="table-container">
          <div className="table-header">
            <h2>Forecast Results for {year}</h2>
          </div>
          <PredictionTable predictions={predictions} />
        </div>
      )}

      {predictions.length > 0 && <ForecastCharts predictions={predictions} />}
    </>
  );
}

export default ForecastPage;
