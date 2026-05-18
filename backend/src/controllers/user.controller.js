const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        service: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET ALL SERVICES for dropdowns
exports.getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// CREATE USER
exports.createUser = async (req, res) => {
  const { name, surname, email, role, department, phone, job_title, block_number, service_id } = req.body;

  const parsedServiceId = service_id ? parseInt(service_id, 10) : null;
  
  // Validation service obligatoire
  if (["technician", "manager"].includes(role) && !parsedServiceId) {
    return res.status(400).json({ error: "Service obligatoire pour ce rôle." });
  }

  // Check service exists
  if (parsedServiceId) {
    const service = await prisma.service.findUnique({ where: { id: parsedServiceId } });
    if (!service) {
      return res.status(400).json({ error: "Service sélectionné n'existe pas." });
    }
  }

  // Check email unique
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Email déjà utilisé." });
  }

  try {
    const defaultPassword = await bcrypt.hash("12345678", 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        role,
        department,
        phone,
        job_title,
        block_number,
        service_id: parsedServiceId,
        password: defaultPassword,
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(`CreateUser error for ${email}:`, error);
    res.status(500).json({ error: "Erreur création utilisateur: " + (error.code || error.message) });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, surname, email, role, department, phone, job_title, block_number, service_id, password } = req.body;

  const parsedServiceId = service_id ? parseInt(service_id, 10) : null;
  
  // Validation service obligatoire
  if (["technician", "manager"].includes(role) && !parsedServiceId) {
    return res.status(400).json({ error: "Service obligatoire pour ce rôle." });
  }

  // Check service exists
  if (parsedServiceId) {
    const service = await prisma.service.findUnique({ where: { id: parsedServiceId } });
    if (!service) {
      return res.status(400).json({ error: "Service sélectionné n'existe pas." });
    }
  }

  try {
    const updateData = {
      name,
      surname,
      email,
      role,
      department,
      phone,
      job_title,
      block_number,
      service_id: parsedServiceId,
    };
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(`UpdateUser error for id ${id}:`, error);
    res.status(500).json({ error: "Erreur mise à jour: " + (error.code || error.message) });
  }
};

// TOGGLE ACTIVE
exports.toggleActive = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        is_active: !user.is_active,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
