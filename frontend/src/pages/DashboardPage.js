import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";
import HistoryTable from "../components/HistoryTable";
import { getDashboardStats, getPredictionHistory } from "../services/api";

function DashboardPage() {
  const [stats, setStats] = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, historyRes] = await Promise.all([
          getDashboardStats(),
          getPredictionHistory(),
        ]);
        setStats(statsRes.data);
        setRecentHistory(historyRes.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar title="Dashboard" />
        <div className="loading">
          <div className="spinner"></div>
          Loading dashboard...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Dashboard" />
      <DashboardCards stats={stats} />

      <div className="table-container">
        <div className="table-header">
          <h2>Recent Predictions</h2>
        </div>
        <HistoryTable history={recentHistory} />
      </div>
    </>
  );
}

export default DashboardPage;
