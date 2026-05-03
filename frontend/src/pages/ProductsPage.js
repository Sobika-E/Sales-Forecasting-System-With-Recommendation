import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ProductTable from "../components/ProductTable";
import AddProductForm from "../components/AddProductForm";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../services/api";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddOrUpdate = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
        showMessage("Product updated successfully!");
        setEditingProduct(null);
      } else {
        await addProduct(formData);
        showMessage("Product added successfully!");
      }
      fetchProducts();
    } catch (err) {
      showMessage(err.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      showMessage("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      showMessage(err.response?.data?.error || "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar title="Product Management" />
        <div className="loading">
          <div className="spinner"></div>
          Loading products...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar title="Product Management" />

      {message && (
        <div className={`toast-message ${
          message.includes("fail") || message.includes("error") || message.includes("already")
            ? "error" : "success"
        }`}>
          {message}
        </div>
      )}

      <AddProductForm
        onSubmit={handleAddOrUpdate}
        editingProduct={editingProduct}
        onCancelEdit={() => setEditingProduct(null)}
      />

      <div className="table-container">
        <div className="table-header">
          <h2>All Products ({products.length})</h2>
        </div>
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}

export default ProductsPage;
