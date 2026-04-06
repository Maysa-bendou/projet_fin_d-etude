// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Routes
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const ticketRoutes = require("./routes/ticket.routes");
const techRoutes = require("./routes/tech.routes");
const userRoutes = require("./routes/user.routes");
const technicienRoutes = require("./routes/technicien.routes");
const departmentRoutes = require("./routes/department.routes");
const adminRoutes = require("./routes/admin.routes");


app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/tech", technicienRoutes);
app.use("/api/tech", techRoutes);

app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes); // pour stats SLA, etc.
const slaRoutes = require("./routes/sla.routes");
app.use("/api/sla", slaRoutes);
// Start server


const managerRoutes = require("./routes/manager.routes");
app.use("/api/manager", managerRoutes);

const chefRoutes = require('./routes/chef.routes');
app.use('/api', chefRoutes);


const accueilRoutes = require('./routes/accueil.routes');
app.use('/api/accueil', accueilRoutes);


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});