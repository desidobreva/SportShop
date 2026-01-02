import express from "express";
import { pool } from "../db.js";
import { buildCatalogXml } from "../services/xmlService.js";

const router = express.Router();

router.get("/catalog.xml", async (req, res) => {
  const [deps] = await pool.query("SELECT * FROM departments");
  const [cats] = await pool.query("SELECT * FROM categories");
  const [prods] = await pool.query("SELECT * FROM products");

  const nested = deps.map(d => ({
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

  const xml = buildCatalogXml(nested);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
});

export default router;
