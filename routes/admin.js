const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Simple admin auth middleware
const adminAuth = (req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized! Chor hai kya? 😄" });
  }
  next();
};

// GET /api/admin/payments — sab pending payments dekho
router.get("/payments", adminAuth, async (req, res) => {
  const { status } = req.query;

  let query = supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ payments: data });
});

// POST /api/admin/verify — approve ya reject karo
router.post("/verify", adminAuth, async (req, res) => {
  const { payment_id, action } = req.body; // action: 'approved' or 'rejected'

  if (!payment_id || !action) {
    return res.status(400).json({ error: "payment_id aur action chahiye!" });
  }

  // Payment update karo
  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .update({ status: action, updated_at: new Date().toISOString() })
    .eq("id", payment_id)
    .select()
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  // Agar approved — user ko pro de do
  if (action === "approved") {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await supabase.from("users").upsert({
      email: payment.user_email,
      plan: "paid",
      plan_expiry: expiry.toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    message: action === "approved" ? "User ko Pro plan de diya! 🎉" : "Payment reject kar diya!",
  });
});

module.exports = router;
