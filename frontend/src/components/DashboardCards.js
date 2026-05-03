import React from "react";

function DashboardCards({ stats }) {
  return (
    <div className="dashboard-cards">
      <div className="stat-card blue">
        <h3>Total Products</h3>
        <div className="stat-value">{stats.total_products || 0}</div>
        <div className="stat-desc">Managed in catalog</div>
      </div>
      <div className="stat-card green">
        <h3>Total Predictions</h3>
        <div className="stat-value">{stats.total_predictions || 0}</div>
        <div className="stat-desc">AI forecasts generated</div>
      </div>
      <div className="stat-card purple">
        <h3>Latest Forecast</h3>
        <div className="stat-value">
          {stats.latest_forecast
            ? `₹${stats.latest_forecast.predicted_sales?.toLocaleString()}`
            : "N/A"}
        </div>
        <div className="stat-desc">
          {stats.latest_forecast
            ? `${stats.latest_forecast.product} (${stats.latest_forecast.year})`
            : "No predictions yet"}
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;
