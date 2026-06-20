const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/payment/submit — user UTR submit karega
router.post("/submit", async (req, res) => {
  try {
    const { user_email, utr, screenshot_url } = req.body;

    if (!user_email || !utr) {
      return res.status(400).json({ error: "Email aur UTR dono chahiye!" });
    }

    // Check duplicate UTR
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("utr", utr)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Yeh UTR already submit ho chuka hai!" });
    }

    const { error } = await supabase.from("payments").insert({
      user_email,
      utr,
      screenshot_url: screenshot_url || null,
      status: "pending",
    });

    if (error) throw error;

    return res.json({
      success: true,
      message: "Payment submit ho gaya! 24 hours mein verify karenge. 🎉",
    });
  } catch (err) {
    console.error("Payment submit error:", err);
    return res.status(500).json({ error: "Kuch gadbad ho gayi, dobara try karo!" });
  }
});

// GET /api/payment/status?email=xxx — user apna status check kare
router.get("/status", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email chahiye!" });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("status, created_at, utr")
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.json({ status: "not_found" });
  }

  return res.json({ status: data.status, utr: data.utr, created_at: data.created_at });
});

module.exports = router;
