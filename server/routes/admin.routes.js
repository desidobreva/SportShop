import express from "express";
import { pool } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = express.Router();
router.use(authRequired, adminOnly);

router.post("/product", async (req, res) => {
  const { categoryId, name, brand, color, sizeLabel, price, stock } = req.body || {};
  if (!categoryId || !name || !brand || !color || !sizeLabel || typeof price !== "number") {
    return res.status(400).json({ message: "Invalid product data" });
  }
  await pool.query(
    `INSERT INTO products(category_id,name,brand,color,size_label,price,stock)
     VALUES(?,?,?,?,?,?,?)`,
    [categoryId, name, brand, color, sizeLabel, price, stock ?? 0]
  );
  res.json({ message: "Product added" });
});

export default router;
