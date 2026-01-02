import express from "express";
import { pool } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
  const userId = req.user.id;
  const [rows] = await pool.query(
    `SELECT ci.quantity, p.*
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ?`,
    [userId]
  );
  res.json(rows);
});

router.post("/add", async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body || {};
  if (!productId) return res.status(400).json({ message: "productId required" });

  // upsert
  await pool.query(
    `INSERT INTO cart_items(user_id, product_id, quantity)
     VALUES(?,?,1)
     ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
    [userId, productId]
  );
  res.json({ message: "Added" });
});

router.post("/set-qty", async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body || {};
  if (!productId || typeof quantity !== "number") return res.status(400).json({ message: "Invalid" });

  if (quantity <= 0) {
    await pool.query("DELETE FROM cart_items WHERE user_id=? AND product_id=?", [userId, productId]);
    return res.json({ message: "Removed" });
  }

  await pool.query(
    "UPDATE cart_items SET quantity=? WHERE user_id=? AND product_id=?",
    [quantity, userId, productId]
  );
  res.json({ message: "Updated" });
});

router.post("/clear", async (req, res) => {
  const userId = req.user.id;
  await pool.query("DELETE FROM cart_items WHERE user_id=?", [userId]);
  res.json({ message: "Cleared" });
});

export default router;
