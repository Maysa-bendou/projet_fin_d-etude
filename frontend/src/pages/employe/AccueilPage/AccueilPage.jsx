import React, { useState, useEffect } from 'react';
import { Ticket, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import axios from 'axios';

const AccueilPage = () => {
  const [stats, setStats] = useState({ total: 0, resolved: 0, open: 0, rejected: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEmployeeDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
const response = await axios.get('http://localhost:3001/api/accueil/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
});

        if (response.data.type === 'employee') {
          setStats(response.data.stats);
          setTickets(response.data.tickets);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDashboard();
  }, []);

  // Helper to format dates from PostgreSQL/Prisma format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Filter logic for the search bar
  const filteredTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Chargement de vos tickets...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mon Espace Support</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Créés" value={stats.total} icon={Ticket} color="bg-blue-500" />
        <StatCard title="Résolus" value={stats.resolved} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Ouverts" value={stats.open} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Rejetés" value={stats.rejected} icon={XCircle} color="bg-red-500" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Mes Demandes de Support</h2>
          <input 
            type="text" 
            placeholder="Rechercher un ticket..." 
            className="border rounded-md px-3 py-1 text-sm outline-none focus:ring-2 ring-blue-100 transition-all w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Titre</th>
                <th className="p-4 font-medium">Catégorie</th>
                <th className="p-4 font-medium text-center">Priorité</th>
                <th className="p-4 font-medium">Créé le</th>
                <th className="p-4 font-medium">Mis à jour</th>
                <th className="p-4 font-medium">Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4 text-sm font-semibold text-gray-800">{t.title}</td>
                    <td className="p-4 text-sm text-gray-600 capitalize">{t.category}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'high' || t.priority === 'critical' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{formatDate(t.created_at)}</td>
                    <td className="p-4 text-sm text-gray-500">{formatDate(t.updated_at)}</td>
                    <td className="p-4 text-sm text-gray-600 italic max-w-xs truncate">
                      {t.solution || <span className="text-gray-300">En attente...</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400">Aucun ticket trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccueilPage;