import React from "react";

function HistoryTable({ history }) {
  if (history.length === 0) {
    return <p className="empty-state">No prediction history available.</p>;
  }

  return (
    <div className="history-cards-grid">
      {history.map((h) => (
        <div className="history-card" key={h._id}>
          <div className="history-card-header">
            <h3 className="history-card-product">{h.product}</h3>
            <span className="history-card-year">{h.year}</span>
          </div>
          <div className="history-card-stats">
            <div className="history-stat">
              <span className="history-stat-label">Units</span>
              <span className="history-stat-value units">{h.predicted_units?.toLocaleString()}</span>
            </div>
            <div className="history-stat">
              <span className="history-stat-label">Sales</span>
              <span className="history-stat-value sales">₹{h.predicted_sales?.toLocaleString()}</span>
            </div>
            <div className="history-stat">
              <span className="history-stat-label">Profit</span>
              <span className="history-stat-value profit">₹{h.predicted_profit?.toLocaleString()}</span>
            </div>
          </div>
          <div className="history-card-date">
            {h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryTable;
