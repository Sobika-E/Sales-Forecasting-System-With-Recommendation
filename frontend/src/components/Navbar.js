import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

function Navbar({ title }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="navbar">
      <h1>{title}</h1>
      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
      </div>
    </div>
  );
}

export default Navbar;
