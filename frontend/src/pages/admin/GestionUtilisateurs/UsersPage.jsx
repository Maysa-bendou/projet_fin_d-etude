import { useState, useEffect, useMemo } from "react";
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

  // Récupérer les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:3001/api/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
        console.error("Users fetch error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch services for dropdown
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/services");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error("Services fetch error:", err);
      }
    };
    fetchServices();
  }, []);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/departments");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Departments fetch error:", err);
      }
    };
    fetchDepartments();
  }, []);

  // Ajouter utilisateur
  const addUser = async (newUser) => {
    try {
      const res = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const createdUser = await res.json();
      setUsers([createdUser, ...users]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Add user error:", err);
      setError(err.message);
    }
  };

  // Modifier utilisateur
  const updateUser = async (updatedUser) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(null);
    } catch (err) {
      console.error("Update user error:", err);
      setError(err.message);
    }
  };

  // Toggle active
  const toggleActive = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}/toggle-active`, { method: "PUT" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setUsers(users.map(u => u.id === id ? {...u, is_active: !u.is_active} : u));
      setSelectedUser(null);
    } catch (err) {
      console.error("Toggle error:", err);
      setError(err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(u => {
      const fullName = `${u.surname || ''} ${u.name || ''}`.toLowerCase();
      const createdDate = new Date(u.created_at || Date.now()).toLocaleDateString('fr-FR').toLowerCase();
      return fullName.includes(lowerSearch) ||
             u.id.toString().includes(lowerSearch) ||
             u.role.toLowerCase().includes(lowerSearch) ||
             (u.department || '').toLowerCase().includes(lowerSearch) ||
             createdDate.includes(lowerSearch);
    });
  }, [users, searchTerm]);

  if (loading) return <div className="p-6 text-center">Chargement des utilisateurs...</div>;
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 font-semibold mb-2">Erreur</div>
        <div className="text-red-800">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex-1">Gestion des Utilisateurs</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <input
                type="text"
                placeholder="Rechercher ID, nom, rôle, département, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 whitespace-nowrap flex items-center gap-3 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter utilisateur
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}
        <div className="mt-8">
          <div className="text-sm text-gray-500 mb-2">
            {filteredUsers.length} utilisateur(s) trouvé(s) {searchTerm && `sur ${users.length}`}
          </div>
          <UsersTable users={filteredUsers} onRowClick={setSelectedUser} />
        </div>
      </div>

      {/* Modal Ajouter */}
      {isAddModalOpen && (
        <UserModal
          services={services}
          departments={departments}
          setUser={setIsAddModalOpen}
          saveUser={addUser}
          mode="add"
        />
      )}

      {/* Modal Modifier */}
      {selectedUser && (
        <UserModal
          services={services}
          departments={departments}
          user={selectedUser}
          setUser={setSelectedUser}
          saveUser={updateUser}
          toggleActive={toggleActive}
          mode="edit"
        />
      )}
    </div>
  );
}

export default UsersPage;
