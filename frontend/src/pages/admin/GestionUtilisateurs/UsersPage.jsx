import { useState, useEffect, useMemo, useCallback } from "react";
import { MdSearch, MdPersonAdd, MdRefresh } from "react-icons/md";
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

      {/* 🔥 TITRE GLOBAL (HORS TABLEAU) */}
       <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
      <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            Administration de l'annuaire et des roles
          </p>

      {/* BOUTON AJOUT */}
      <div className="max-w-7xl mx-auto mb-5 flex justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 shadow-md transition-all active:scale-95"
        >
          <MdPersonAdd size={17} />
          Ajouter utilisateur
        </button>
      </div>

      {/* CONTENEUR PRINCIPAL */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* HEADER (SANS "Annuaire du personnel") */}
        <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-end gap-4 border-b border-slate-100">

          {/* Recherche + refresh */}
          <div className="flex items-center gap-3">

            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 pl-9 pr-4 py-2.5 bg-[#f9f6f2] border border-[#e8e4df] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e8e4df] focus:border-[#d0cac3] transition-all text-slate-600 placeholder:text-slate-400"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="p-2.5 bg-[#f9f6f2] text-slate-500 rounded-lg hover:bg-[#f0ece6] transition-colors border border-[#e8e4df]"
            >
              <MdRefresh size={18} />
            </button>

          </div>
        </div>

        {/* SOUS-TITRE */}
        <div className="px-8 pt-5 pb-2 flex justify-between items-center">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Liste des collaborateurs
          </span>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">
            {filteredUsers.length} Comptes
          </span>
        </div>

        {/* TABLEAU */}
        <div className="px-8 pb-8 pt-2">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
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