import express from "express";
import { pool } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(authRequired, adminOnly);

// LIST PRODUCTS
router.get("/products", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, category_id, name, brand, color, size_label, price, stock, created_at
     FROM products
     ORDER BY id DESC`
  );
  res.json(rows);
});

// ADD PRODUCT
router.post("/products", async (req, res) => {
  const { categoryId, name, brand, color, sizeLabel, price, stock } = req.body || {};

  const categoryIdNum = Number(categoryId);
  const priceNum = Number(price);
  const stockNum = stock === undefined ? 0 : Number(stock);

  if (!categoryIdNum || !name || !brand || !color || !sizeLabel || Number.isNaN(priceNum)) {
    return res.status(400).json({ message: "Invalid product data" });
  }

  await pool.query(
    `INSERT INTO products(category_id,name,brand,color,size_label,price,stock)
     VALUES(?,?,?,?,?,?,?)`,
    [categoryIdNum, name, brand, color, sizeLabel, priceNum, Number.isNaN(stockNum) ? 0 : stockNum]
  );

  res.json({ message: "Product added" });
});

// UPDATE PRODUCT
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;

  const { name, brand, color, size_label, price, stock } = req.body || {};
  const priceNum = Number(price);
  const stockNum = Number(stock);

  if (!name || !brand || !color || !size_label || Number.isNaN(priceNum) || Number.isNaN(stockNum)) {
    return res.status(400).json({ message: "Invalid product data" });
  }

  await pool.query(
    `UPDATE products
     SET name=?, brand=?, color=?, size_label=?, price=?, stock=?
     WHERE id=?`,
    [name, brand, color, size_label, priceNum, stockNum, Number(id)]
  );

  res.json({ message: "Product updated" });
});

// DELETE PRODUCT
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM products WHERE id=?", [Number(id)]);
  res.json({ message: "Product deleted" });
});

export default router;
