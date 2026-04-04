import React from "react";

function DepartmentsTable({ departments = [], onRowClick }) {
  if (!departments.length) {
    return (
      <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-9 3h1m-1 4h1m8-4h1m-1 4h1" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun département</h3>
        <p className="text-gray-500">Commencez par ajouter le premier département.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nom</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date création</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {departments.map((d) => (
            <tr
              key={d.id}
              onClick={() => onRowClick(d)}
              className="hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer border-b border-gray-100 group relative"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{d.id}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm ml-4">
                  {d.name[0]}
                </div>
                <span className="ml-4">{d.name}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate" title={d.description}>{d.description || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <time>{new Date(d.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
              </td>
              <td className="relative invisible w-0 p-4">
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20">
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/50 text-gray-900 font-semibold text-sm whitespace-nowrap">
                    Cliquez pour modifier
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

export default DepartmentsTable;

