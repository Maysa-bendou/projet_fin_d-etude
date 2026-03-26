import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Couleurs statut ───────────────────────────────
const statutStyle = {
  "Ouvert":     "bg-blue-100 text-blue-700",
  "En cours":   "bg-yellow-100 text-yellow-700",
  "En attente": "bg-purple-100 text-purple-700",
  "Résolu":     "bg-green-100 text-green-700",
  "Fermé":      "bg-gray-200 text-gray-700",
};

// ── Couleurs priorité ─────────────────────────────
const prioriteStyle = {
  "Haute":   "bg-red-100 text-red-700",
  "Normale": "bg-yellow-100 text-yellow-700",
  "Basse":   "bg-green-100 text-green-700",
};

// ── Couleurs catégorie ────────────────────────────
const categorieStyle = {
  "Logiciels":    "bg-purple-100 text-purple-800",
  "Hardware":     "bg-blue-100 text-blue-800",
  "VPN":          "bg-orange-100 text-orange-800",
  "Mot de Passe": "bg-pink-100 text-pink-800",
  "Réseau":       "bg-teal-100 text-teal-800",
};

export default function MesTicketsTechnicien() {
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search,          setSearch]          = useState("");
  const [filterStatut,    setFilterStatut]    = useState("");
  const [filterPriorite,  setFilterPriorite]  = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");

  const [statuts, setStatuts] = useState({}); // statut modifiable localement

  // ── Current logged-in technician ─────────────────
  const currentUser = JSON.parse(localStorage.getItem("user")); // adjust if needed
  const currentUserName = currentUser?.name || "";

  // ── Fetch tickets from backend ─────────────────
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("http://localhost:3001/api/tickets"); // check port
        if (!res.ok) throw new Error("Erreur lors du fetch");
        const data = await res.json();

        // Init statuts localement
        const initialStatuts = Object.fromEntries(data.map(t => [t.id, t.statut]));
        setStatuts(initialStatuts);

        setTicketsData(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les tickets.");
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  // ── Changer statut ─────────────────────────────
  function changerStatut(id, nouveauStatut) {
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
  }

  // ── Tickets assignés au technicien ─────────────
  const myTickets = ticketsData.filter(t => t.technicien === currentUserName);

  // ── Tickets filtrés ───────────────────────────
  const filteredTickets = myTickets.filter(t => {
    const matchSearch = search === "" ||
                        (t.id && t.id.toString().toLowerCase().includes(search.toLowerCase())) ||
                        (t.titre && t.titre.toLowerCase().includes(search.toLowerCase())) ||
                        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
    const matchStatut = filterStatut === "" || statuts[t.id] === filterStatut;
    const matchPriorite = filterPriorite === "" || t.priorite === filterPriorite;
    const matchCategorie = filterCategorie === "" || t.categorie === filterCategorie;
    return matchSearch && matchStatut && matchPriorite && matchCategorie;
  });

  // ── Compteurs ────────────────────────────────
  const total = myTickets.length;
  const ouverts = myTickets.filter(t => statuts[t.id] === "Ouvert").length;
  const enCours = myTickets.filter(t => statuts[t.id] === "En cours").length;
  const attente = myTickets.filter(t => statuts[t.id] === "En attente").length;
  const resolus = myTickets.filter(t => statuts[t.id] === "Résolu").length;

  const slaDepasses = myTickets.filter(t => t.slaDepasse);

  const categories = [...new Set(myTickets.map(t => t.categorie).filter(Boolean))];

  if (loading) return <div className="p-6 text-gray-600">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Mes tickets assignés</h1>

      {/* SLA alert */}
      {slaDepasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            Alerte SLA — {slaDepasses.length} ticket(s) ont dépassé le délai de résolution !
          </p>
          <div className="ml-auto flex gap-2">
            {slaDepasses.map(t => (
              <span key={t.id} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                {t.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cartes stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total tickets</p>
          <p className="text-2xl font-semibold text-gray-800">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Ouverts</p>
          <p className="text-2xl font-semibold text-blue-600">{ouverts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">In progress</p>
          <p className="text-2xl font-semibold text-yellow-600">{enCours}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Waiting</p>
          <p className="text-2xl font-semibold text-purple-600">{attente}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Resolved</p>
          <p className="text-2xl font-semibold text-green-600">{resolus}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Recherche par ID, titre ou description..."
          className="border rounded-lg px-3 py-2 text-sm w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="Ouvert">Ouvert</option>
          <option value="En cours">En cours</option>
          <option value="En attente">En attente</option>
          <option value="Résolu">Résolu</option>
          <option value="Fermé">Fermé</option>
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterPriorite}
          onChange={e => setFilterPriorite(e.target.value)}
        >
          <option value="">Toutes les priorités</option>
          <option value="Haute">Haute</option>
          <option value="Normale">Normale</option>
          <option value="Basse">Basse</option>
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          className="text-red-500 border border-red-200 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
          onClick={() => {
            setSearch(""); setFilterStatut(""); setFilterPriorite(""); setFilterCategorie("");
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">TITRE</th>
              <th className="px-4 py-3 font-medium">DESCRIPTION</th>
              <th className="px-4 py-3 font-medium">EMPLOYÉ</th>
              <th className="px-4 py-3 font-medium">TECHNICIEN</th>
              <th className="px-4 py-3 font-medium">PRIORITÉ</th>
              <th className="px-4 py-3 font-medium">STATUT</th>
              <th className="px-4 py-3 font-medium">ASSIGNÉ</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(t => (
              <tr key={t.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${t.slaDepasse ? "bg-red-50" : ""}`}>
                <td className="px-4 py-3 font-mono text-gray-500">{t.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">{t.titre}</td>
                <td className="px-4 py-3 text-gray-600">{t.description}</td>
                <td className="px-4 py-3">{t.employe || "N/A"}</td>
                <td className="px-4 py-3">{t.technicien || "N/A"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioriteStyle[t.priorite] || "bg-gray-100 text-gray-600"}`}>
                    {t.priorite || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={statuts[t.id]}
                    onChange={e => changerStatut(t.id, e.target.value)}
                    className={`border-none rounded-full px-2 py-1 text-xs font-medium cursor-pointer ${statutStyle[statuts[t.id]] || "bg-gray-100 text-gray-600"}`}
                  >
                    <option value="Ouvert">Ouvert</option>
                    <option value="En cours">En cours</option>
                    <option value="En attente">En attente</option>
                    <option value="Résolu">Résolu</option>
                    <option value="Fermé">Fermé</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.assigne ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {t.assigne || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.slaDepasse ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">⚠ Dépassé</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✓ OK</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/technicien/ticket/${t.id}`)}
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    Voir →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun ticket trouvé</div>
        )}
      </div>
    </div>
  );
}