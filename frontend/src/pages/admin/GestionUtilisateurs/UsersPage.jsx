import { useState, useEffect, useMemo, useCallback } from "react";
import { MdSearch, MdPersonAdd, MdFilterList, MdRefresh } from "react-icons/md";
import UsersTable from "./UsersTable";
import UserModal from "./UserModal";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, sRes, dRes] = await Promise.all([
        fetch("http://localhost:3001/api/users"),
        fetch("http://localhost:3001/api/users/services"),
        fetch("http://localhost:3001/api/departments")
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (sRes.ok) setServices(await sRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
    } catch (err) {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return users.filter(u => 
      `${u.surname} ${u.name}`.toLowerCase().includes(s) || 
      u.id.toString().includes(s) || 
      (u.role || '').toLowerCase().includes(s)
    );
  }, [users, searchTerm]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#f9f6f2]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f6f2] p-8 font-sans">
      
      {/* ── HEADER DE LA PAGE ── */}
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Administration de l'annuaire et des rôles</p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#11a75c] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#0e8f4d] shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <MdPersonAdd size={18} />
          Ajouter utilisateur
        </button>
      </div>

      {/* ── CONTENEUR PRINCIPAL ── */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        
        {/* BARRE DE RECHERCHE ET ACTIONS */}
        <div className="p-8 border-b border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 max-w-lg">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, ID ou rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[1.2rem] text-sm focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all text-slate-600 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                <MdRefresh size={20} />
              </button>
              <button className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100">
                <MdFilterList size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION DU TABLEAU */}
        <div className="p-8 pt-4">
            <div className="mb-6 flex justify-between items-center px-2">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Annuaire du personnel</h2>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  {filteredUsers.length} Comptes actifs
                </span>
            </div>
            
            {/* Ici on entoure le tableau pour gérer ses arrondis */}
            <div className="border border-slate-100 rounded-[1.8rem] overflow-hidden shadow-sm">
                <UsersTable users={filteredUsers} onRowClick={setSelectedUser} />
            </div>
        </div>
      </div>

      {/* MODALS */}
      {isAddModalOpen && (
        <UserModal services={services} departments={departments} setUser={setIsAddModalOpen} mode="add" />
      )}
      {selectedUser && (
        <UserModal services={services} departments={departments} user={selectedUser} setUser={setSelectedUser} mode="edit" />
      )}
    </div>
  );
}

export default UsersPage;