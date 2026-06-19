const rateLimit = require("express-rate-limit");

// Free user: 5 requests per day
const freeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => req.headers["x-user-id"] || req.ip,
  skip: (req) => req.headers["x-plan"] === "paid", // paid users skip this
  message: {
    error: "Free limit khatam ho gaya! 😅 Paid plan lo unlimited ke liye.",
    upgrade_url: "https://likhde.vercel.app/pricing",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { freeLimiter };
