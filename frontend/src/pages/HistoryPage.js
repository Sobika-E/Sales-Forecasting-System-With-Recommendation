import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import HistoryTable from "../components/HistoryTable";
import { getPredictionHistory } from "../services/api";

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await getPredictionHistory();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Prediction History" />
        <div className="loading">
          <div className="spinner"></div>
          Loading prediction history...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Prediction History" />
      <div className="table-container">
        <div className="table-header">
          <h2>All Predictions ({history.length})</h2>
        </div>
        <HistoryTable history={history} />
      </div>
    </>
  );
}

export default HistoryPage;
