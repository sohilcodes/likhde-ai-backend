const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/auth/plan?userId=email@gmail.com
router.get("/plan", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.json({ plan: "free" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("plan, plan_expiry")
      .eq("email", userId)  // email se check karo
      .single();

    if (error || !data) {
      return res.json({ plan: "free" });
    }

    // Check expiry
    if (data.plan === "paid" && data.plan_expiry) {
      const expiry = new Date(data.plan_expiry);
      if (expiry < new Date()) {
        await supabase.from("users").update({ plan: "free" }).eq("email", userId);
        return res.json({ plan: "free", message: "Plan expire ho gaya, renew karo!" });
      }
    }

    return res.json({ plan: data.plan || "free" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.json({ plan: "free" });
  }
});

module.exports = router;
