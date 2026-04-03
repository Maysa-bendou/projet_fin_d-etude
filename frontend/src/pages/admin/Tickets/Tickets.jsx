import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RefreshButton from '../../../components/common/RefreshButton';

const mockTickets = [
  {
    id: 456,
    title: 'Problème connexion réseau étage 3',
    description: 'Les ordinateurs des bureaux 301-310 ne se connectent plus au réseau depuis ce matin.',
    status: 'open',
    priority: 'high',
    category: 'network',
    type: 'incident',
    service: { id: 1, name: 'Réseau' },
    createdBy: { id: 123, name: 'Ahmed Benali', role: 'employee' },
    assignedTo: null,
    createdAt: '2024-10-15T09:30:00Z',
    updatedAt: '2024-10-15T09:30:00Z'
  },
  {
    id: 455,
    title: 'Installation Office 365',
    description: 'Nouveau poste de travail bureau 204 nécessite Office 365.',
    status: 'in_progress',
    priority: 'medium',
    category: 'software',
    type: 'service_request',
    service: { id: 2, name: 'Informatique' },
    createdBy: { id: 124, name: 'Fatima Zahra', role: 'employee' },
    assignedTo: { id: 201, name: 'Ali Khedim', role: 'technician' },
    createdAt: '2024-10-14T14:20:00Z',
    updatedAt: '2024-10-15T10:15:00Z'
  },
  {
    id: 454,
    title: 'Panne imprimante HP LaserJet',
    description: 'Imprimante bloc B ne répond plus.',
    status: 'resolved',
    priority: 'low',
    category: 'hardware',
    type: 'incident',
    service: { id: 3, name: 'Matériel' },
    createdBy: { id: 125, name: 'Karim Medjdoub', role: 'employee' },
    assignedTo: { id: 202, name: 'Mounir Belkacem', role: 'technician' },
    createdAt: '2024-10-13T16:45:00Z',
    updatedAt: '2024-10-14T11:30:00Z'
  },
  {
    id: 453,
    title: 'Accès bloqué portail RH',
    description: 'Impossible de se connecter au portail RH depuis 2 jours.',
    status: 'pending',
    priority: 'high',
    category: 'access',
    type: 'incident',
    service: { id: 4, name: 'Sécurité' },
    createdBy: { id: 126, name: 'Soumia Lounis', role: 'employee' },
    assignedTo: null,
    createdAt: '2024-10-12T08:15:00Z',
    updatedAt: '2024-10-12T08:15:00Z'
  },
  {
    id: 452,
    title: 'Formation sécurité informatique',
    description: 'Demande de session formation pour l\'équipe comptabilité.',
    status: 'closed',
    priority: 'low',
    category: 'training',
    type: 'service_request',
    service: { id: 5, name: 'Formation' },
    createdBy: { id: 127, name: 'Nadia Cherif', role: 'employee' },
    assignedTo: null,
    createdAt: '2024-10-10T11:00:00Z',
    updatedAt: '2024-10-11T15:45:00Z'
  }
  // Mock 100+ tickets in real app
];

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  'in_progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  pending: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-800'
};

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-purple-100 text-purple-800'
};

export default function TicketsAdmin() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(mockTickets);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    service: '',
    search: ''
  });
  const [loading, setLoading] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesStatus = !filters.status || ticket.status === filters.status;
      const matchesPriority = !filters.priority || ticket.priority === filters.priority;
      const matchesService = !filters.service || ticket.service.name.toLowerCase().includes(filters.service.toLowerCase());
      const matchesSearch = !filters.search || 
        ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.createdBy.name.toLowerCase().includes(filters.search.toLowerCase());

      return matchesStatus && matchesPriority && matchesService && matchesSearch;
    });
  }, [tickets, filters]);

  const refreshTickets = () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );

  const getPriorityBadge = (priority) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
      {priority?.toUpperCase()}
    </span>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Tickets</h1>
          <p className="text-gray-500 mt-1">Tous les tickets du système ({filteredTickets.length} affichés)</p>
        </div>
        <RefreshButton onRefresh={refreshTickets} loading={loading} />
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              placeholder="Titre, description, créateur..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={filters.service}
              onChange={(e) => setFilters({...filters, service: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="Réseau">Réseau</option>
              <option value="Informatique">Informatique</option>
              <option value="Matériel">Matériel</option>
              <option value="Sécurité">Sécurité</option>
              <option value="Formation">Formation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date création</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mis à jour</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ticket.id}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs" title={ticket.description}>
                        {ticket.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(ticket.priority)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticket.service.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.createdBy.name} <span className="text-xs text-gray-500">({ticket.createdBy.role})</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucun ticket ne correspond aux filtres sélectionnés
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

