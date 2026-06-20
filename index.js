require("dotenv").config();
const express = require("express");
const cors = require("cors");

const generateRoute = require("./routes/generate");
const authRoute = require("./routes/auth");
const paymentRoute = require("./routes/payment");
const adminRoute = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/generate", generateRoute);
app.use("/api/auth", authRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/admin", adminRoute);

app.get("/", (req, res) => {
  res.json({ status: "LikhDe AI Backend Running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
