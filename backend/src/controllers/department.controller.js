const prisma = require("../prismaClient");

// LISTE DEPARTEMENTS
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.departments.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DÉTAIL DÉPARTEMENT
exports.getDepartmentById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const department = await prisma.departments.findUnique({ where: { id } });
    if (!department) return res.status(404).json({ error: "Département non trouvé" });
    res.json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// CRÉATION DÉPARTEMENT
exports.createDepartment = async (req, res) => {
  const { name, description } = req.body;
  try {
    const department = await prisma.departments.create({
      data: { name, description },
    });
    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// MODIFICATION DÉPARTEMENT
exports.updateDepartment = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  try {
    const department = await prisma.departments.update({
      where: { id },
      data: { name, description, updated_at: new Date() },
    });
    res.json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// SUPPRESSION DÉPARTEMENT
exports.deleteDepartment = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.departments.delete({ where: { id } });
    res.json({ message: "Département supprimé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};