import { useState, useEffect, useMemo } from "react";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentModal from "./DepartmentModal";

export default function DepartementsPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch("http://localhost:3001/api/departments", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        setError(err.message);
        console.error("Departments fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // Delete department
  const deleteDepartment = async (id) => {
    if (!window.confirm("Supprimer ce département ?")) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/departments/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDepartments(departments.filter(d => d.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message);
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const lowerSearch = searchTerm.toLowerCase();
    return departments.filter(d => 
      d.name.toLowerCase().includes(lowerSearch) ||
      (d.description || '').toLowerCase().includes(lowerSearch)
    );
  }, [departments, searchTerm]);

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex-1">Gestion des Départements</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <input
                type="text"
                placeholder="Rechercher nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all whitespace-nowrap flex items-center gap-3 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter département
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
            {filteredDepartments.length} département(s) trouvé(s) {searchTerm && `sur ${departments.length}`}
          </div>
          <DepartmentsTable departments={filteredDepartments} onRowClick={setSelectedDepartment} />
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <DepartmentModal
          department={{}}
          setDepartment={setIsAddModalOpen}
          setDepartments={setDepartments}
          departments={departments}
        />
      )}

      {/* Edit Modal */}
      {selectedDepartment && (
        <DepartmentModal
          department={selectedDepartment}
          setDepartment={setSelectedDepartment}
          setDepartments={setDepartments}
          departments={departments}
        />
      )}
    </div>
  );
}
