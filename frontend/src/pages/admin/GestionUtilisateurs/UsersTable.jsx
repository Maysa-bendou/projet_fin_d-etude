import React from 'react';

function UsersTable({ users = [], onRowClick }) {
  // Style pour les lignes du tableau
  const cellStyle = "px-8 py-5 whitespace-nowrap text-sm";
  const headerCellStyle = "px-8 py-4 text-left text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.15em]";
  if (!users.length) {
    return (
      <div className="text-center py-24 bg-white">
        <div className="w-16 h-16 bg-[#f9f6f2] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Aucun utilisateur trouvé</h3>
        <p className="text-xs text-slate-400">Ajustez vos filtres ou ajoutez un nouveau membre.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        {/* EN-TÊTE BEIGE COMME DEMANDÉ */}
        <thead className="bg-[#f9f6f2] border-b border-[#eeebe7]">
          <tr>
            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Collaborateur</th>
            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rôle</th>
            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Département</th>
            <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Création</th>
            <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statut</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-50">
          {users.map((u) => (
            <tr
              key={u.id}
              onClick={() => onRowClick(u)}
              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              {/* ID */}
              <td className={`${cellStyle} font-medium text-slate-400`}>#{u.id}</td>

              {/* NOM COMPLET AVEC AVATAR STYLE DJEZZY */}
              <td className="px-8 py-5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-[11px] shrink-0">
                    {u.surname?.[0]}{u.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                      {u.surname} {u.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Membre vérifié</p>
                  </div>
                </div>
              </td>

              {/* RÔLE */}
              <td className="px-8 py-5 whitespace-nowrap">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-200/50">
                  {u.role}
                </span>
              </td>
              {/* DÉPARTEMENT */}
              <td className="px-8 py-5 whitespace-nowrap text-sm font-semibold text-slate-600">
                {u.department || "—"}
              </td>

              {/* DATE */}
              <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-500">
                {new Date(u.created_at).toLocaleDateString('fr-FR', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </td>

              {/* STATUT (Pastille animée) */}
              <td className="px-8 py-5 whitespace-nowrap text-center">
                <div className="flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    u.is_active 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {u.is_active ? 'Actif' : 'Inactif'}
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