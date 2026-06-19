const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/auth/plan?userId=xxx
// Frontend yeh call karega user ka plan check karne ke liye
router.get("/plan", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.json({ plan: "free" }); // Default free
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("plan, plan_expiry")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return res.json({ plan: "free" });
    }

    // Check if paid plan expired
    if (data.plan === "paid" && data.plan_expiry) {
      const expiry = new Date(data.plan_expiry);
      if (expiry < new Date()) {
        // Plan expired — update to free
        await supabase.from("users").update({ plan: "free" }).eq("id", userId);
        return res.json({ plan: "free", message: "Plan expire ho gaya, renew karo!" });
      }
    }

    return res.json({ plan: data.plan || "free" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.json({ plan: "free" });
  }
});

// POST /api/auth/upgrade — Razorpay payment verify ke baad call karo
router.post("/upgrade", async (req, res) => {
  const { userId, razorpay_payment_id } = req.body;

  if (!userId || !razorpay_payment_id) {
    return res.status(400).json({ error: "userId aur payment_id chahiye" });
  }

  try {
    // Set plan expiry 30 days baad
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const { error } = await supabase
      .from("users")
      .upsert({
        id: userId,
        plan: "paid",
        plan_expiry: expiry.toISOString(),
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return res.json({ success: true, message: "Plan upgrade ho gaya! 🎉", plan: "paid" });
  } catch (err) {
    console.error("Upgrade error:", err);
    return res.status(500).json({ error: "Upgrade fail ho gaya, support se contact karo" });
  }
});

module.exports = router;
