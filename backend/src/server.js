const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// routes
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const ticketRoutes = require("./routes/ticket.routes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tickets", ticketRoutes);
const technicienRoutes = require("./routes/technicien.routes");
app.use("/api/tech", technicienRoutes);
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});