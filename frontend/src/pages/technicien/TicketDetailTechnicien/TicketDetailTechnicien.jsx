import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Header from "./components/Header";
import TicketInfo from "./components/TicketInfo";
import Actuality from "./components/Actuality";
import ConversationActions from "./components/ConversationActions";
import ManualCloseModal from "./components/utils/ManualCloseModal";
import { ACT_LABEL } from "./components/constants";

const API = "http://localhost:3001/api/tech";

export default function TicketDetailTechnicien() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

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
  const fmt = (d) => new Date(d).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" });

  const addActEntry = (type, message, date = new Date()) => ({
    id: `act-${Date.now()}-${Math.random()}`,
    type, message,
    date: fmt(date),
    rawDate: new Date(date),
  });

  // ── Fetch ticket — fonction réutilisable ──────────────────────────────────
  const fetchTicket = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/tickets/${id}`);
      if (!res.ok) throw new Error("Ticket introuvable");
      const data = await res.json();

      setTicket(data);
      setStatus(data.status);
     const lastConfirmReq = [...data.comments].reverse().find(c => c.comment_type === "confirm");
const responsesAfterLastConfirm = lastConfirmReq
  ? data.comments.filter(c =>
      new Date(c.date) > new Date(lastConfirmReq.date) &&
      (c.comment_type === "confirmed" || c.comment_type === "rejected_confirm")
    )
  : [];
setAwaitingConfirm(!!lastConfirmReq && responsesAfterLastConfirm.length === 0);   const convItems = [];
      const actItems = [];

      actItems.push({
        id: "act-assigned", type: "assigned",
        message: "Ticket assigné",
        date: fmt(data.createdAt),
        rawDate: new Date(data.createdAt),
      });

      data.comments.forEach((c) => {
        const type = c.comment_type ?? "comment";
        const dateObj = new Date(c.date);
        const dateStr = fmt(c.date);
        const authorId = c.authorId;

        convItems.push({
          id: c.id,
          type,
          authorId,
          author: c.author,
          isMe: authorId === currentUser?.id,
          message: c.message.replace(/^\[REDIRECTION\]\s*/, ""),
         files: c.files ?? [],
          date: dateStr,
        });

        if (type === "status") {
          actItems.push({ id: `act-${c.id}`, type: "status", message: c.message, date: dateStr, rawDate: dateObj });
        } else if (ACT_LABEL[type]) {
          actItems.push({ id: `act-${c.id}`, type, message: ACT_LABEL[type], date: dateStr, rawDate: dateObj });
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
  }, [id]);

  // Chargement initial
  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  // Auto-scroll
  useEffect(() => {
    convEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        body: JSON.stringify({ status: newStatus, technicianId: currentUser?.id }),
      });
      if (!res.ok) throw new Error();
      await fetchTicket(true); // ← rafraîchit sans spinner
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
      if (!res.ok) throw new Error("Erreur serveur");

      if (respondMode === "solution") {
        await doRequestConfirm();
        setSolution("");
        setSolutionFiles([]);
      } else {
        setInfoMsg("");
        setInfoFiles([]);
      }

      setClearSignal(s => s + 1);
      await fetchTicket(true); // ← rafraîchit la conversation et l'historique
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
  const handleManualClose = async (closingNote) => {
    setClosingManually(true);
    try {
      const res = await fetch(`${API}/tickets/${id}/close-manual`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: currentUser?.id, closingNote }),
      });
      if (!res.ok) throw new Error();
      setShowManualClose(false);
      await fetchTicket(true); // ← rafraîchit tout après fermeture
    } catch {
      alert("Erreur lors de la fermeture.");
    } finally {
      setClosingManually(false);
    }
  };

  // ── Redirection ───────────────────────────────────────────────────────────
  const handleRedirect = async () => {
    if (!redirectTechId && !redirectServiceId) return;
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
      setRedirectTechId(""); setRedirectServiceId(""); setRedirectCategory(""); setRedirectNote("");
      await fetchTicket(true); // ← rafraîchit après redirection
    } catch (_) {
      alert("Erreur lors de la redirection.");
    } finally {
      setRedirecting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-sm text-gray-500">Chargement du ticket...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 flex items-center gap-2">
      <AlertTriangle size={16}/> Erreur : {error}
    </div>
  );

  if (!ticket) return <div className="p-6 text-gray-400">Ticket introuvable.</div>;

  const emp = ticket.employee ?? {};
  const ini = `${emp.name?.[0] ?? "?"}${emp.surname?.[0] ?? ""}`;
  const empName = `${emp.name ?? ""} ${emp.surname ?? ""}`.trim();
  const solutionBlocked = !isClosed && awaitingConfirm && !ticket?.is_resolved_confirmed;

  return (
    <div className="min-h-screen bg-gray-50 p-5">
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
        />

        <Actuality actuality={actuality} />

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
        />
      </div>
    </div>
  );
}