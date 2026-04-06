function UsersTable({ users = [], onRowClick }) {
  if (!users.length) {
    return (
      <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun utilisateur</h3>
        <p className="text-gray-500">Commencez par ajouter le premier utilisateur ou ajustez votre recherche.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nom complet</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rôle</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Département</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date création</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.map((u) => (
            <tr
              key={u.id}
              onClick={() => onRowClick(u)}
              className={`hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer border-b border-gray-100 group relative ${(u.id % 2 === 0) ? 'bg-gradient-to-r from-white to-gray-50' : 'bg-white'}`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    {u.surname?.[0] || '?'}{u.name?.[0] || '?'}
                  </div>
                  <span>{u.surname} {u.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  {u.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.department || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <time>{new Date(u.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  u.is_active 
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-200' 
                    : 'bg-red-100 text-red-800 ring-2 ring-red-200'
                }`}>
                  {u.is_active ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="relative invisible w-0 p-4">
                {/* Centered tooltip text at bottom of row on hover */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 text-gray-900 font-semibold text-sm tracking-wide whitespace-nowrap">
                    Cliquez pour voir plus
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;
