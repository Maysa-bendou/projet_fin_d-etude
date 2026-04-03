import React from 'react';
import RefreshButton from '../../../components/common/RefreshButton';

const mockStats = {
  totalUsers: 127,
  totalTickets: 456,
  totalServices: 12,
  openTickets: 89,
  resolvedTickets: 312
};

const mockRecentTickets = [
  {
    id: 456,
    title: 'Problème connexion réseau étage 3',
    status: 'open',
    priority: 'high',
    category: 'network',
    createdBy: 'Ahmed Benali',
    service: 'Réseau',
    createdAt: '2024-10-15'
  },
  {
    id: 455,
    title: 'Installation logiciel Office - Bureau 204',
    status: 'in_progress',
    priority: 'medium',
    category: 'software',
    createdBy: 'Fatima Zahra',
    service: 'Informatique',
    createdAt: '2024-10-14'
  },
  {
    id: 454,
    title: 'Panne imprimante bloc B',
    status: 'resolved',
    priority: 'low',
    category: 'hardware',
    createdBy: 'Karim Medjdoub',
    service: 'Matériel',
    createdAt: '2024-10-13'
  },
  // Add more for demo...
  {
    id: 453,
    title: 'Accès bloqué application RH',
    status: 'pending',
    priority: 'high',
    category: 'access',
    createdBy: 'Soumia Lounis',
    service: 'Sécurité',
    createdAt: '2024-10-12'
  }
];

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  pending: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-800'
};

export default function AccueilAdmin() {
  const refreshData = () => {
    // Mock refresh
    console.log('Dashboard refreshed');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Admin</h1>
          <p className="text-gray-500 mt-1">Vue globale du système de gestion des tickets</p>
        </div>
        <RefreshButton onRefresh={refreshData} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalTickets.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tickets ouverts</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.openTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Services</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalServices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Tickets récents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé par</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRecentTickets.slice(0, 5).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={ticket.title}>
                    {ticket.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

