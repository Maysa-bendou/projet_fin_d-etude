import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperclip, FaExclamationCircle } from "react-icons/fa";

// ── OPTIONS ──────────────────────────────
const TYPE_OPTIONS = [
  { value: "incident", label: "Incident" },
  { value: "service_request", label: "Demande de service" },
  { value: "change", label: "Changement" },
  { value: "problem", label: "Problème" },
];
const CATEGORY_OPTIONS = [
  { value: "hardware", label: "Matériel" },
  { value: "software", label: "Logiciels" },
  { value: "network", label: "Réseau" },
  { value: "access", label: "Accès" },
  { value: "security", label: "Sécurité" },
  { value: "account", label: "Compte" },
];
const IMPACT_OPTIONS = [
  { value: "low", label: "Une personne", desc: "Seul mon poste est affecté" },
  { value: "medium", label: "Un service", desc: "Plusieurs collègues bloqués" },
  { value: "high", label: "Entreprise", desc: "L'entreprise entière est impactée" },
];
const URGENCY_OPTIONS = [
  { value: "low", label: "Peut travailler", desc: "Je peux continuer" },
  { value: "medium", label: "Partiellement bloqué", desc: "Certaines tâches impossibles" },
  { value: "high", label: "Complètement bloqué", desc: "Impossible de travailler" },
];
const PRIORITY_MATRIX = { high: { high: "critical", medium: "high", low: "medium" }, medium: { high: "high", medium: "medium", low: "low" }, low: { high: "medium", medium: "low", low: "low" } };
const PRIORITY_LABEL = { critical: { label: "Critique", cls: "bg-red-200 text-red-800" }, high: { label: "Haute", cls: "bg-red-100 text-red-700" }, medium: { label: "Normale", cls: "bg-yellow-100 text-yellow-700" }, low: { label: "Basse", cls: "bg-green-100 text-green-700" } };
const SLA_LABEL = { critical: "3 jours", high: "3 jours", medium: "1 semaine", low: "2 semaines" };

// ── SMALL COMPONENTS ──────────────────────────────
const OptionButtons = ({ options, selected, onSelect, small }) => (
  <div className={`grid gap-2 ${small ? "grid-cols-3 text-xs" : "grid-cols-2"}`}>
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onSelect(opt.value)}
        className={`py-2 px-3 rounded-lg border font-medium transition ${
          selected === opt.value ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const FileList = ({ files }) =>
  files.length > 0 && (
    <div className="mt-2 space-y-1">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
          <FaPaperclip /> <span className="truncate">{f.name}</span>
          <span className="ml-auto text-gray-400">{(f.size / 1024).toFixed(0)} Ko</span>
        </div>
      ))}
    </div>
  );

// ── MAIN COMPONENT ──────────────────────────────
export default function CreateTicketPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({ type: "incident", title: "", description: "", category: "", impact: "", urgency: "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const priority = form.impact && form.urgency ? PRIORITY_MATRIX[form.impact][form.urgency] : null;
  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Le titre est obligatoire.");
    if (!form.description.trim()) return setError("La description est obligatoire.");
    if (!form.category) return setError("Veuillez choisir une catégorie.");
    if (!form.impact) return setError("Veuillez choisir un impact.");
    if (!form.urgency) return setError("Veuillez choisir une urgence.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/tickets/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, created_by: user.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Ticket créé avec succès</h2>
        <p className="text-gray-400 text-sm mb-6">Ticket <span className="font-mono text-gray-600">#{success.id}</span> soumis.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
          <div className="flex justify-between"><span className="text-gray-400">Priorité</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_LABEL[success.priority]?.cls}`}>{PRIORITY_LABEL[success.priority]?.label}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Délai SLA</span><span className="text-gray-700 font-medium">{SLA_LABEL[success.priority]}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Échéance</span><span className="text-gray-700">{new Date(success.sla_due_date).toLocaleDateString("fr-FR")}</span></div>
        </div>
        <button onClick={() => navigate("/employee/mes-tickets")} className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition">Voir mes tickets</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold mb-2">Créer un ticket</h1>
        <p className="text-sm text-gray-400 mb-6">Décrivez votre problème pour être assigné rapidement.</p>
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-5">

          {/* Left */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Type *</label>
              <OptionButtons options={TYPE_OPTIONS} selected={form.type} onSelect={v => setForm(f => ({ ...f, type: v }))} />
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Titre *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Ex : VPN impossible" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300" />
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Détails..." className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300" />
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Catégorie *</label>
              <OptionButtons options={CATEGORY_OPTIONS} selected={form.category} onSelect={v => setForm(f => ({ ...f, category: v }))} small />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Impact *</label>
              <OptionButtons options={IMPACT_OPTIONS} selected={form.impact} onSelect={v => setForm(f => ({ ...f, impact: v }))} />
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Urgence *</label>
              <OptionButtons options={URGENCY_OPTIONS} selected={form.urgency} onSelect={v => setForm(f => ({ ...f, urgency: v }))} />
            </div>

            {priority && (
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <p className="text-sm font-medium mb-2">Récapitulatif</p>
                <div className="flex justify-between"><span className="text-gray-500">Priorité</span><span className={`px-3 py-1 rounded-full text-xs font-medium ${PRIORITY_LABEL[priority]?.cls}`}>{PRIORITY_LABEL[priority]?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">SLA</span><span className="text-gray-700 text-sm">{SLA_LABEL[priority]}</span></div>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <label className="block text-sm font-medium mb-2">Pièces jointes</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-red-300 hover:bg-red-50 transition">
                <FaPaperclip className="text-2xl mb-1" />
                <span className="text-sm text-gray-500">Cliquez pour ajouter</span>
                <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
              </label>
              <FileList files={files} />
            </div>
          </div>

          {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><FaExclamationCircle /> {error}</div>}

          <div className="flex justify-between mt-6 lg:col-span-2">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Envoi…" : "Créer le ticket"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}