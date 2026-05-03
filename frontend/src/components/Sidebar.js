import React from "react";
import { NavLink } from "react-router-dom";
import { FiBarChart2, FiTrendingUp, FiClipboard, FiUser, FiBox, FiPackage } from "react-icons/fi";

const ICON_MAP = {
  dashboard: <FiBarChart2 size={20} />,
  products: <FiBox size={20} />,
  forecast: <FiTrendingUp size={20} />,
  predict: <FiTrendingUp size={20} />,
  combos: <FiPackage size={20} />,
  history: <FiClipboard size={20} />,
  profile: <FiUser size={20} />,
};

function Sidebar() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
    { path: "/products", label: "Products", iconKey: "products" },
    { path: "/forecast", label: "Year Forecast", iconKey: "forecast" },
    { path: "/predict", label: "Product Prediction", iconKey: "predict" },
    { path: "/combos", label: "Combo Offers", iconKey: "combos" },
    { path: "/history", label: "Prediction History", iconKey: "history" },
    { path: "/profile", label: "Profile", iconKey: "profile" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>SRI DIVYAM SOFA MANUFACTURING & FURNITURES </h2>
        <p>Admin Dashboard</p>
      </div>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="nav-icon">{ICON_MAP[item.iconKey]}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
