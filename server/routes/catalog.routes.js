import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();

  const [deps] = await pool.query("SELECT * FROM departments");
  const [cats] = await pool.query("SELECT * FROM categories");
  const [prods] = await pool.query(
    q
      ? "SELECT * FROM products WHERE LOWER(name) LIKE ? OR LOWER(brand) LIKE ?"
      : "SELECT * FROM products",
    q ? [`%${q}%`, `%${q}%`] : []
  );

  const result = deps.map(d => ({
    id: d.id,
    name: d.name,
    categories: cats
      .filter(c => c.department_id === d.id)
      .map(c => ({
        id: c.id,
        name: c.name,
        products: prods.filter(p => p.category_id === c.id)
      }))
  }));

  res.json(result);
});

export default router;
