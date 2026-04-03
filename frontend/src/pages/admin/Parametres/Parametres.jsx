import React, { useState } from 'react';
import RefreshButton from '../../../components/common/RefreshButton';

const mockServices = [
  { id: 1, name: 'Réseau & Télécom', description: 'Infrastructure réseau, WiFi, fibre', manager: 'Hocine Belkadi', status: 'active' },
  { id: 2, name: 'Informatique Générale', description: 'Support logiciel, Office 365', manager: 'Fatima Zohra', status: 'active' },
  { id: 3, name: 'Matériel & Postes', description: 'PC, laptops, périphériques', manager: 'Karim Belhadj', status: 'active' },
  { id: 4, name: 'Sécurité & Accès', description: 'Comptes, VPN, antivirus', manager: 'Amel Hadj', status: 'active' },
  { id: 5, name: 'Formation & Support', description: 'Sessions formation utilisateurs', manager: 'Rachid Mehenni', status: 'active' },
  { id: 6, name: 'Serveurs & DB', description: 'Serveurs, bases de données', manager: 'Sofiane Khedim', status: 'active' }
];

const mockRoleConfig = {
  employee: { color: 'bg-gray-100 text-gray-800', description: 'Utilisateurs finaux' },
  technician: { color: 'bg-blue-100 text-blue-800', description: 'Techniciens terrain' },
  chef_service: { color: 'bg-yellow-100 text-yellow-800', description: 'Chefs de service' },
  manager: { color: 'bg-red-100 text-red-800', description: 'Managers IT' },
  admin: { color: 'bg-purple-100 text-purple-800', description: 'Super administrateurs' }
};

export default function ParametresAdmin() {
  const [services, setServices] = useState(mockServices);
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const toggleServiceStatus = (serviceId) => {
    setServices(services.map(s => 
      s.id === serviceId 
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
        : s
    ));
  };

  const statusBadge = (status) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {status === 'active' ? 'Actif' : 'Inactif'}
    </span>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres Système</h1>
          <p className="text-gray-500 mt-1">Configuration services et rôles</p>
        </div>
        <RefreshButton onRefresh={refreshData} loading={loading} />
      </div>

      {/* Services Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Services List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Services ({services.length})
            </h2>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              + Nouveau service
            </button>
          </div>
          
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  <p className="text-sm text-gray-600 mt-1">Manager: <span className="font-medium">{service.manager}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(service.status)}
                  <button
                    onClick={() => toggleServiceStatus(service.id)}
                    className="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition"
                  >
                    {service.status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration des Rôles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mockRoleConfig).map(([role, config]) => (
              <div key={role} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${config.color}`}>
                  {role.replace('_', ' ').toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 flex-1">
                    Permissions
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 flex-1">
                    Utilisateurs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-xl">
          <div className="text-3xl font-bold text-blue-600 mb-1">127</div>
          <div className="text-sm text-blue-800 font-medium">Utilisateurs actifs</div>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-xl">
          <div className="text-3xl font-bold text-green-600 mb-1">12</div>
          <div className="text-sm text-green-800 font-medium">Services configurés</div>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-xl">
          <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
          <div className="text-sm text-purple-800 font-medium">Rôles système</div>
        </div>
        <div className="text-center p-6 bg-indigo-50 rounded-xl">
          <div className="text-3xl font-bold text-indigo-600 mb-1">98.5%</div>
          <div className="text-sm text-indigo-800 font-medium">Temps de réponse SLA</div>
        </div>
      </div>
    </div>
  );
}

