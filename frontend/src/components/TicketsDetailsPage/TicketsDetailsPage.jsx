import { useState, useEffect } from "react"; // ✅ useEffect was missing
import { useNavigate, useParams } from "react-router-dom";

// ── Role detection ─────────────────────────────────────────────────────────
const user = JSON.parse(localStorage.getItem("user") || "null");

const rolePath = user?.role === "technician" || user?.role === "technicien"
  ? "technician"
  : user?.role === "manager"
  ? "manager"
  : user?.role === "chef_service"
  ? "chef"
  : user?.role === "employee"
  ? "employee"
  : user?.role === "admin"
  ? "admin"
  : "";

const role = user?.role || "";

// ── Badge helpers ──────────────────────────────────────────────────────────
const PRIORITY_CLASS = {
  High: "bg-red-50 text-red-700 border border-red-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  Low: "bg-green-50 text-green-700 border border-green-200",
};

const STATUS_CLASS = {
  Open: "bg-blue-50 text-blue-700 border border-blue-200",
  "In progress": "bg-amber-50 text-amber-700 border border-amber-200",
  "Waiting on user": "bg-gray-100 text-gray-600 border border-gray-200",
  Resolved: "bg-green-50 text-green-700 border border-green-200",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function TicketsDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ All useState hooks must be declared before any early returns
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");       // ✅ moved up, initialized to ""
  const [solution, setSolution] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [activeTab, setActiveTab] = useState("solution");
  const [sent, setSent] = useState(false);

  // ✅ useEffect placed after all hooks, not in the middle
  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`http://localhost:3001/api/tickets/${id}`);
        if (!res.ok) throw new Error("Erreur lors de la récupération du ticket");
        const data = await res.json();
        setTicket(data);
        setStatus(data.status); // ✅ set status once data is fetched
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [id]);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setSolution("");
    setInfoMsg("");
  };

  // ✅ Conditional renders AFTER all hooks
  if (loading) return <div className="p-6 text-gray-500">Chargement du ticket...</div>;
  if (error)   return <div className="p-6 text-red-500">Erreur : {error}</div>;
  if (!ticket) return <div className="p-6 text-gray-400">Ticket introuvable.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            onClick={() => navigate(`/${rolePath}/tickets-service`)}
            className="hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            ← Retour aux tickets
          </button>
          <span className="opacity-40">›</span>
          <span className="text-gray-800 font-medium">#{ticket.id}</span>
        </div>

        {/* ── Title + badges ── */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 font-mono mb-1">
                #{ticket.id} · {ticket.createdAt}
              </p>
              <h1 className="text-lg font-semibold text-gray-900">{ticket.title}</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${PRIORITY_CLASS[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${STATUS_CLASS[status]}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Change status */}
          <div className="mt-4 flex items-center gap-3">
            <label className="text-xs text-gray-400 font-medium">Changer le statut :</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-black/15 bg-gray-50 text-gray-800 cursor-pointer focus:outline-none focus:border-blue-400"
            >
              <option>Open</option>
              <option>In progress</option>
              <option>Waiting on user</option>
              <option>Resolved</option>
            </select>
          </div>

          {/* Assign / Take ticket buttons */}
          <div className="mt-3 flex gap-2">
            {role === "manager" && (
              <button
                onClick={() => alert("Vous pouvez assigner ce ticket à un technicien")}
                className="px-3 py-2 bg-purple-600 text-white rounded"
              >
                Assigner le ticket
              </button>
            )}
            {role === "technician" && ticket.status !== "Resolved" && (
              <button
                onClick={() => setStatus("In progress")}
                className="px-3 py-2 bg-green-600 text-white rounded"
              >
                Prendre le ticket
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Ticket info ── */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Détails du ticket</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Catégorie", value: ticket.category },
                { label: "Priorité", value: ticket.priority },
                { label: "Statut", value: status },
                { label: "Date d'ouverture", value: ticket.createdAt },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[11px] text-gray-400 mb-0.5">{f.label}</p>
                  <p className="text-[13px] font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
            <hr className="border-black/[0.06]" />
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Description</p>
              <p className="text-[13px] text-gray-600 leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* ── Employee info ── */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Employé</h2>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center shrink-0">
                {ticket.employee.name[0]}{ticket.employee.surname[0]}
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">
                  {ticket.employee.name} {ticket.employee.surname}
                </p>
                <p className="text-[11px] text-gray-400">{ticket.employee.department} · {ticket.employee.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Email", value: ticket.employee.email },
                { label: "Département", value: ticket.employee.department },
                { label: "Rôle", value: ticket.employee.role },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{f.label}</p>
                  <p className="text-[12px] font-medium text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        {role === "technician" && (
          <div className="bg-white rounded-xl border border-black/[0.08] overflow-hidden mt-4">
            <div className="flex border-b border-black/[0.08] bg-gray-50">
              {[
                { id: "solution", label: "Envoyer une solution" },
                { id: "info", label: "Demander une info" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-[12px] font-medium border-b-2 transition-all bg-transparent cursor-pointer
                    ${activeTab === tab.id
                      ? "text-blue-700 border-blue-600 bg-white"
                      : "text-gray-500 border-transparent hover:text-gray-800"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-3">
              {sent && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[12px] text-green-700">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5.5 8.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Message envoyé avec succès !
                </div>
              )}

              {activeTab === "solution" && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Message de solution pour {ticket.employee.name} {ticket.employee.surname}
                    </label>
                    <textarea
                      rows={5}
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Décrivez la solution ici..."
                      className="w-full text-[13px] px-3 py-2 rounded-lg border border-black/15 bg-gray-50 text-gray-800 resize-y leading-relaxed focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!solution.trim()}
                    className="self-start flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Envoyer la solution
                  </button>
                </>
              )}

              {activeTab === "info" && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                      Demande d'information à {ticket.employee.name} {ticket.employee.surname}
                    </label>
                    <textarea
                      rows={5}
                      value={infoMsg}
                      onChange={(e) => setInfoMsg(e.target.value)}
                      placeholder="Posez votre question ici..."
                      className="w-full text-[13px] px-3 py-2 rounded-lg border border-black/15 bg-gray-50 text-gray-800 resize-y leading-relaxed focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!infoMsg.trim()}
                    className="self-start flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Envoyer la demande
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}