import React from "react";

function PredictionTable({ predictions }) {
  if (predictions.length === 0) {
    return <p className="empty-state">No forecast data available.</p>;
  }

  const totalUnits  = predictions.reduce((sum, p) => sum + p.predicted_units,  0);
  const totalSales  = predictions.reduce((sum, p) => sum + p.predicted_sales,  0);
  const totalProfit = predictions.reduce((sum, p) => sum + p.predicted_profit, 0);

  return (
    <div>
      {/* Summary total card */}
      <div className="forecast-total-card">
        <h3 className="forecast-total-label">Overall Forecast Total</h3>
        <div className="forecast-total-stats">
          <div className="forecast-total-stat">
            <span className="forecast-total-stat-label">Total Units</span>
            <span className="forecast-total-stat-value units">{totalUnits.toLocaleString()}</span>
          </div>
          <div className="forecast-total-stat">
            <span className="forecast-total-stat-label">Total Sales</span>
            <span className="forecast-total-stat-value sales">₹{totalSales.toLocaleString()}</span>
          </div>
          <div className="forecast-total-stat">
            <span className="forecast-total-stat-label">Total Profit</span>
            <span className="forecast-total-stat-value profit">₹{totalProfit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Per-product forecast cards */}
      <div className="forecast-cards-grid">
        {predictions.map((p, i) => (
          <div className="forecast-card" key={i}>
            <div className="forecast-card-rank">#{i + 1}</div>
            <h3 className="forecast-card-name">{p.product}</h3>
            <div className="forecast-card-stats">
              <div className="forecast-card-stat">
                <span className="forecast-stat-label">Units</span>
                <span className="forecast-stat-value units">{p.predicted_units?.toLocaleString()}</span>
              </div>
              <div className="forecast-card-stat">
                <span className="forecast-stat-label">Sales</span>
                <span className="forecast-stat-value sales">₹{p.predicted_sales?.toLocaleString()}</span>
              </div>
              <div className="forecast-card-stat">
                <span className="forecast-stat-label">Profit</span>
                <span className="forecast-stat-value profit">₹{p.predicted_profit?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PredictionTable;
