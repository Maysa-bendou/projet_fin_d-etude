const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");

// GET /api/users - List all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, serviceId, active } = req.query;
    const skip = (page - 1) * limit;

    const where = { is_active: true }; // Default active only, override if specified
    if (role && role !== 'all') where.role = role;
    if (serviceId) where.service_id = parseInt(serviceId);
    if (active !== undefined) where.is_active = active === 'true';

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          services: { select: { name: true } }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.users.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /api/users - Create user
const createUser = async (req, res) => {
  try {
    const { name, surname, email, password, role, phone, department, job_title, office, block_number, service_id, is_active = true } = req.body;

    // Validate role enum
    const validRoles = ['employee', 'technician', 'chef_service', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        name,
        surname,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone,
        department,
        job_title,
        office,
        block_number,
        service_id: service_id ? parseInt(service_id) : null,
        is_active
      },
      include: {
        services: { select: { name: true } }
      }
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, message: "Utilisateur créé avec succès" });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    console.error(err);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
};

// PUT /api/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    let hashedPassword = null;

    if (updates.password) {
      hashedPassword = await bcrypt.hash(updates.password, 12);
      updates.password = hashedPassword;
    }

    const validRoles = ['employee', 'technician', 'chef_service', 'manager', 'admin'];
    if (updates.role && !validRoles.includes(updates.role)) {
      return res.status(400).json({ error: "Rôle invalide" });
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        ...updates,
        service_id: updates.service_id ? parseInt(updates.service_id) : null,
        email: updates.email ? updates.email.toLowerCase() : undefined
      },
      include: {
        services: { select: { name: true } }
      }
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, message: "Utilisateur mis à jour" });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour" });
  }
};

// DELETE /api/users/:id - Soft delete
const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const user = await prisma.users.update({
      where: { id },
      data: { is_active: false }
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, message: "Utilisateur désactivé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression" });
  }
};

// GET /api/users/services - List services for dropdown
const getServices = async (req, res) => {
  try {
    const services = await prisma.services.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getServices
};

