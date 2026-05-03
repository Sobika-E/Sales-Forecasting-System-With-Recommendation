import React from "react";
import { FaHome, FaUtensils, FaHotel, FaGift, FaBriefcase, FaBoxes, FaLeaf } from "react-icons/fa";
import waterHeaterImg from "../assets/product-images/waterheater.png";
import refrigeratorImg from "../assets/product-images/refrigerator.png";
import washingMachineImg from "../assets/product-images/washingmachine.png";
import airConditionerImg from "../assets/product-images/ac.png";
import airCoolerImg from "../assets/product-images/aircooler.png";
import tvImg from "../assets/product-images/tv.png";
import fanImg from "../assets/product-images/fan.png";
import ironBoxImg from "../assets/product-images/ironbox.png";
import chairImg from "../assets/product-images/chair.jpg";
import plasticChairImg from "../assets/product-images/plastic-chair.png";
import sofaImg from "../assets/product-images/sofa.png";
import diningTableImg from "../assets/product-images/dining-table.jpg";
import teaTableImg from "../assets/product-images/tea-table.jpg";
import dressingTableImg from "../assets/product-images/dressing-table.jpg";
import clothRackImg from "../assets/product-images/clothrack.png";
import bureauImg from "../assets/product-images/bureau.png";
import cotImg from "../assets/product-images/cot.webp";
import stoveImg from "../assets/product-images/stove.jpg";
import vesselSetImg from "../assets/product-images/vessel-set.png";
import heaterImg from "../assets/product-images/heater.png";

const CATEGORY_ICONS = {
  "Living Room": <FaHome size={24} />,
  "Dining": <FaUtensils size={24} />,
  "Bedroom": <FaHotel size={24} />,
  "Accessories": <FaGift size={24} />,
  "Office": <FaBriefcase size={24} />,
  "Storage": <FaBoxes size={24} />,
  "Outdoor": <FaLeaf size={24} />,
};

const SEASON_COLORS = {
  Winter: { bg: "#eff6ff", color: "#1d4ed8" },
  Spring: { bg: "#f0fdf4", color: "#15803d" },
  Summer: { bg: "#fefce8", color: "#a16207" },
  Fall:   { bg: "#fff7ed", color: "#c2410c" },
};

const PRODUCT_IMAGE_RULES = [
  { pattern: /\b(water\s*heater|geyser)s?\b/i, image: waterHeaterImg },
  { pattern: /\b(heater|room\s*heater)s?\b/i, image: heaterImg },
  { pattern: /\b(refrigerator|fridge)s?\b/i, image: refrigeratorImg },
  { pattern: /\b(washing\s*machine|washer)s?\b/i, image: washingMachineImg },
  { pattern: /\b(air\s*conditioner|ac)s?\b/i, image: airConditionerImg },
  { pattern: /\b(air\s*cooler|cooler)s?\b/i, image: airCoolerImg },
  { pattern: /\b(led\s*tv|smart\s*tv|television|tv)s?\b/i, image: tvImg },
  { pattern: /\bfan(s)?\b/i, image: fanImg },
  { pattern: /\b(sofa|couch|settee)s?\b/i, image: sofaImg },
  { pattern: /\b(dining|dinning)\s*table(s)?\b/i, image: diningTableImg },
  { pattern: /\b(tea|center|coffee)\s*table(s)?\b/i, image: teaTableImg },
  { pattern: /\b(dressing\s*table|dresser)s?\b/i, image: dressingTableImg },
  { pattern: /\b(cloth\s*rack|clothes\s*rack|rack)s?\b/i, image: clothRackImg },
  { pattern: /\b(bureau|wardrobe|almirah|cupboard)s?\b/i, image: bureauImg },
  { pattern: /\b(cot|crib|baby\s*bed|bed)s?\b/i, image: cotImg },
  { pattern: /\b(iron\s*box|ironbox|iron)s?\b/i, image: ironBoxImg },
  { pattern: /\b(stove|gas\s*stove|cooktop|hob)s?\b/i, image: stoveImg },
  { pattern: /\b(vessel[\s_-]*set|utensil[\s_-]*set|cookware[\s_-]*set|vessel|utensil|cookware)s?\b/i, image: vesselSetImg },
  { pattern: /\b(plastic\s*chair)s?\b/i, image: plasticChairImg },
  { pattern: /\bchair(s)?\b/i, image: chairImg },
];

function getProductImage(productName) {
  const matchedRule = PRODUCT_IMAGE_RULES.find((rule) =>
    rule.pattern.test(productName || "")
  );
  return matchedRule ? matchedRule.image : null;
}

const DEFAULT_ICON = <FaBoxes size={24} />;

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON;
}

function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return (
      <p className="empty-state">No products found. Add your first product above.</p>
    );
  }

  return (
    <div className="product-cards-grid">
      {products.map((product) => {
        const icon = getCategoryIcon(product.category);
        const imageSrc = product.image_url || getProductImage(product.name);
        const season = SEASON_COLORS[product.season] || { bg: "#f0f2f5", color: "#4b5563" };
        return (
          <div className="product-card" key={product._id}>
            {imageSrc ? (
              <div className="product-card-image-wrap">
                <img className="product-card-image" src={imageSrc} alt={product.name} />
              </div>
            ) : (
              <div className="product-card-icon-wrap">
                <span className="product-card-icon">{icon}</span>
              </div>
            )}
            <div className="product-card-body">
              <h3 className="product-card-name">{product.name}</h3>
              <div className="product-card-badges">
                <span className="product-badge category-badge">{product.category}</span>
                <span
                  className="product-badge season-badge"
                  style={{ background: season.bg, color: season.color }}
                >
                  {product.season}
                </span>
              </div>
              <div className="product-card-price">₹{product.price?.toLocaleString()}</div>
            </div>
            <div className="product-card-actions">
              <button className="btn-edit" onClick={() => onEdit(product)}>Edit</button>
              <button className="btn-danger" onClick={() => onDelete(product._id)}>Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProductTable;
