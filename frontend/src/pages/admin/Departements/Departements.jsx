import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineArrowPath,
  HiOutlineBuildingOffice2, HiOutlineFunnel,
} from "react-icons/hi2";
import RefreshButton from "../../../components/common/RefreshButton";
import DepartmentsTable from "./DepartmentsTable";
import DepartmentModal from "./DepartmentModal";

const Sep = () => <div style={{ width: 1, height: 20, background: "#e8e2d9", flexShrink: 0 }} />;

// SuccessCard — all strings from admin namespace, no hardcoded text
const SuccessCard = ({ message, onClose, t }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #d9d4cc", padding: "40px 36px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22, color: "#16a34a", border: "2px solid #bbf7d0" }}>✓</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{t('departments.success.title')}</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 28px" }}>{message}</p>
      <button onClick={onClose} style={{ width: "100%", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t('departments.success.done')}</button>
    </div>
  </div>
);

export default function DepartementsPage() {
  const { t } = useTranslation('admin');

  const [departments,         setDepartments]         = useState([]);
  const [selectedDepartment,  setSelectedDepartment]  = useState(null);
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState(null);
  const [isAddModalOpen,      setIsAddModalOpen]      = useState(false);
  const [searchTerm,          setSearchTerm]          = useState('');
  const [successMsg,          setSuccessMsg]          = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch("http://localhost:3001/api/departments", {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setDepartments(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const s = searchTerm.toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(s) || (d.description || '').toLowerCase().includes(s)
    );
  }, [departments, searchTerm]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9f6f2" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div className="w-9 h-9 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e8e2d9", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('departments.pageTitle')}</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, fontWeight: 500 }}>{t('departments.pageSubtitle')}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <RefreshButton onRefresh={fetchDepartments} />
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <HiOutlineBuildingOffice2 size={15} />
            {t('departments.addButton')}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 28px" }}>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", border: "1px solid #e8e2d9", borderRadius: 10, padding: "7px 12px", overflowX: "auto" }}>
          <HiOutlineFunnel size={14} color="#c4bfb8" style={{ flexShrink: 0 }} />
          <Sep />
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <HiOutlineMagnifyingGlass size={13} color="#94a3b8" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder={t('departments.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "0 26px 0 28px", height: 32, width: 220, fontSize: 12, color: "#1e293b", background: "#fff", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "#93c5fd"}
              onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 7, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <HiOutlineXMark size={12} color="#94a3b8" />
              </button>
            )}
          </div>
          <Sep />
          <button onClick={() => setSearchTerm("")} style={{
            display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 7,
            border: `1px solid ${searchTerm ? "#fca5a5" : "#e2e8f0"}`,
            fontSize: 12, fontWeight: 600,
            color: searchTerm ? "#dc2626" : "#94a3b8",
            background: searchTerm ? "#fef2f2" : "#fff", cursor: "pointer", flexShrink: 0,
          }}>
            <HiOutlineArrowPath size={12} />
            {t('departments.refresh')}
          </button>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{filteredDepartments.length}</span>
            {filteredDepartments.length !== departments.length && <> / {departments.length}</>}
            {" "}{t('departments.cardTitle')}
          </span>
        </div>

        {/* Table */}
        <DepartmentsTable departments={filteredDepartments} onRowClick={setSelectedDepartment} />
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <DepartmentModal
          department={{}}
          setDepartment={setIsAddModalOpen}
          setDepartments={setDepartments}
          departments={departments}
          showSuccess={showSuccess}
        />
      )}
      {selectedDepartment && (
        <DepartmentModal
          department={selectedDepartment}
          setDepartment={setSelectedDepartment}
          setDepartments={setDepartments}
          departments={departments}
          showSuccess={showSuccess}
        />
      )}

      {successMsg && <SuccessCard message={successMsg} onClose={() => setSuccessMsg("")} t={t} />}
    </div>
  );
}