import express from "express";
import { pool } from "../db.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { authorizePayment } from "../services/paymentService.js";
import { sendOrderEmail } from "../services/emailService.js";

const router = express.Router();
router.use(authRequired);

/**
 * USER CHECKOUT
 */
router.post("/checkout", async (req, res) => {
  const userId = req.user.id;
  const email = req.user.email;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cartRows] = await conn.query(
      `SELECT ci.quantity, p.*
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ? FOR UPDATE`,
      [userId]
    );

    if (cartRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const [orderIns] = await conn.query(
      "INSERT INTO orders(user_id, status, total) VALUES(?, 'CREATED', 0)",
      [userId]
    );
    const orderId = orderIns.insertId;

    let total = 0;
    for (const item of cartRows) {
      total += Number(item.price) * item.quantity;
      if (item.stock < item.quantity) {
        await conn.query(
          "UPDATE orders SET status='FAILED_NO_STOCK', total=? WHERE id=?",
          [total, orderId]
        );
        await conn.commit();
        return res.json({ orderId, status: "FAILED_NO_STOCK" });
      }
    }

    await conn.query(
      "UPDATE orders SET status='STOCK_CONFIRMED', total=? WHERE id=?",
      [total, orderId]
    );

    for (const item of cartRows) {
      await conn.query(
        `INSERT INTO order_items(order_id, product_id, name_snapshot, price_snapshot, quantity)
         VALUES(?,?,?,?,?)`,
        [orderId, item.id, item.name, item.price, item.quantity]
      );
    }

    let payment;
    try {
      payment = await authorizePayment({ amountBGN: total, currency: "eur" });
    } catch {
      await conn.query("UPDATE orders SET status='PAYMENT_FAILED' WHERE id=?", [orderId]);
      await conn.commit();
      return res.json({ orderId, status: "PAYMENT_FAILED" });
    }

    await conn.query(
      "UPDATE orders SET status='PAYMENT_AUTHORIZED' WHERE id=?",
      [orderId]
    );

    await conn.query(
      `INSERT INTO payments(order_id, provider, provider_ref, amount, currency, status)
       VALUES(?, 'STRIPE', ?, ?, ?, 'AUTHORIZED')`,
      [orderId, payment.providerRef, total, payment.currency]
    );

    for (const item of cartRows) {
      await conn.query(
        "UPDATE products SET stock = stock - ? WHERE id = ?",
        [item.quantity, item.id]
      );
    }

    await conn.query(
      "UPDATE orders SET status='SHIPPING_IN_PROGRESS' WHERE id=?",
      [orderId]
    );

    await sendOrderEmail({
      to: email,
      subject: `Sport Shop Order #${orderId}`,
      text: `Your order #${orderId} is being processed. Total: ${total} BGN.`
    });

    await conn.query(
      `INSERT INTO email_log(user_id, order_id, to_email, subject)
       VALUES(?,?,?,?)`,
      [userId, orderId, email, `Sport Shop Order #${orderId}`]
    );

    await conn.query("DELETE FROM cart_items WHERE user_id=?", [userId]);

    await conn.commit();
    res.json({ orderId, status: "SHIPPING_IN_PROGRESS", total });

  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: "Checkout failed" });
  } finally {
    conn.release();
  }
});

/**
 * USER ORDERS
 */
router.get("/my", async (req, res) => {
  const [orders] = await pool.query(
    "SELECT * FROM orders WHERE user_id=? ORDER BY id DESC",
    [req.user.id]
  );
  res.json(orders);
});

/**
 * USER ORDER DETAILS
 */
router.get("/:id/items", async (req, res) => {
  const orderId = req.params.id;
  const [items] = await pool.query(
    "SELECT * FROM order_items WHERE order_id=?",
    [orderId]
  );
  res.json(items);
});

/**
 * ADMIN – ALL ORDERS
 */
router.get("/admin/all", adminOnly, async (req, res) => {
  const { status } = req.query;

  let sql = `
    SELECT o.*, u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
  `;
  const params = [];

  if (status) {
    sql += " WHERE o.status = ?";
    params.push(status);
  }

  sql += " ORDER BY o.id DESC";

  const [orders] = await pool.query(sql, params);
  res.json(orders);
});

router.post("/admin/:id/status", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = [
    "CREATED",
    "STOCK_CONFIRMED",
    "PAYMENT_AUTHORIZED",
    "SHIPPING_IN_PROGRESS",
    "COMPLETED",
    "PAYMENT_FAILED",
    "FAILED_NO_STOCK"
  ];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  await pool.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, id]
  );

  res.json({ message: "Status updated" });
});


/**
 * ADMIN – UPDATE ORDER STATUS
 */
router.post("/admin/update-status", adminOnly, async (req, res) => {
  const { orderId, status } = req.body;

  await pool.query(
    "UPDATE orders SET status=? WHERE id=?",
    [status, orderId]
  );

  res.json({ success: true });
});

export default router;
