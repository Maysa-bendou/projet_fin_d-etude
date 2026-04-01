const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const ticketRoutes = require("./routes/ticket.routes");
const techRoutes = require("./routes/tech.routes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tickets", ticketRoutes);
const technicienRoutes = require("./routes/technicien.routes");
app.use("/api/tech", technicienRoutes);
app.use("/api/tech", techRoutes);
const path = require("path");

// Après app.use(express.json()) :
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});