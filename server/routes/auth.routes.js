import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email/password required" });

  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users(email, password_hash, role) VALUES(?,?, 'USER')",
      [email, hash]
    );
    return res.json({ message: "Registered" });
  } catch (e) {
    if (String(e.message).includes("Duplicate")) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email/password required" });

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

/**
 * DEV ONLY: Make a user ADMIN with a secret
 * POST /api/auth/make-admin
 * body: { email, secret }
 */
router.post("/make-admin", async (req, res) => {
  const { email, secret } = req.body || {};
  if (!email || !secret) return res.status(400).json({ message: "email/secret required" });

  if (!process.env.ADMIN_MAKE_SECRET) {
    return res.status(500).json({ message: "ADMIN_MAKE_SECRET is not set in .env" });
  }

  if (secret !== process.env.ADMIN_MAKE_SECRET) {
    return res.status(403).json({ message: "Invalid secret" });
  }

  const [rows] = await pool.query("SELECT id, email, role FROM users WHERE email=?", [email]);
  if (!rows[0]) return res.status(404).json({ message: "User not found. Register first." });

  await pool.query("UPDATE users SET role='ADMIN' WHERE email=?", [email]);

  return res.json({ message: "OK. User is now ADMIN. Please login again to refresh token." });
});

export default router;