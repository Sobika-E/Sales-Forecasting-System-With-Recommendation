import React, { useState, useEffect } from "react";

const CATEGORIES = ["Living Room", "Dining", "Bedroom", "Accessories", "Office", "Storage", "Outdoor"];
const SEASONS = ["Winter", "Spring", "Summer", "Fall"];

function AddProductForm({ onSubmit, editingProduct, onCancelEdit }) {
  const [form, setForm] = useState({ name: "", category: "", season: "", price: "" });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        category: editingProduct.category,
        season: editingProduct.season,
        price: editingProduct.price.toString(),
      });
      setImageFile(null);
    } else {
      setForm({ name: "", category: "", season: "", price: "" });
      setImageFile(null);
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setImageFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.season || !form.price) return;

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("category", form.category);
    payload.append("season", form.season);
    payload.append("price", parseFloat(form.price));

    if (imageFile) {
      payload.append("image", imageFile);
    }

    onSubmit(payload);

    if (!editingProduct) {
      setForm({ name: "", category: "", season: "", price: "" });
      setImageFile(null);
    }
  };

  const handleCancel = () => {
    setForm({ name: "", category: "", season: "", price: "" });
    setImageFile(null);
    onCancelEdit();
  };

  return (
    <div className="form-container">
      <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Sofa"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Season</label>
            <select name="season" value={form.season} onChange={handleChange} required>
              <option value="">Select Season</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 500"
              min="1"
              step="0.01"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Upload Image (optional)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" className="btn-primary">
            {editingProduct ? "Update Product" : "Add Product"}
          </button>
          {editingProduct && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddProductForm;
