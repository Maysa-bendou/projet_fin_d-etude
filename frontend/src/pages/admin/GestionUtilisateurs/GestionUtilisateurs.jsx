import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api";
const token = localStorage.getItem("token");

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Filters
  const [filters, setFilters] = useState({ role: "all", serviceId: "", active: "true", search: "" });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});

  const navigate = useNavigate();

  // Fetch users
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit, ...filters });
      if (filters.search) params.append("search", filters.search);
      const res = await fetch(`${API_BASE}/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          return navigate("/");
        }
        throw new Error("Erreur chargement utilisateurs");
      }
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Services:", err);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchUsers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  // Form handlers
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "", surname: "", email: "", password: "",
      role: "employee", phone: "", department: "", job_title: "",
      office: "", block_number: "", service_id: "", is_active: true
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "", surname: user.surname || "", email: user.email || "",
      role: user.role || "employee", phone: user.phone || "",
      department: user.department || "", job_title: user.job_title || "",
      office: user.office || "", block_number: user.block_number || "",
      service_id: user.service_id || "", is_active: user.is_active !== false
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingUser(null);
  };

  // Submit create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingUser ? `${API_BASE}/users/${editingUser.id}` : `${API_BASE}/users`;
      const method = editingUser ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      closeModal();
      fetchUsers(pagination.page);
    } catch (err) {
      setError("Erreur sauvegarde");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Confirmer désactivation utilisateur?")) return;
    try {
      await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers(pagination.page);
    } catch (err) {
      setError("Erreur suppression");
    }
  };

  const validRoles = ["employee", "technician", "chef_service", "manager", "admin"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Ajouter Utilisateur
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Tous les rôles</option>
            {validRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filters.serviceId || ""}
            onChange={(e) => setFilters({ ...filters, serviceId: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Tous les services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Aucun utilisateur</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.name} {user.surname}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'technician' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.services?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} sur {pagination.pages}
            </div>
            <div className="space-x-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? "Modifier Utilisateur" : "Ajouter Utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" placeholder="Nom" value={formData.name} onChange={handleInputChange} required
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="surname" placeholder="Prénom" value={formData.surname} onChange={handleInputChange} required
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full md:col-span-2" />
                <input name="password" type="password" placeholder={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} 
                  value={formData.password} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full md:col-span-2" />
                <select name="role" value={formData.role} onChange={handleInputChange} required
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full">
                  {validRoles.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <input name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="department" placeholder="Département" value={formData.department} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="job_title" placeholder="Poste" value={formData.job_title} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="office" placeholder="Bureau" value={formData.office} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <input name="block_number" placeholder="Bloc" value={formData.block_number} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
                <select name="service_id" value={formData.service_id || ""} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full">
                  <option value="">Pas de service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <label className="md:col-span-2">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={(e) => 
                    setFormData({ ...formData, is_active: e.target.checked })} className="mr-2" />
                  Actif
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                  {editingUser ? "Mettre à jour" : "Créer"}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 bg-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

