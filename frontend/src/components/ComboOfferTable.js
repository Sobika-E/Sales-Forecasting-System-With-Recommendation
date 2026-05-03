import React from "react";

function ComboOfferTable({ result, index }) {
  if (!result) return null;

  const { main_product, combo_product, discount_pct, discount_amount, combo_price, profit_after_discount } = result;
  const totalMrp = (main_product.price || 0) + (combo_product.price || 0);

  const formatCurrency = (value) =>
    `Rs ${Number(value || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;

  return (
    <div className="prediction-card combo-offer-card">
      <div className="combo-card-header">
        <div className="combo-card-title-wrap">
          <span className="combo-card-index">Offer #{index}</span>
          <h3>{combo_product.name}</h3>
        </div>
        <span className="combo-card-discount-tag">{discount_pct}% OFF</span>
      </div>

      <div className="combo-price-band">
        <div className="combo-price-item">
          <span>Total MRP</span>
          <strong>{formatCurrency(totalMrp)}</strong>
        </div>
        <div className="combo-price-item highlight">
          <span>Combo Price</span>
          <strong>{formatCurrency(combo_price)}</strong>
        </div>
        <div className="combo-save-pill">Save {formatCurrency(discount_amount)}</div>
      </div>

      <div className="combo-products-row">
        <div className="prediction-stat combo-product-stat combo-main-product">
          <div className="label">Customer Chooses</div>
          <div className="value sales combo-product-name">{main_product.name}</div>
          <div className="combo-product-meta">Price: {formatCurrency(main_product.price)}</div>
        </div>

        <div className="combo-plus-sign" aria-hidden="true">+</div>

        <div className="prediction-stat combo-product-stat combo-bundle-product">
          <div className="label">Recommended Add-on</div>
          <div className="value units combo-product-name">{combo_product.name}</div>
          <div className="combo-product-meta">
            {formatCurrency(combo_product.price)} | {combo_product.category}
          </div>
        </div>
      </div>

      <div className="prediction-stats combo-metrics-grid">
        <div className="prediction-stat">
          <div className="label">Bundle Discount</div>
          <div className="value profit combo-discount-value">{discount_pct}%</div>
          <div className="combo-stat-meta">{formatCurrency(discount_amount)} off</div>
        </div>
        <div className="prediction-stat">
          <div className="label">Effective Savings</div>
          <div className="value sales">{formatCurrency(discount_amount)}</div>
          <div className="combo-stat-meta">Compared to total MRP</div>
        </div>
        <div className="prediction-stat">
          <div className="label">Profit Retained</div>
          <div className="value units">{formatCurrency(profit_after_discount)}</div>
          <div className="combo-stat-meta">After discount</div>
        </div>
      </div>
    </div>
  );
}

export default ComboOfferTable;
