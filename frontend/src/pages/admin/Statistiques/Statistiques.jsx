import React, { useState } from 'react';
import RefreshButton from '../../../components/common/RefreshButton';
import { 
  MdBarChart, MdPieChart, MdTrendingUp, MdPeople, MdConfirmationNumber 
} from 'react-icons/md';

const mockData = {
  ticketsByStatus: [
    { name: 'Ouvert', value: 89, color: '#FBBF24' },
    { name: 'En cours', value: 145, color: '#3B82F6' },
    { name: 'En attente', value: 32, color: '#F97316' },
    { name: 'Résolu', value: 156, color: '#10B981' },
    { name: 'Fermé', value: 34, color: '#6B7280' }
  ],
  ticketsByCategory: [
    { name: 'Réseau', value: 120, color: '#EF4444' },
    { name: 'Software', value: 98, color: '#3B82F6' },
    { name: 'Hardware', value: 87, color: '#10B981' },
    { name: 'Accès', value: 65, color: '#F59E0B' },
    { name: 'Sécurité', value: 43, color: '#8B5CF6' },
    { name: 'Autre', value: 43, color: '#6B7280' }
  ],
  ticketsByService: [
    { name: 'Réseau', value: 110, color: '#EF4444' },
    { name: 'Informatique', value: 95, color: '#3B82F6' },
    { name: 'Matériel', value: 78, color: '#10B981' },
    { name: 'Sécurité', value: 52, color: '#F59E0B' },
    { name: 'Formation', value: 28, color: '#8B5CF6' }
  ],
  usersByRole: [
    { name: 'Employé', value: 95, color: '#10B981' },
    { name: 'Technicien', value: 18, color: '#3B82F6' },
    { name: 'Chef Service', value: 8, color: '#F59E0B' },
    { name: 'Manager', value: 5, color: '#EF4444' },
    { name: 'Admin', value: 1, color: '#8B5CF6' }
  ],
  ticketsTrend: [120, 135, 110, 145, 180, 156, 189],
  avgResolutionTime: '2.4 jours',
  satisfactionRate: '92%'
};

export default function StatistiquesAdmin() {
  const [loading, setLoading] = useState(false);

  const refreshStats = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  const BarChart = ({ data, title }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
            </div>
            <div className="font-semibold text-gray-900">{item.value}</div>
            <div 
              className="h-3 bg-gray-200 rounded-full ml-4 flex-1 min-w-[120px]"
              style={{ maxWidth: '300px' }}
            >
              <div 
                className="h-3 rounded-full transition-all duration-700"
                style={{ 
                  width: `${Math.min((item.value / Math.max(...data.map(d => d.value))) * 100, 100)}%`,
                  backgroundColor: item.color 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {[
        { icon: MdConfirmationNumber, label: 'Taux résolution', value: '89%', color: 'from-green-400 to-green-500' },
        { icon: MdTrendingUp, label: "Tps moyen résolution", value: mockData.avgResolutionTime, color: 'from-blue-400 to-blue-500' },
        { icon: MdBarChart, label: 'Taux satisfaction', value: mockData.satisfactionRate, color: 'from-purple-400 to-purple-500' }
      ].map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques Globales</h1>
          <p className="text-gray-500 mt-1">Analyse et métriques du système</p>
        </div>
        <RefreshButton onRefresh={refreshStats} loading={loading} />
      </div>

      {/* Key Metrics */}
      <StatsCards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdConfirmationNumber className="text-2xl" />
            Tickets par statut
          </h2>
          <BarChart data={mockData.ticketsByStatus} title="Répartition des tickets" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MdPeople className="text-2xl" />
            Utilisateurs par rôle
          </h2>
          <BarChart data={mockData.usersByRole} title="Répartition des utilisateurs" />
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets par catégorie</h3>
          <BarChart data={mockData.ticketsByCategory} title="" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets par service</h3>
          <BarChart data={mockData.ticketsByService} title="" />
        </div>
      </div>

      {/* Trend Line (simplified) */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Évolution tickets (7 derniers jours)</h3>
        <div className="flex space-x-1 h-20 bg-gray-100 rounded-lg p-4 items-end justify-around">
          {mockData.ticketsTrend.map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded mx-0.5 group-hover:to-blue-500 transition-all"
              style={{ height: `${(value / Math.max(...mockData.ticketsTrend) * 100)}%` }}
              title={`${value} tickets`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">+12% vs semaine précédente</p>
      </div>
    </div>
  );
}

