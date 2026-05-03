import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const SHOP_PROFILE = {
  shopName: "SRI DIVYAM SOFA MANUFACTURING & FURNITURES",
  addressLine1: "108C, EDAPADI ROAD, KUMARAPALAYAM,",
  addressLine2: "NAMAKKAL, TAMILNADU - 638 183.",
  contactNumber: "9944842884",
};

function ProfilePage() {
  const { adminEmail, logout } = useAuth();

  return (
    <>
      <Navbar title="Profile" />

      <div className="profile-layout">
        <div className="profile-card animate-fade-in-up">
          <h2>Shop Profile</h2>

          <div className="profile-row">
            <p className="profile-label">Company Name</p>
            <div className="profile-company-banner">
              <p className="profile-company-name">{SHOP_PROFILE.shopName}</p>
            </div>
          </div>

          <div className="profile-row">
            <p className="profile-label">Address</p>
            <p className="profile-value profile-address">
              {SHOP_PROFILE.addressLine1}
              <br />
              {SHOP_PROFILE.addressLine2}
            </p>
          </div>

          <div className="profile-row">
            <p className="profile-label">Contact Number</p>
            <a className="profile-value profile-link" href={`tel:${SHOP_PROFILE.contactNumber}`}>
              {SHOP_PROFILE.contactNumber}
            </a>
          </div>

          <div className="profile-row">
            <p className="profile-label">Admin Email</p>
            <p className="profile-value">{adminEmail || "Not available"}</p>
          </div>

          <div className="profile-actions">
            <button className="btn-logout profile-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
