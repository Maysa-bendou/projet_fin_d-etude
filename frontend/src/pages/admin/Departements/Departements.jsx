import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdSearch, MdAddBusiness, MdRefresh } from "react-icons/md";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentModal from "./DepartmentModal";

export default function DepartementsPage() {
  const { t } = useTranslation('admin');

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const lowerSearch = searchTerm.toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(lowerSearch) ||
      (d.description || '').toLowerCase().includes(lowerSearch)
    );
  }, [departments, searchTerm]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#e6e5e3]">
      <div className="w-9 h-9 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f6f2] p-8 md:p-10 font-sans">

      {/* HEADER PAGE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 37, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('departments.pageTitle')}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            {t('departments.pageSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-800 shadow-md transition-all active:scale-95"
        >
          <MdAddBusiness className="text-base" />
          {t('departments.addButton')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-6 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* CARD PRINCIPALE */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">

        {/* Header card */}
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-bold text-slate-800">
            {t('departments.cardTitle')}
          </h2>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f9f6f2] border border-gray-300 rounded-lg px-4 py-2 min-w-[280px] focus-within:ring-2 focus-within:ring-slate-300 transition-all">
              <MdSearch className="text-slate-500 text-lg" />
              <input
                type="text"
                placeholder={t('departments.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={fetchDepartments}
              className="p-2.5 bg-[#f9f6f2] border border-gray-300 text-slate-500 rounded-lg hover:text-red-700 transition-colors shadow-sm"
              title={t('departments.refresh')}
            >
              <MdRefresh className="text-xl" />
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="p-5 pt-0">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <DepartmentsTable
              departments={filteredDepartments}
              onRowClick={setSelectedDepartment}
            />
          </div>
        </div>

      </div>

      {/* MODALS */}
      {isAddModalOpen && (
        <DepartmentModal
          department={{}}
          setDepartment={setIsAddModalOpen}
          setDepartments={setDepartments}
          departments={departments}
        />
      )}
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