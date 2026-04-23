import { useState, useEffect, useMemo } from "react";
import { MdSearch, MdAddBusiness, MdRefresh } from "react-icons/md";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentModal from "./DepartmentModal";

export default function DepartementsPage() {
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
            Gestion des Départements
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0, fontWeight: 500 }}>
            Structure organisationnelle de l'entreprise
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px',
            background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            transition: 'background 0.2s',
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
        >
          <MdAddBusiness style={{ fontSize: 18 }} />
          Ajouter département
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 20px', marginBottom: 20, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* CARD PRINCIPALE */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>

        {/* Header card : titre + recherche + refresh */}
        <div style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
            Mes Départements
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 99, padding: '8px 16px', minWidth: 240
            }}>
              <MdSearch style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Rechercher un département..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#374151', width: '100%',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <button
              onClick={fetchDepartments}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10,
                background: '#f9fafb', border: '1px solid #e5e7eb',
                color: '#9ca3af', cursor: 'pointer', transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              <MdRefresh style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* INNER CARD — tableau avec sa propre bordure et son header beige */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <DepartmentsTable departments={filteredDepartments} onRowClick={setSelectedDepartment} />
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