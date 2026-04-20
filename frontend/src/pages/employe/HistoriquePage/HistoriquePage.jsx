import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch, MdRefresh } from "react-icons/md";
import RefreshButton from "../../../components/common/RefreshButton";

// Couleurs exactes de priorité (Image 6)
const prioriteStyle = {
  "Basse": "bg-[#eefdf3] text-[#11a75c] border border-[#d1f7e0]",
  "Moyenne": "bg-[#fff9eb] text-[#d99706] border border-[#fef0c7]",
  "Normale": "bg-[#fff9eb] text-[#d99706] border border-[#fef0c7]",
  "Haute": "bg-[#fff1f1] text-[#df2020] border border-[#fee2e2]",
  "Critique": "bg-red-100 text-red-700 border border-red-200",
};

const statutStyle = {
  "Ouvert": "bg-blue-100 text-blue-700",
  "En cours": "bg-yellow-100 text-yellow-700",
  "En attente": "bg-purple-100 text-purple-700",
  "En attente fournisseur": "bg-orange-100 text-orange-700",
  "Résolu": "bg-green-100 text-green-700",
  "Fermé": "bg-gray-200 text-gray-600",
  "Rejeté": "bg-red-100 text-red-700",
};

const statusFR = { open: "Ouvert", in_progress: "En cours", pending: "En attente", pending_supplier: "En attente fournisseur", resolved: "Résolu", closed: "Fermé", rejected: "Rejeté" };
const statusEN = { "Ouvert": "open", "En cours": "in_progress", "En attente": "pending", "En attente fournisseur": "pending_supplier", "Résolu": "resolved", "Fermé": "closed", "Rejeté": "rejected" };
const priorityFR = { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" };
const categoryFR = { hardware: "Hardware", software: "Logiciels", network: "Réseau", access: "Accès", security: "Sécurité", account: "Compte" };

const STAT_CARDS = [
  { label: "Total", key: null, cls: "text-gray-700" },
  { label: "Ouvert", key: "Ouvert", cls: "text-blue-600" },
  { label: "En cours", key: "En cours", cls: "text-yellow-600" },
  { label: "En attente", key: "En attente", cls: "text-purple-600" },
  { label: "En attente fournisseur", key: "En attente fournisseur", cls: "text-orange-600" },
  { label: "Résolu", key: "Résolu", cls: "text-green-600" },
  { label: "Fermé", key: "Fermé", cls: "text-gray-500" },
  { label: "Rejeté", key: "Rejeté", cls: "text-red-600" },
];

export default function TicketsAssignesPage() {
  const navigate = useNavigate();
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statuts, setStatuts] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/tech/assigned/${user.id}`);
      const data = await res.json();
      const mapped = data.map(t => ({
        id: t.id, 
        titre: t.title, 
        employe: t.employee_name,
        priorite: priorityFR[t.priority] ?? t.priority,
        categorie: categoryFR[t.category] ?? t.category,
        statut: statusFR[t.status] ?? t.status,
        date: t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : "N/C",
      }));
      setTicketsData(mapped);
      setStatuts(Object.fromEntries(mapped.map(t => [t.id, t.statut])));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleReset = () => {
    setSearch("");
    setFilterStatut("");
    setFilterPriorite("");
    setFilterCategorie("");
  };

  const filtered = ticketsData.filter(t => {
    const matchSearch = t.titre?.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search) || t.date.includes(search);
    const matchStatut = !filterStatut || statuts[t.id] === filterStatut;
    const matchPriorite = !filterPriorite || t.priorite === filterPriorite;
    const matchCategorie = !filterCategorie || t.categorie === filterCategorie;
    return matchSearch && matchStatut && matchPriorite && matchCategorie;
  });

  const counts = Object.fromEntries(STAT_CARDS.filter(c => c.key).map(c => [c.key, ticketsData.filter(t => statuts[t.id] === c.key).length]));

  return (
    /* L'arrière-plan beige est appliqué ici sur toute la page */
    <div className="p-8 min-h-screen bg-[#f9f6f2]">
      
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Mes tickets assignés</h1>
        <RefreshButton onRefresh={fetchTickets} />
      </div>

      {/* Cartes Stats en haut (Image 5) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {STAT_CARDS.map(({ label, key, cls }) => (
          <div key={label} className="bg-white rounded-2xl border-2 border-[#d9d4cc] p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">{label}</p>
            <p className={`text-2xl font-black ${cls}`}>
              {key === null ? ticketsData.length : (counts[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Le Carré Blanc Unique (Image 11) */}
      <div className="bg-white rounded-[32px] border-2 border-[#d9d4cc] shadow-sm p-8">
        
        <h2 className="text-xl font-bold text-slate-800 mb-6">Liste des interventions</h2>

        {/* Barre de Recherche et Filtres (Image 11) */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Recherche par ID, titre ou date..."
              className="w-full bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {Object.values(statusFR).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600"
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
          >
            <option value="">Toutes les priorités</option>
            {["Basse", "Moyenne", "Haute", "Critique"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            className="bg-[#fcfafb] border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none text-gray-600"
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {Object.values(categoryFR).map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button 
            onClick={handleReset}
            className="text-red-600 font-bold px-4 py-2.5 hover:bg-red-50 rounded-xl transition-colors text-sm"
          >
            Réinitialiser
          </button>
        </div>

        {/* Tableau (Image 11 & 9) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em] border-b border-gray-100">
                <th className="px-4 py-4 w-20">ID</th>
                <th className="px-4 py-4">Titre</th>
                <th className="px-4 py-4">Employé</th>
                <th className="px-4 py-4">Priorité</th>
                <th className="px-4 py-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => navigate(`/technician/ticket-technicien/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-5 text-xs font-black text-slate-300">#{t.id}</td>
                  <td className="px-4 py-5">
                    <p className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{t.titre}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{t.categorie}</p>
                  </td>
                  <td className="px-4 py-5 text-sm font-medium text-slate-500">{t.employe}</td>
                  <td className="px-4 py-5">
                    <span className={`px-4 py-1 rounded-full text-[11px] font-bold ${prioriteStyle[t.priorite]}`}>
                      {t.priorite}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right" onClick={e => e.stopPropagation()}>
                    <select 
                      value={statuts[t.id] ?? ""} 
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer ${statutStyle[statuts[t.id]]}`}
                      onChange={(e) => {/* ton logic changerStatut */}}
                    >
                      {Object.keys(statusEN).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-4 px-2">
            {filtered.length} ticket(s) affiché(s) sur {ticketsData.length}
          </p>
        </div>
      </div>
    </div>
  );
}