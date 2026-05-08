const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getMyTickets } = require("../controllers/ticket.controller");
const { getTicketDetailTech } = require("../controllers/technicien.controller");
const { employeeConfirmReply, employeeReply } = require("../controllers/employee.controller");
const {
  notifyAllManagersOfService,
  notifyAllTechsOfService,
  notifyTechAssigned,
  notifyEmployeeAssigned,
  notifyTechTicketUpdated, 
} = require("../controllers/notification.service");


// ── Multer for existing ticket replies (id known via :id param) ───────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, `../../uploads/tickets/${req.params.id}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ── Multer for ticket creation (ticket id not known yet → temp dir) ───────
const storageCreate = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a request-scoped temp dir so all files share the same folder
    if (!req._tempUploadDir) {
      req._tempUploadDir = path.join(
        __dirname,
        `../../uploads/tmp/${Date.now()}_${Math.random().toString(36).slice(2)}`
      );
      fs.mkdirSync(req._tempUploadDir, { recursive: true });
    }
    cb(null, req._tempUploadDir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadCreate = multer({ storage: storageCreate });

// ── Employee endpoints ────────────────────────────────────────────────────
router.put("/:id/confirm-reply", employeeConfirmReply);
router.post("/:id/employee-reply", upload.array("files", 10), employeeReply);

// ── Mapping catégorie → service_id ────────────────────────────────────────
const CATEGORY_SERVICE_MAP = {
  hardware:   1,  // IT Support
  software:   1,  // IT Support
  network:    2,  // IT Network
  security:   3,  // IT Security
  access:     5,  // Service Desk
  
};

// ── POST /create ──────────────────────────────────────────────────────────
router.post("/create", uploadCreate.array("files", 10), async (req, res) => {
  try {
    const { title, description, impact, urgency, type, created_by } = req.body;
    // ── ML classification ──────────────────────────────────────────────
let category = "access"; // safe default if ML fails

try {
  const mlRes = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  const mlData = await mlRes.json();
  if (mlData.category) {
    category = mlData.category;
    console.log("🤖 ML predicted:", category, "| lang:", mlData.detected_lang);
  }
} catch (err) {
  console.warn("⚠️ ML API unavailable, using default:", err.message);
}
    // ── Debug logs ────────────────────────────────────────────────────────
    console.log("📥 req.body:", req.body);
    console.log("📎 req.files:", req.files?.map(f => f.originalname) ?? "aucun");

    if (!title || !description || !impact || !urgency || !type || !created_by)

      return res.status(400).json({ error: "Champs manquants" });

    const PRIORITY_MATRIX = {
  high:   { high: "high",   medium: "high",   low: "medium" },
  medium: { high: "high",   medium: "medium", low: "low"    },
  low:    { high: "medium", medium: "low",    low: "low"    },
};

    const priority = PRIORITY_MATRIX[impact]?.[urgency];
    console.log("👉 priority calculé:", priority);

    const slaConfig = await prisma.sla_config.findFirst({ where: { priority } });
    console.log("👉 slaConfig trouvé:", slaConfig);

    const service_id      = CATEGORY_SERVICE_MAP[category] ?? null;
    const sla_date_debut  = new Date();
    const sla_date_limite = new Date(sla_date_debut.getTime() + slaConfig.duration_hours * 3600000);

    // ✅ 1. Créer le ticket
    const created = await prisma.tickets.create({
      data: {
        title, description, category, impact, urgency, type, priority,
        created_by:     parseInt(created_by),
        service_id,
        sla_date_debut,
        sla_date_limite,
        sla_statut: "en_cours",
      },
    });
    console.log("👉 ticket id créé:", created.id);

    // ✅ 2. Relire depuis la base (fix bug Prisma 5 + Timestamptz)
    const ticket = await prisma.tickets.findUnique({ where: { id: created.id } });
    console.log("👉 sla_date_limite relue:", ticket.sla_date_limite);

    // ✅ 3. Sauvegarder les pièces jointes si présentes
    const uploadedFiles = req.files ?? [];
    console.log(`📎 ${uploadedFiles.length} fichier(s) à traiter`);

    if (uploadedFiles.length > 0) {
      const finalDir = path.join(__dirname, `../../uploads/tickets/${ticket.id}`);
      fs.mkdirSync(finalDir, { recursive: true });

      // One shared comment for all creation attachments
      const attachmentComment = await prisma.ticket_comments.create({
        data: {
          ticket_id:    ticket.id,
          user_id:      parseInt(created_by),
          comment:      "Pièces jointes ajoutées à la création du ticket",
          comment_type: "attachment",
        },
      });
      console.log("📝 commentaire attachment créé, id:", attachmentComment.id);

      for (const file of uploadedFiles) {
        const finalPath = path.join(finalDir, path.basename(file.path));
        fs.renameSync(file.path, finalPath);
        console.log("📁 fichier déplacé vers:", finalPath);

        await prisma.ticket_attachments.create({
          data: {
            ticket_id:   ticket.id,
            comment_id:  attachmentComment.id,
            file_name:   file.originalname,
            file_path:   finalPath,
            uploaded_by: parseInt(created_by),
          },
        });
        console.log("💾 attachment sauvegardé en DB:", file.originalname);
      }

      // Clean up the temp directory (now empty after renames)
      try {
        const tmpDir = req._tempUploadDir;
        if (tmpDir && fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
          fs.rmdirSync(tmpDir);
        }
      } catch (_) { /* non-blocking */ }
    }

    // ✅ 4. Notifications
    if (service_id) {
      await Promise.allSettled([
        notifyAllTechsOfService(service_id, ticket.id, ticket.title),
        notifyAllManagersOfService(service_id, ticket.id, ticket.title),
      ]);
    }

   // Find service name
const service = service_id ? await prisma.services.findUnique({
  where: { id: service_id },
  select: { name: true },
}) : null;

res.json({ 
  ticket,
  ml_category: category,
  service_name: service?.name ?? null,
});
  } catch (err) {
    console.error("❌ Erreur création ticket:", err);
    res.status(500).json({ error: "Erreur lors de la création du ticket" });
  }
});

router.get("/my/:userId", getMyTickets);

router.get("/assigned/:techId", async (req, res) => {
  try {
    const techId = parseInt(req.params.techId);
    const tickets = await prisma.tickets.findMany({
      where: { assigned_to: techId },
      include: {
        users_tickets_created_byTousers: { select: { name: true, surname: true } },
        services: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du fetch" });
  }
});

router.get("/", async (req, res) => {
  try {
    const tickets = await prisma.tickets.findMany({
      include: {
        users_tickets_created_byTousers: true,
        users_tickets_assigned_toTousers: true,
        services: true,
      },
      orderBy: { created_at: "desc" },
    });
    const formatted = tickets.map((t) => ({
      id:              t.id,
      title:           t.title,
      description:     t.description,
      category:        t.category,
      priority:        t.priority,
      status:          t.status,
      impact:          t.impact,
      urgency:         t.urgency,
      serviceId:       t.service_id,
      serviceName:     t.services?.name || "N/A",
      sla:             t.sla_date_limite,
      date_expiration: t.sla_date_limite,
      sla_date_limite: t.sla_date_limite,
      sla_date_debut:  t.sla_date_debut,
      closed_at:       t.closed_at,
      created_at:      t.created_at,       // ← ajouter
      assigned_at:     t.assigned_at, 
      sla_pause_elapsed_ms: t.sla_pause_elapsed_ms ? Number(t.sla_pause_elapsed_ms) : null,  // ← add
      sla_statut:      t.sla_statut, 
      createdBy:       t.users_tickets_created_byTousers?.name,
      employee:        t.users_tickets_created_byTousers,
      assignedTo: t.users_tickets_assigned_toTousers,
      technicienId:    t.assigned_to,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const data = {
      status,
      updated_at: new Date(),
    };

    // ✅ IMPORTANT: set closed_at when closing
    if (status === "closed") {
      data.closed_at = new Date();
    }

    const ticket = await prisma.tickets.update({
  where: { id },
  data,
});

await prisma.ticket_comments.create({
  data: {
    ticket_id: id,
    user_id: req.body.user_id || null,
    comment: `status_changed:${status}`,
    comment_type: "status",
  },
});

res.json(ticket);


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});
router.get("/techniciens", async (req, res) => {
  try {
    const techs = await prisma.users.findMany({
      where: { role: "technician" },
      select: { id: true, name: true, surname: true },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router.get("/techniciens/service/:serviceId", async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const techs = await prisma.users.findMany({
      where: {
        role: "technician",
        service_id: serviceId,
      },
      select: {
        id: true, name: true, surname: true,
        email: true, phone: true, office: true, job_title: true,
      },
    });
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users_tickets_created_byTousers: {
          select: {
            name: true, surname: true, email: true,
            department: true, role: true, phone: true,
            office: true, job_title: true,
          },
        },
        users_tickets_assigned_toTousers: {
          select: { name: true, surname: true, id: true },
        },
        services: { select: { name: true } },
       ticket_assignments_history: {
  where: { action: { in: ["taken", "assigned", "updated"] } },
  orderBy: { created_at: "desc" },
  take: 5,
  include: {
    users_ticket_assignments_history_assigned_byTousers: {
      select: { id: true, name: true, surname: true },
    },
  },
},
        ticket_comments: {
          orderBy: { created_at: "asc" },
          include: {
            users: { select: { id: true, name: true, surname: true, role: true } },
            ticket_attachments: true,
          },
        },
      },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    console.log("🔍 history:", JSON.stringify(ticket.ticket_assignments_history, null, 2));
    const redirectComment = ticket.ticket_comments
  .filter(c => c.comment_type === "redirect")
  .at(-1) ?? null;
    res.json({
      id:                     ticket.id,
      title:                  ticket.title,
      description:            ticket.description,
      category:               ticket.category,
      status:                 ticket.status,
      priority:               ticket.priority,
      impact:                 ticket.impact,
      urgency:                ticket.urgency,
      type:                   ticket.type,
      sla_date_limite:        ticket.sla_date_limite,
      sla_date_debut:         ticket.sla_date_debut,
      createdAt:              ticket.created_at,
      updatedAt:              ticket.updated_at,
      closed_at:               ticket.closed_at,
      solution:               ticket.solution,
      closing_note:           ticket.closing_note,
      redirected_at:          redirectComment?.created_at ?? null,
      redirect_note: ticket.redirect_note,
      is_resolved_confirmed:  ticket.is_resolved_confirmed,
      confirmation_requested: ticket.confirmation_requested,
      employee:               ticket.users_tickets_created_byTousers,
      sla_pause_elapsed_ms: ticket.sla_pause_elapsed_ms ? Number(ticket.sla_pause_elapsed_ms) : null,
      technician:             ticket.users_tickets_assigned_toTousers,
      assigned_at: ticket.assigned_at,
      assigned_action:
  ticket.ticket_assignments_history?.[0]?.action ||
  (ticket.assigned_to ? "assigned" : null),
assigned_by_manager:
  ticket.ticket_assignments_history?.find(h =>
    ["assigned", "updated"].includes(h.action)
  )?.users_ticket_assignments_history_assigned_byTousers ?? null,
      service:                ticket.services?.name,
      comments: ticket.ticket_comments.map((c) => ({
        id:           c.id,
        message:      c.comment,
        comment_type: c.comment_type ?? "comment",
        author:       `${c.users?.name ?? ""} ${c.users?.surname ?? ""}`.trim(),
        authorRole:   c.users?.role ?? "",
        authorId:     c.users?.id,
        date:         c.created_at,
        files: (c.ticket_attachments ?? []).map(a => ({
          fileName: a.file_name,
          filePath: a.file_path
            ? a.file_path.replace(/^.*[\\\/]uploads[\\\/]/, "uploads/").replace(/\\/g, "/")
            : null,
        })),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, impact, urgency, status, user_id } = req.body;

    const changes = [];

    const existingTicket = await prisma.tickets.findUnique({
      where: { id }
    });

    if (!existingTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // ✅ REOPEN RULE
   let commentType = req.body._reopen ? "reopen" : "update";

if (existingTicket.status === "closed" && status === "open") {
  if (!existingTicket.closed_at) {
    return res.status(400).json({ error: "Missing closed date" });
  }

  const diffDays = (Date.now() - new Date(existingTicket.closed_at)) / (1000 * 60 * 60 * 24);

  if (diffDays > 30) {
    return res.status(400).json({ error: "Reopen deadline expired" });
  }

  // ── Limite 2 réouvertures ──
  const reopenCount = await prisma.ticket_comments.count({
    where: { ticket_id: id, comment_type: "reopen" },
  });
  if (reopenCount >= 2) {
    return res.status(400).json({ error: "Reopen limit reached" });
  }

  changes.push("Ticket réouvert");
  commentType = "reopen";
}

    // ✅ TRACK CHANGES
    if (title && title !== existingTicket.title) {
      changes.push("Titre modifié");
    }

    if (description && description !== existingTicket.description) {
      changes.push("Description modifiée");
    }

    if (impact && impact !== existingTicket.impact) {
      changes.push(`Impact: ${existingTicket.impact} → ${impact}`);
    }

    if (urgency && urgency !== existingTicket.urgency) {
      changes.push(`Urgence: ${existingTicket.urgency} → ${urgency}`);
    }

    if (status && status !== existingTicket.status) {
      changes.push(`Statut: ${existingTicket.status} → ${status}`);
    }

    const PRIORITY_MATRIX = {
  high:   { high: "high",   medium: "high",   low: "medium" },
  medium: { high: "high",   medium: "medium", low: "low"    },
  low:    { high: "medium", medium: "low",    low: "low"    },
};
   let priority = existingTicket.priority;

if (impact && urgency) {
  const computed = PRIORITY_MATRIX[impact]?.[urgency];
  if (computed) priority = computed; // ← garde l'ancienne si calcul échoue
}

    // ✅ UPDATE
 const updateData = {
  ...(title && { title }),
  ...(description && { description }),
  ...(impact && { impact }),
  ...(urgency && { urgency }),
  ...(status && { status }),
  ...(priority && { priority }),
  updated_at: new Date(),
  // ✅ Réinitialise la confirmation si réouverture
  ...(existingTicket.status === "closed" && status === "open" && {
    confirmation_requested: false,
    is_resolved_confirmed: false,
    
    sla_statut: "en_cours",
    closed_at: null,
     
  }),
};

    if (status === "closed") {
      updateData.closed_at = new Date();
    }

    if (existingTicket.status === "closed" && status === "open") {
      updateData.closed_at = null;
    }

    const updatedTicket = await prisma.tickets.update({
      where: { id },
      data: updateData,
    });

    // ✅ CREATE COMMENT IF CHANGES
    if (changes.length > 0) {
  const isReopen = commentType === "reopen";
  await prisma.ticket_comments.create({
    data: {
      ticket_id: id,
      user_id: user_id || null,
// ✅ AFTER
comment: isReopen
  ? "employee_reopened"
  : `employee_updated:${changes.join(" | ")}`,  // raw changes after ":" — frontend extracts
comment_type: commentType,   // "reopen" or "update" — already correct
    },
  });
}

   // ── Notifier le technicien si réouverture ou modification ──
    if (updatedTicket.assigned_to && changes.length > 0) {

      const employee = user_id ? await prisma.users.findUnique({
        where: { id: parseInt(user_id) },
        select: { name: true, surname: true },
      }) : null;
      const empName = employee ? `${employee.name} ${employee.surname}`.trim() : "L'employé";
     const isReopen = commentType === "reopen";
await notifyTechTicketUpdated(
  updatedTicket.assigned_to, id, updatedTicket.title, empName,
  isReopen ? "reopen" : "update"
); }

    res.json(updatedTicket);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// ── Assignation ───────────────────────────

// ── Assignation ───────────────────────────────────────────────────────────
router.put("/:id/assign", async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const { assigned_to, technicienId, action, assigned_by } = req.body;
  const techId = parseInt(assigned_to || technicienId);
  if (!techId) return res.status(400).json({ error: "Technician ID is required" });
  try {
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { title: true, created_by: true },
    });
   if (!ticket) { // ✅ FIX 2
      return res.status(404).json({ error: "Ticket not found" });
    }
  const updatedTicket = await prisma.tickets.update({
  where: { id: ticketId },
  data: {
  users_tickets_assigned_toTousers: {
    connect: { id: techId },
  },
  assigned_at: new Date(),
  status: action === "taken" ? "in_progress" : "open",
},
});

const techForComment = await prisma.users.findUnique({
  where: { id: techId },
  select: { name: true, surname: true },
});
const techFullName = techForComment
  ? `${techForComment.name} ${techForComment.surname}`.trim()
  : "";

await prisma.ticket_comments.create({
  data: {
    ticket_id: ticketId,
    user_id: assigned_by || null,
    comment:      action === "taken" ? `technician_took_over:${techFullName}` : "ticket_assigned",
    comment_type: action === "taken" ? "taken" : "assigned",
  },
});

    await prisma.ticket_assignments_history.create({
      data: {
        ticket_id:    ticketId,
        from_user_id: action === "assigned" ? assigned_by : null,
        to_user_id:   techId,
        action:       action || "taken",
        reason:       action === "taken" ? "Technician took charge" : "Manager assigned",
        assigned_by:  assigned_by ? parseInt(assigned_by) : null,
      },
    });

    await Promise.allSettled([
  notifyTechAssigned(techId, ticketId, ticket.title)
]);
    if (ticket.created_by) {
      const tech = await prisma.users.findUnique({
        where: { id: techId },
        select: { name: true, surname: true },
      });
      const techName = tech ? `${tech.name} ${tech.surname}`.trim() : "un technicien";
      await notifyEmployeeAssigned(ticket.created_by, ticketId, ticket.title, techName);
    }

    res.json({
      id:          updatedTicket.id,
      title:       updatedTicket.title,
      description: updatedTicket.description,
      status:      updatedTicket.status,
      assigned_to: updatedTicket.assigned_to,
      assigned_at: updatedTicket.assigned_at,
      createdAt:   updatedTicket.created_at.toISOString(),
      updatedAt:   updatedTicket.updated_at.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible d'assigner le ticket" }, err);
  }
});

module.exports = router;