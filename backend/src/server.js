const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth.routes");
app.use("/api", authRoutes);

// ✅ FIX HERE
const ticketRoutes = require("./routes/ticket.routes");
app.use("/api/tickets", ticketRoutes);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});