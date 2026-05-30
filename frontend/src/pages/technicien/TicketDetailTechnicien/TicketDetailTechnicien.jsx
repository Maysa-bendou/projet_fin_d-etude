import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import TicketInfo from "./components/TicketInfo";
import Actuality from "./components/Actuality";
import ConversationActions from "./components/ConversationActions";
import ManualCloseModal from "./components/utils/ManualCloseModal";
import { ACT_LABEL_KEYS } from "./components/constants";

const API = "http://localhost:3001/api/tech";

export default function TicketDetailTechnicien() {
  const { t }           = useTranslation("technicien");
  const { t: tC } = useTranslation("common");
  const navigate        = useNavigate();
  const { id }          = useParams();
  const currentUser     = JSON.parse(localStorage.getItem("user") || "null");

  const [ticket, setTicket] = useState(null);
  const [allIds, setAllIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("respond");
  const [respondMode, setRespondMode] = useState("solution");
  const [solution, setSolution] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [solutionFiles, setSolutionFiles] = useState([]);
  const [infoFiles, setInfoFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentError, setSentError] = useState(null);
  const [clearSignal, setClearSignal] = useState(0);
  const [conversation, setConversation] = useState([]);
  const [actuality, setActuality] = useState([]);
  const [services, setServices] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [redirectTechId, setRedirectTechId] = useState("");
  const [redirectServiceId, setRedirectServiceId] = useState("");
  const [redirectCategory, setRedirectCategory] = useState("");
  const [redirectNote, setRedirectNote] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [showManualClose, setShowManualClose] = useState(false);
  const [closingManually, setClosingManually] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const convEndRef = useRef(null);
  const isClosed = status === "closed";

  // ── Locale-aware time formatter ───────────────────────────────────────────
  // Reads date.locale from common.json so time format switches with language.
const fmt = (d) => new Date(d).toLocaleTimeString(tC("date.locale"), { hour: "2-digit", minute: "2-digit", hour12: false })
  // ── Translate legacy French DB status messages ────────────────────────────
  // DB stores status-change messages as French strings e.g. "Statut changé en : Résolu".
  // Maps them back to raw DB key → reads translated label from common.json status.*
  // Then uses common.json history.statusChanged for the full sentence.
  // Only called for comment_type === "status" entries — no logic touched.
  const FR_TO_DB_STATUS = {
    "Ouvert":                 "open",
    "En cours":               "in_progress",
    "En attente":             "pending",
    "En attente fournisseur": "pending_supplier",
    "Résolu":                 "resolved",
    "Fermé":                  "closed",
    "Rejeté":                 "rejected",
  };

const translateStatusMsg = (msg) => {
  if (!msg) return msg;

  // ── status_changed:open ──────────────────────────────────────────
  const newMatch = msg.match(/^status_changed:(.+)$/);
  if (newMatch) {
    const translatedStatus = tC(`status.${newMatch[1]}`, { defaultValue: newMatch[1] });
    return tC("history.statusChanged", { status: translatedStatus });
  }

  // ── technician_took_over ─────────────────────────────────────────
if (msg === "technician_took_over" || msg.startsWith("technician_took_over:")) {
  const name = msg.includes(":") ? msg.split(":").slice(1).join(":") : "";
  return tC("history.technicianTookOver", { name });
}

  // ── ticket_assigned ──────────────────────────────────────────────
if (msg === "ticket_assigned" || msg.startsWith("ticket_assigned:")) {
  const name = msg.includes(":") ? msg.split(":").slice(1).join(":") : "";
  return tC("history.ticketAssigned", { name });
}

  // ── employee_reopened ────────────────────────────────────────────
if (msg === "employee_reopened" || msg.startsWith("employee_reopened:")) {
  const name = msg.includes(":") ? msg.split(":").slice(1).join(":") : "";
  return tC("history.employeeReopened", { name });
}
const updateMatch = msg.match(/^employee_updated:(.+)$/);
if (updateMatch) {
  const translatedDetail = updateMatch[1]
    .split("|")
    .map(part => part.trim())
    .map(part => {
      const m = part.match(/^(.+?):\s*(\S+)\s*→\s*(\S+)$/);
      if (!m) return part;
      const [, rawField, from, to] = m;

      const fieldKey = {
        "Impact":      "impact",
        "Urgence":     "urgency",
        "Urgency":     "urgency",
        "Titre":       "title",
        "Title":       "title",
        "Description": "description",
        "Statut":      "status",
        "Status":      "status",
      }[rawField.trim()] ?? rawField.toLowerCase();

      const fromLabel = tC(`${fieldKey}.${from}`, { defaultValue: from });
      const toLabel   = tC(`${fieldKey}.${to}`,   { defaultValue: to });

      return tC(`history.changes.${fieldKey}_changed`, { from: fromLabel, to: toLabel, defaultValue: `${rawField}: ${fromLabel} → ${toLabel}` });
    })
    .join(" | ");

  return tC("history.employeeUpdated", { detail: translatedDetail });
}
  // ── Legacy French strings (old DB rows) ──────────────────────────
  const legacyMap = {
    "Technicien a pris en charge le ticket": tC("history.technicianTookOver"),
    "Ticket assigné à un technicien":        tC("history.ticketAssigned"),
  };
  if (legacyMap[msg]) return legacyMap[msg];

  // ── Fallback: return as-is ───────────────────────────────────────
  return msg;
};

  const addActEntry = (type, message, date = new Date()) => ({
    id: `act-${Date.now()}-${Math.random()}`,
    type, message,
    date: fmt(date),
    rawDate: new Date(date),
  });

  // ── Fetch ticket — réutilisable ───────────────────────────────────────────
  const fetchTicket = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tickets/${id}`);
      if (!res.ok) throw new Error(t("ticketDetailTech.notFound"));
      const data = await res.json();

      setTicket(data);
      setStatus(data.status);

      const lastConfirmReq = [...data.message ].reverse().find(c => c.comment_type === "confirm");
      const responsesAfterLastConfirm = lastConfirmReq
        ? data.message .filter(c =>
            new Date(c.date) > new Date(lastConfirmReq.date) &&
            (c.comment_type === "confirmed" || c.comment_type === "rejected_confirm")
          )
        : [];
      setAwaitingConfirm(!!lastConfirmReq && responsesAfterLastConfirm.length === 0);

      const convItems = [];
      const actItems = [];



      const CONV_EXCLUDED = new Set(["status", "update", "reopen", "redirect", "taken", "assigned"]);

      data.message .forEach((c) => {
        const type = c.comment_type ?? "comment";
        const dateObj = new Date(c.date);
        const dateStr = fmt(c.date);
        const authorId = c.authorId;

       if (!CONV_EXCLUDED.has(type)) {
  const rawMessage = c.message.replace(/^\[REDIRECTION\]\s*/, "");

  const translatedMessage = {
    "employee_confirmed": tC("history.employeeConfirmed"),
    "employee_rejected":  tC("history.employeeRejected"),
  }[rawMessage] ?? rawMessage;

  convItems.push({
    id: c.id,
    type,
    authorId,
    author: c.author,
    isMe: authorId === currentUser?.id,
    message: translatedMessage,
    files: c.files ?? [],
    date: dateStr,
  });
}

        if (type === "status") {
          actItems.push({ id: `act-${c.id}`, type: "status", message: translateStatusMsg(c.message), date: dateStr, rawDate: dateObj });
        } else if (type === "taken" || type === "assigned") {
          actItems.push({
            id: `act-${c.id}`,
            type: "assigned",
            message: translateStatusMsg(c.message),
            date: dateStr,
            rawDate: dateObj,
          });
        } else if (type === "update") {
          actItems.push({ id: `act-${c.id}`, type: "update", message: translateStatusMsg(`${c.message}`), date: dateStr, rawDate: dateObj });
        } else if (type === "reopen") {
          const reopenName = c.message?.startsWith("employee_reopened:")
            ? c.message.split(":").slice(1).join(":").trim()
            : (c.author ?? "");
          actItems.push({
            id: `act-${c.id}`,
            type: "reopen",
            message: tC("history.employeeReopened", { name: reopenName }),
            date: dateStr,
            rawDate: dateObj,
          });
        } else if (type === "redirect") {
          const raw = c.message.replace(/^\[REDIRECTION\]\s*/, "");
          const redirMatch = raw.match(/^ticket_redirected:([^:]+)(?::(.+))?$/);
          const by = redirMatch ? redirMatch[1].trim() : (c.author ?? "?");
          actItems.push({
            id: `act-${c.id}`,
            type: "redirect",
            message: tC("history.ticketRedirected", { by }),
            date: dateStr,
            rawDate: dateObj,
          });
        } else if (ACT_LABEL_KEYS[type]) {
          actItems.push({ id: `act-${c.id}`, type, messageKey: ACT_LABEL_KEYS[type], date: dateStr, rawDate: dateObj });
        }
      });


      actItems.sort((a, b) => a.rawDate - b.rawDate);
      setConversation(convItems);
      setActuality(actItems);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);
useEffect(() => { fetchTicket(); }, [fetchTicket]);


useEffect(() => {
  if (conversation.length === 0) return;
  if (convEndRef.current) {
    convEndRef.current.scrollTop = convEndRef.current.scrollHeight;
  }
}, [conversation]);
  // Fetch allIds
  useEffect(() => {
    if (!currentUser?.id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/assigned/${currentUser.id}`);
        if (res.ok) setAllIds((await res.json()).map(t => t.id));
      } catch (_) {}
    })();
  }, [currentUser?.id]);

  // Fetch services/techniciens
  useEffect(() => {
    if (activeTab !== "redirect") return;
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch(`${API}/services`),
          fetch(`${API}/techniciens`)
        ]);
        setServices(await sRes.json());
        setTechniciens(await tRes.json());
      } catch (_) {}
    })();
  }, [activeTab]);

  const idx = allIds.indexOf(Number(id));
  const prevId = idx > 0 ? allIds[idx - 1] : null;
  const nextId = idx < allIds.length - 1 ? allIds[idx + 1] : null;

  const goToTicket = (tid) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/\/\d+$/, `/${tid}`);
    navigate(newPath);
  };

  // ── Changer statut ────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    const old = status;
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          technicianId: currentUser?.id,
          ...(newStatus === "closed" && { closedAt: new Date().toISOString() }),
        }),
      });
      if (!res.ok) throw new Error();
      await fetchTicket(true);
    } catch {
      setStatus(old);
    } finally {
      setSavingStatus(false);
    }
  };

  // ── Envoyer solution / info ───────────────────────────────────────────────
  const handleSend = async () => {
    const msg = respondMode === "solution" ? solution : infoMsg;
    const files = respondMode === "solution" ? solutionFiles : infoFiles;
    if (!msg.replace(/<[^>]*>/g, "").trim() && files.length === 0) return;

    setSending(true);
    setSentError(null);
    try {
      const fd = new FormData();
      fd.append("message", msg);
      fd.append("technicianId", currentUser?.id);
      fd.append("type", respondMode);
      files.forEach(f => fd.append("files", f));

      const res = await fetch(`${API}/tickets/${id}/send`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(t("ticketDetailTech.error"));

      if (respondMode === "solution") {
        await doRequestConfirm();
        setSolution("");
        setSolutionFiles([]);
      } else {
        setInfoMsg("");
        setInfoFiles([]);
      }

      setClearSignal(s => s + 1);
      await fetchTicket(true);
    } catch (e) {
      setSentError(e.message);
    } finally {
      setSending(false);
    }
  };

  // ── Demande de confirmation ───────────────────────────────────────────────
  const doRequestConfirm = async () => {
    try {
      const res = await fetch(`${API}/tickets/${id}/request-confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: currentUser?.id }),
      });
      if (!res.ok) return;
      setAwaitingConfirm(true);
    } catch (_) {}
  };

  // ── Fermeture manuelle ────────────────────────────────────────────────────
  const handleManualClose = async (closingNote, files = [], solution = null) => {
    setClosingManually(true);
    try {
      const fd = new FormData();
      fd.append("technicianId", currentUser?.id);
      fd.append("closingNote", closingNote ?? "");
      if (solution) fd.append("solution", solution);
      files.forEach(f => fd.append("files", f));

      const res = await fetch(`${API}/tickets/${id}/close-manual`, {
        method: "PUT",
        body: fd,
      });
      if (!res.ok) throw new Error();
      setShowManualClose(false);
      await fetchTicket(true);
    } catch {
      alert(t("ticketDetailTech.errorClose"));
    } finally {
      setClosingManually(false);
    }
  };

  // ── Redirection ───────────────────────────────────────────────────────────
  const handleRedirect = async () => {
    if (!redirectServiceId) return;
    setRedirecting(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/redirect`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newTechId: redirectTechId || null,
          newServiceId: redirectServiceId || null,
          newCategory: redirectCategory || null,
          note: redirectNote,
          assignedById: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error();
      navigate(`/${currentUser.role}/tickets-service`);
    } catch (_) {
      alert(t("ticketDetailTech.errorRedirect"));
    } finally {
      setRedirecting(false);
    }
  };

  if (loading) return (
    <div  className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">{t("ticketDetailTech.loading")}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 flex items-center gap-2">
      <AlertTriangle size={16}/> {t("ticketDetailTech.error")} : {error}
    </div>
  );

  if (!ticket) return <div className="p-6 text-gray-400">{t("ticketDetailTech.notFound")}</div>;

  const emp = ticket.employee ?? {};
  const ini = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`;
  const empName = `${emp.name ?? ""} ${emp.surname ?? ""}`.trim();
  const solutionBlocked = !isClosed && awaitingConfirm && !ticket?.is_resolved_confirmed;

  return (
    <div className="min-h-screen  p-5" style={{ background: "#faf9f7" }}>
      {showManualClose && (
        <ManualCloseModal
          loading={closingManually}
          onConfirm={handleManualClose}
          onCancel={() => setShowManualClose(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        <Header
          ticket={ticket}
          allIds={allIds}
          idx={idx}
          prevId={prevId}
          nextId={nextId}
          goToTicket={goToTicket}
          navigate={navigate}
        />

        <TicketInfo
          ticket={ticket}
          status={status}
          savingStatus={savingStatus}
          isClosed={isClosed}
          handleStatusChange={handleStatusChange}
          currentUser={currentUser}
          actuality={actuality} 
        />


        <ConversationActions
          conversation={conversation}
          empInitials={ini}
          empName={empName}
          currentUser={currentUser}
          convEndRef={convEndRef}
          activeTab={activeTab}
          respondMode={respondMode}
          solution={solution}
          infoMsg={infoMsg}
          solutionFiles={solutionFiles}
          infoFiles={infoFiles}
          sending={sending}
          sentError={sentError}
          clearSignal={clearSignal}
          redirectTechId={redirectTechId}
          redirectServiceId={redirectServiceId}
          redirectCategory={redirectCategory}
          redirectNote={redirectNote}
          redirecting={redirecting}
          showManualClose={showManualClose}
          closingManually={closingManually}
          setActiveTab={setActiveTab}
          setRespondMode={setRespondMode}
          setSolution={setSolution}
          setInfoMsg={setInfoMsg}
          setSolutionFiles={setSolutionFiles}
          setInfoFiles={setInfoFiles}
          setRedirectTechId={setRedirectTechId}
          setRedirectServiceId={setRedirectServiceId}
          setRedirectCategory={setRedirectCategory}
          setRedirectNote={setRedirectNote}
          setShowManualClose={setShowManualClose}
          handleSend={handleSend}
          handleRedirect={handleRedirect}
          handleManualClose={handleManualClose}
          isClosed={isClosed}
          ticket={ticket}
          services={services}
          techniciens={techniciens}
          awaitingConfirm={awaitingConfirm}
          solutionBlocked={solutionBlocked}
          fetchTicket={fetchTicket}
        />
      </div>
    </div>
  );
}