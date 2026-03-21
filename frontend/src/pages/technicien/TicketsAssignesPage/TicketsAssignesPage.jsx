import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Fausses données pour tester ──────────────────
const ticketsData = [
  {
    id: "IM000007",
    titre: "File d'attente SM9 vide côté utilisateur",
    employe: "Karim Amrani",
    categorie: "Logiciels",
    priorite: "Haute",
    statut: "En cours",
    slaDepasse: false,
    assigne: "Manager",
    dateCreation: "2026-03-15",
  },
  {
    id: "IM000005",
    titre: "Imprimante réseau introuvable – 3e étage",
    employe: "Sara Haddad",
    categorie: "Hardware",
    priorite: "Normale",
    statut: "Résolu",
    slaDepasse: true,
    assigne: "Self",
    dateCreation: "2026-03-13",
  },
  {
    id: "IM000002",
    titre: "Coupures VPN récurrentes",
    employe: "Nadia Benali",
    categorie: "VPN",
    priorite: "Basse",
    statut: "En attente",
    slaDepasse: false,
    assigne: "Manager",
    dateCreation: "2026-03-12",
  },
  {
    id: "IM000009",
    titre: "Mot de passe expiré",
    employe: "Ahmed Hamza",
    categorie: "Mot de Passe",
    priorite: "Normale",
    statut: "Ouvert",
    slaDepasse: false,
    assigne: "Manager",
    dateCreation: "2026-03-16",
  },
  {
    id: "IM000010",
    titre: "PC ne démarre plus",
    employe: "Youcef Kaci",
    categorie: "Hardware",
    priorite: "Haute",
    statut: "En cours",
    slaDepasse: false,
    assigne: "Self",
    dateCreation: "2026-03-17",
  },
];

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
  "Logiciels":   "bg-purple-100 text-purple-800",
  "Hardware":    "bg-blue-100 text-blue-800",
  "VPN":         "bg-orange-100 text-orange-800",
  "Mot de Passe":"bg-pink-100 text-pink-800",
  "Réseau":      "bg-teal-100 text-teal-800",
};

