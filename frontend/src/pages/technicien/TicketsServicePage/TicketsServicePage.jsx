import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- DATA ---
const ticketsData = [
  { id: 10234, titre: "Problème connexion VPN", priorite: "Critique", categorie: "Réseau", type: "Incident", employe: "Jean Dupont", departement: "Marketing", sla: "2h" },
  { id: 10235, titre: "Serveur down étage 2", priorite: "Critique", categorie: "Infrastructure", type: "Incident", employe: "Admin Sys", departement: "DSI", sla: "1h" },
  { id: 10233, titre: "Erreur installation logiciel", priorite: "Haute", categorie: "Logiciel", type: "Demande", employe: "Marie Curie", departement: "R&D", sla: "4h" },
  { id: 10236, titre: "Migration données", priorite: "Haute", categorie: "Réseau", type: "Demande", employe: "Paul Martin", departement: "Marketing", sla: "3h" },
  { id: 10232, titre: "Écran cassé", priorite: "Moyenne", categorie: "Matériel", type: "Incident", employe: "Pierre Martin", departement: "Ventes", sla: "24h" },
  { id: 10237, titre: "Souris HS", priorite: "Moyenne", categorie: "Matériel", type: "Incident", employe: "Julie Roy", departement: "RH", sla: "24h" },
  { id: 10231, titre: "Mot de passe oublié", priorite: "Basse", categorie: "Compte", type: "Demande", employe: "Sophie Bernard", departement: "RH", sla: "48h" },
  { id: 10230, titre: "Imprimante HS", priorite: "Basse", categorie: "Matériel", type: "Incident", employe: "Lucas Robert", departement: "Comptabilité", sla: "24h" },
];

// --- COMPONENTS ---

const StatCard = ({ title, value, color }) => {
  const colors = { blue: "bg-blue-500", orange: "bg-orange-500", green: "bg-green-500" };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-2 h-12 ${colors[color]} rounded-full`}></div>
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
};

const PriorityBadge = ({ level }) => {
  const config = {
    Critique: "bg-red-100 text-red-700 border-red-200",
    Haute: "bg-orange-100 text-orange-700 border-orange-200",
    Moyenne: "bg-blue-100 text-blue-700 border-blue-200",
    Basse: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded border ${config[level]}`}>{level}</span>;
};

// --- MAIN PAGE ---
const TicketsServicePage = () => {
  const navigate = useNavigate();

  // State for filters
  const [filters, setFilters] = useState({
    priorite: "",
    categorie: "",
    type: "",
    departement: ""
  });

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Filtering Logic
  const filteredTickets = useMemo(() => {
    return ticketsData.filter(ticket => {
      return (
        (filters.priorite === "" || ticket.priorite === filters.priorite) &&
        (filters.categorie === "" || ticket.categorie === filters.categorie) &&
        (filters.type === "" || ticket.type === filters.type) &&
        (filters.departement === "" || ticket.departement === filters.departement)
      );
    });
  }, [filters]);

  return (
    <div className="p-6 bg-slate-100 min-h-screen w-full">
      
      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Tickets libres" value="12" color="blue" />
        <StatCard title="En cours — collègues" value="14" color="orange" />
        <StatCard title="Assignés par manager" value="5" color="green" />
      </section>

      {/* Table Container */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Title Bar */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Tickets du Service</h2>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-64"
            />
          </div>
          
          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100">
                
                {/* --- ROW 1: Column Headers --- */}
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">TITRE</th>
                  <th className="px-6 py-4 font-semibold">PRIORITÉ</th>
                  <th className="px-6 py-4 font-semibold">CATÉGORIE</th>
                  <th className="px-6 py-4 font-semibold">TYPE</th>
                  <th className="px-6 py-4 font-semibold">EMPLOYÉ</th>
                  <th className="px-6 py-4 font-semibold">DÉPARTEMENT</th>
                  <th className="px-6 py-4 font-semibold">SLA</th>
                  <th className="px-6 py-4 font-semibold text-center">ACTION</th>
                </tr>

                {/* --- ROW 2: Filter Choices (Exactly above their own columns) --- */}
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="px-6 py-2"></th> {/* ID - No filter */}
                  <th className="px-6 py-2"></th> {/* Titre - No filter */}
                  
                  {/* Priority Filter */}
                  <th className="px-6 py-2">
                    <select 
                      name="priorite" 
                      onChange={handleFilterChange} 
                      value={filters.priorite}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="">Tous</option>
                      <option value="Critique">Critique</option>
                      <option value="Haute">Haute</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Basse">Basse</option>
                    </select>
                  </th>

                  {/* Category Filter */}
                  <th className="px-6 py-2">
                    <select 
                      name="categorie" 
                      onChange={handleFilterChange} 
                      value={filters.categorie}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="">Tous</option>
                      <option value="Réseau">Réseau</option>
                      <option value="Logiciel">Logiciel</option>
                      <option value="Matériel">Matériel</option>
                      <option value="Compte">Compte</option>
                      <option value="Infrastructure">Infra</option>
                    </select>
                  </th>

                  {/* Type Filter */}
                  <th className="px-6 py-2">
                    <select 
                      name="type" 
                      onChange={handleFilterChange} 
                      value={filters.type}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="">Tous</option>
                      <option value="Incident">Incident</option>
                      <option value="Demande">Demande</option>
                    </select>
                  </th>

                  <th className="px-6 py-2"></th> {/* Employe - No filter */}

                  {/* Department Filter */}
                  <th className="px-6 py-2">
                    <select 
                      name="departement" 
                      onChange={handleFilterChange} 
                      value={filters.departement}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="">Tous</option>
                      <option value="Marketing">Marketing</option>
                      <option value="R&D">R&D</option>
                      <option value="Ventes">Ventes</option>
                      <option value="RH">RH</option>
                      <option value="Comptabilité">Compta</option>
                      <option value="DSI">DSI</option>
                    </select>
                  </th>

                  <th className="px-6 py-2"></th> {/* SLA - No filter */}
                  <th className="px-6 py-2"></th> {/* Action - No filter */}
                </tr>

              </thead>

              {/* --- Table Body --- */}
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs">#{ticket.id}</td>
                      <td 
                        className="px-6 py-4 font-medium text-slate-800 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/technician/tickets-service/${ticket.id}`)}
                      >
                        {ticket.titre}
                      </td>
                      <td className="px-6 py-4"><PriorityBadge level={ticket.priorite} /></td>
                      <td className="px-6 py-4 text-slate-500">{ticket.categorie}</td>
                      <td className="px-6 py-4 text-slate-500">{ticket.type}</td>
                      <td className="px-6 py-4 text-slate-700">{ticket.employe}</td>
                      <td className="px-6 py-4 text-slate-500">{ticket.departement}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{ticket.sla}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                          Prendre
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-400">
                      Aucun ticket trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
            {filteredTickets.length} sur {ticketsData.length} tickets affichés
          </div>
        </div>
      </section>

    </div>
  );
};

export default TicketsServicePage;