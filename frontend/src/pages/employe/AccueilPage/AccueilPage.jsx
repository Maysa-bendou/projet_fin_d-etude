import React from "react";
import { useNavigate } from "react-router-dom";

// ── Fausses données pour tester ──────────────────
const fakeUser = {
  prenom: "Ali",
  nom: "Benali",
};

const fakeStats = {
  total: 11,
  enCours: 3,
  resolus: 7,
  enAttente: 1,
};

const dernierTicket = {
  id: "IM000007",
  titre: "File d'attente SM9 vide côté utilisateur",
  statut: "En cours",
  priorite: "Haute",
  categorie: "Logiciels",
  service: "IT Support",
  date: "2026-03-15",
};

export default function AccueilPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">

      {/* ── Bienvenue + bouton ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Bonjour, {fakeUser.prenom} {fakeUser.nom} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenue sur votre espace DJEZZY IT Support
          </p>
        </div>
        <button
          onClick={() => navigate("/employee/create-ticket")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Créer un ticket
        </button>
      </div>

      {/* ── Cartes stats colorées ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        {/* Total */}
        <div className="relative bg-orange-500 rounded-2xl p-5 overflow-hidden">
          {/* Cercles décoratifs */}
          <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute right-4 top-5 w-12 h-12 rounded-full bg-white/15" />
          <p className="text-xs text-white/80 mb-2 relative z-10">Total Tickets</p>
          <p className="text-4xl font-semibold text-white relative z-10">{fakeStats.total}</p>
        </div>

        {/* En cours */}
        <div className="relative bg-lime-500 rounded-2xl p-5 overflow-hidden">
          <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute right-4 top-5 w-12 h-12 rounded-full bg-white/15" />
          <p className="text-xs text-white/80 mb-2 relative z-10">En cours</p>
          <p className="text-4xl font-semibold text-white relative z-10">{fakeStats.enCours}</p>
        </div>

        {/* Résolus */}
        <div className="relative bg-teal-700 rounded-2xl p-5 overflow-hidden">
          <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute right-4 top-5 w-12 h-12 rounded-full bg-white/15" />
          <p className="text-xs text-white/80 mb-2 relative z-10">Résolus</p>
          <p className="text-4xl font-semibold text-white relative z-10">{fakeStats.resolus}</p>
        </div>

        {/* En attente */}
        <div className="relative bg-gray-500 rounded-2xl p-5 overflow-hidden">
          <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/20" />
          <div className="absolute right-4 top-5 w-12 h-12 rounded-full bg-white/15" />
          <p className="text-xs text-white/80 mb-2 relative z-10">En attente</p>
          <p className="text-4xl font-semibold text-white relative z-10">{fakeStats.enAttente}</p>
        </div>

      </div>

      {/* ── Bas de page : dernier ticket + carte créer ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>

        {/* Dernier ticket créé */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            Dernier ticket créé
          </p>

          <div className="bg-gray-50 rounded-xl p-4">

            {/* ID + statut + priorité */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-gray-400">
                {dernierTicket.id}
              </span>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {dernierTicket.statut}
              </span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {dernierTicket.priorite}
              </span>
            </div>

            {/* Titre */}
            <p className="text-sm font-medium text-gray-800 mb-3">
              {dernierTicket.titre}
            </p>

            {/* Infos + bouton */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {dernierTicket.categorie} · {dernierTicket.service} · {dernierTicket.date}
              </p>
              <button
                onClick={() => navigate(`/employee/ticket/${dernierTicket.id}`)}
                className="text-blue-600 text-xs font-medium hover:underline"
              >
                Voir →
              </button>
            </div>

          </div>
        </div>

        {/* Carte créer ticket */}
        <div className="bg-blue-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs text-white/70 mb-2">
              Vous avez un problème ?
            </p>
            <p className="text-base font-medium text-white leading-relaxed">
              Créez un ticket et notre équipe IT vous aide rapidement
            </p>
          </div>
          <button
            onClick={() => navigate("/employee/create-ticket")}
            className="mt-6 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            + Créer un ticket
          </button>
        </div>

      </div>
    </div>
  );
}