export default function MesTicketsTechnicien() {
  const navigate = useNavigate();

  // ── Filtres ───────────────────────────────────
  const [search,         setSearch]         = useState("");
  const [filterStatut,   setFilterStatut]   = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [filterCategorie,setFilterCategorie]= useState("");

  // ── Statut modifiable par le technicien ───────
  // On garde les statuts dans un state local
  const [statuts, setStatuts] = useState(
    Object.fromEntries(ticketsData.map(t => [t.id, t.statut]))
  );

  // ── Changer statut d'un ticket ────────────────
  function changerStatut(id, nouveauStatut) {
    setStatuts(prev => ({ ...prev, [id]: nouveauStatut }));
  }

  // ── Tickets filtrés ───────────────────────────
  const filteredTickets = ticketsData.filter((t) => {
    const matchSearch    = search === "" ||
                           t.id.toLowerCase().includes(search.toLowerCase()) ||
                           t.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatut    = filterStatut    === "" || statuts[t.id] === filterStatut;
    const matchPriorite  = filterPriorite  === "" || t.priorite    === filterPriorite;
    const matchCategorie = filterCategorie === "" || t.categorie   === filterCategorie;
    return matchSearch && matchStatut && matchPriorite && matchCategorie;
  });

  // ── Compteurs pour les cartes stats ──────────
  const total    = ticketsData.length;
  const ouverts  = ticketsData.filter(t => statuts[t.id] === "Ouvert").length;
  const enCours  = ticketsData.filter(t => statuts[t.id] === "En cours").length;
  const attente  = ticketsData.filter(t => statuts[t.id] === "En attente").length;
  const resolus  = ticketsData.filter(t => statuts[t.id] === "Résolu").length;

  // ── Tickets SLA dépassé ───────────────────────
  const slaDepasses = ticketsData.filter(t => t.slaDepasse);

  // ── Catégories uniques pour le filtre ─────────
  const categories = [...new Set(ticketsData.map(t => t.categorie))];

  return (
    <div className="p-6">

      {/* Titre */}
      <h1 className="text-2xl font-semibold mb-4">
        Mes tickets assignés
      </h1>

      {/* ── Alerte SLA ── */}
      {/* S'affiche seulement si au moins 1 ticket a dépassé le SLA */}
      {slaDepasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          {/* Point rouge clignotant */}
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            Alerte SLA — {slaDepasses.length} ticket(s) ont dépassé le délai de résolution !
          </p>
          {/* Liste des IDs dépassés */}
          <div className="ml-auto flex gap-2">
            {slaDepasses.map(t => (
              <span
                key={t.id}
                className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium"
              >
                {t.id}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-5 gap-3 mb-6">

        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total tickets</p>
          <p className="text-2xl font-semibold text-gray-800">{total}</p>
        </div>

        {/* Ouverts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Ouverts</p>
          <p className="text-2xl font-semibold text-blue-600">{ouverts}</p>
        </div>

        {/* In progress */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">In progress</p>
          <p className="text-2xl font-semibold text-yellow-600">{enCours}</p>
        </div>

        {/* Waiting */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Waiting</p>
          <p className="text-2xl font-semibold text-purple-600">{attente}</p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Resolved</p>
          <p className="text-2xl font-semibold text-green-600">{resolus}</p>
        </div>

      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 mb-4">

        {/* Recherche */}
        <input
          type="text"
          placeholder="Recherche par ID ou titre..."
          className="border rounded-lg px-3 py-2 text-sm w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filtre statut */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="Ouvert">Ouvert</option>
          <option value="En cours">En cours</option>
          <option value="En attente">En attente</option>
          <option value="Résolu">Résolu</option>
          <option value="Fermé">Fermé</option>
        </select>

        {/* Filtre priorité */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterPriorite}
          onChange={(e) => setFilterPriorite(e.target.value)}
        >
          <option value="">Toutes les priorités</option>
          <option value="Haute">Haute</option>
          <option value="Normale">Normale</option>
          <option value="Basse">Basse</option>
        </select>

        {/* Filtre catégorie */}
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {/* On génère les options depuis les données */}
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Réinitialiser */}
        <button
          className="text-red-500 border border-red-200 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
          onClick={() => {
            setSearch("");
            setFilterStatut("");
            setFilterPriorite("");
            setFilterCategorie("");
          }}
        >
          Réinitialiser
        </button>

      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">TITRE</th>
              <th className="px-4 py-3 font-medium">EMPLOYÉ</th>
              <th className="px-4 py-3 font-medium">CATÉGORIE</th>
              <th className="px-4 py-3 font-medium">PRIORITÉ</th>
              <th className="px-4 py-3 font-medium">STATUT</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">ASSIGNÉ</th>
              <th className="px-4 py-3 font-medium">DATE</th>
              <th className="px-4 py-3 font-medium">ACTION</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((t) => (
              <tr
                key={t.id}
                className={`
                  border-t border-gray-100 hover:bg-gray-50 transition
                  ${t.slaDepasse ? "bg-red-50" : ""}
                `}
              >
                {/* ID */}
                <td className="px-4 py-3 font-mono text-gray-500">{t.id}</td>

                {/* Titre */}
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                  {t.titre}
                </td>

                {/* Employé avec initiales */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">
                        {t.employe.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <span className="text-gray-600 text-xs">{t.employe}</span>
                  </div>
                </td>

                {/* Catégorie */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categorieStyle[t.categorie] || "bg-gray-100 text-gray-600"}`}>
                    {t.categorie}
                  </span>
                </td>

                {/* Priorité */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${prioriteStyle[t.priorite]}`}>
                    {t.priorite}
                  </span>
                </td>

                {/* Statut — menu déroulant pour changer */}
                <td className="px-4 py-3">
                  <select
                    value={statuts[t.id]}
                    onChange={(e) => changerStatut(t.id, e.target.value)}
                    className={`
                      border-none rounded-full px-2 py-1 text-xs font-medium cursor-pointer
                      ${statutStyle[statuts[t.id]]}
                    `}
                  >
                    <option value="Ouvert">Ouvert</option>
                    <option value="En cours">En cours</option>
                    <option value="En attente">En attente</option>
                    <option value="Résolu">Résolu</option>
                    <option value="Fermé">Fermé</option>
                  </select>
                </td>

                {/* SLA */}
                <td className="px-4 py-3">
                  {t.slaDepasse ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                      ⚠ Dépassé
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      ✓ OK
                    </span>
                  )}
                </td>

                {/* Assigné */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.assigne === "Self"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {t.assigne}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-gray-500">{t.dateCreation}</td>

                {/* Action */}
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

        {/* Message si aucun résultat */}
        {filteredTickets.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            Aucun ticket trouvé
          </div>
        )}

      </div>
    </div>
  );
}