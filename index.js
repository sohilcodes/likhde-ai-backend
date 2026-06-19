require("dotenv").config();
const express = require("express");
const cors = require("cors");

const generateRoute = require("./routes/generate");
const authRoute = require("./routes/auth");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/generate", generateRoute);
app.use("/api/auth", authRoute);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "LikhDe AI Backend Running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
