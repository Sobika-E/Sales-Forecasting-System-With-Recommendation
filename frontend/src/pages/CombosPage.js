import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ComboOfferTable from "../components/ComboOfferTable";
import { getLowSellers, getProducts } from "../services/api";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function computeCombo(mainProduct, lowSeller) {
  const low_price = lowSeller.price;
  const low_profit = lowSeller.predicted_profit;
  let discount_pct = Math.min((low_profit / low_price) * 100 * 0.6, 30);
  discount_pct = Math.max(Math.round(discount_pct), 5);
  const discount_amount = Math.round(low_price * discount_pct / 100 * 100) / 100;
  const combo_price = Math.round((mainProduct.price + low_price - discount_amount) * 100) / 100;
  const profit_after_discount = Math.round(low_profit - discount_amount);
  return {
    main_product: { name: mainProduct.name, price: mainProduct.price },
    combo_product: {
      name: lowSeller.product,
      category: lowSeller.category,
      price: lowSeller.price,
    },
    discount_pct,
    discount_amount,
    combo_price,
    profit_after_discount,
  };
}

function CombosPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [lowSellers, setLowSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [mainProduct, setMainProduct] = useState("");
  const [comboResults, setComboResults] = useState([]);
  const [loadingLow, setLoadingLow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  const fetchLowSellers = async () => {
    if (year < currentYear) {
      setError(`Please enter ${currentYear} or later.`);
      return;
    }
    setLoadingLow(true);
    setError("");
    setLowSellers([]);
    setComboResults([]);
    setMainProduct("");
    try {
      const res = await getLowSellers(year, month);
      setLowSellers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load low sellers");
    } finally {
      setLoadingLow(false);
    }
  };

  const handleGenerateAll = () => {
    const main = products.find((p) => p.name === mainProduct);
    if (!main) {
      setError("Please select the product the customer is buying.");
      return;
    }
    setError("");
    const results = lowSellers
      .filter((ls) => ls.product !== main.name)
      .map((ls) => computeCombo(main, ls));
    setComboResults(results);
  };

  const selectedMonthLabel = months.find((m) => m.value === month)?.label || "";

  return (
    <>
      <Navbar title="Combo Offers" />

      {/* Step 1: Year + Month */}
      <div className="step-section">
        <p className="step-description">
          Step 1: Enter a future month to see products predicted to sell the least.
        </p>
        <div className="step-inputs">
          <div className="input-group">
            <label>Year:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={currentYear}
              max={2040}
              className="input-small"
            />
          </div>
          <div className="input-group">
            <label>Month:</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="select-small"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={fetchLowSellers} disabled={loadingLow}>
            {loadingLow ? "Loading..." : "Show Low Sellers"}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      {loadingLow && (
        <div className="loading">
          <div className="spinner"></div>
          Predicting low sellers...
        </div>
      )}

      {/* Low Sellers Cards */}
      {lowSellers.length > 0 && (
        <div className="table-container">
          <div className="table-header">
            <h2>Lowest Predicted Sellers — {selectedMonthLabel} {year}</h2>
          </div>
          <div className="low-seller-cards-grid">
            {lowSellers.map((p, i) => (
              <div className="low-seller-card" key={i}>
                <div className="low-seller-card-rank">#{i + 1}</div>
                <h3 className="low-seller-card-name">{p.product}</h3>
                <div className="low-seller-card-meta">{p.category} · {p.season}</div>
                <div className="low-seller-card-price">₹{p.price?.toLocaleString()}</div>
                <div className="low-seller-card-stats">
                  <div className="low-seller-stat">
                    <span className="low-seller-stat-label">Units</span>
                    <span className="low-seller-stat-value units">{p.predicted_units?.toLocaleString()}</span>
                  </div>
                  <div className="low-seller-stat">
                    <span className="low-seller-stat-label">Sales</span>
                    <span className="low-seller-stat-value sales">₹{p.predicted_sales?.toLocaleString()}</span>
                  </div>
                  <div className="low-seller-stat">
                    <span className="low-seller-stat-label">Profit</span>
                    <span className="low-seller-stat-value profit">₹{p.predicted_profit?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: User's product → generate all combos */}
      {lowSellers.length > 0 && (
        <div className="form-container">
          <h2>Step 2: Select the Product the Customer is Buying</h2>
          <p className="step-description">
            Choose what the customer is purchasing. The system will pair it with every low seller above and calculate a smart discount for each.
          </p>
          <div className="step-inputs step-inputs-flex">
            <div className="form-group form-group-flex">
              <label>Customer's Current Product</label>
              <select
                value={mainProduct}
                onChange={(e) => { setMainProduct(e.target.value); setComboResults([]); }}
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p._id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary btn-generate"
              onClick={handleGenerateAll}
              disabled={!mainProduct}
            >
              Generate All Combo Offers
            </button>
          </div>
        </div>
      )}

      {comboResults.length > 0 && (
        <div className="combo-results-section">
          <div className="combo-results-header">
            <h2 className="combo-results-title">
              Combo Offers for "{mainProduct}" - {selectedMonthLabel} {year}
            </h2>
            <span className="combo-results-count">{comboResults.length} offers</span>
          </div>
          <p className="combo-results-subtitle">
            Share these bundles at billing to increase cart value while moving low-selling products.
          </p>
          <div className="combo-results-grid">
            {comboResults.map((result, i) => (
              <ComboOfferTable key={i} result={result} index={i + 1} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default CombosPage;
