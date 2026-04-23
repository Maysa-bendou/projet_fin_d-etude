import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  open:             { label: "Ouvert",           bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  in_progress:      { label: "En cours",         bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  resolved:         { label: "Résolu",           bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  closed:           { label: "Fermé",            bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  rejected:         { label: "Rejeté",           bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  pending:          { label: "En attente",       bg: "#fefce8", color: "#a16207", border: "#fde68a" },
  pending_supplier: { label: "Attente fournisseur", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critique", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  high:     { label: "Haute",    color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  medium:   { label: "Normale",  color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  low:      { label: "Basse",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

const selectStyle = {
  border: "1.5px solid #d9d4cc",
  borderRadius: 8,
  padding: "8px 32px 8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  appearance: "none",
  cursor: "pointer",
  minWidth: 160,
};

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const FilterSelect = ({ label, value, onChange, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {children}
      </select>
      <ChevronDown />
    </div>
  </div>
);

export default function MesTicketsPage() {
  const navigate = useNavigate();
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTicketId, setHoveredTicketId] = useState(null);
  
  // ── États pour les options dynamiques depuis la DB (restauré de l'ancien code) ──
  const [dbEnums, setDbEnums] = useState({ statuts: [], priorites: [], categories: [] });
  const [dbServices, setDbServices] = useState([]);
  
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // ── Fetch data avec les enums et services depuis la DB ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        navigate("/login");
        return;
      }

      // ✅ Restauré: fetch des enums et services depuis la DB
      const enumRes = await fetch("http://localhost:3001/api/tech/enums");
      const enumData = await enumRes.json();
      setDbEnums(enumData);

      const serviceRes = await fetch("http://localhost:3001/api/tech/services");
      const servicesData = await serviceRes.json();
      setDbServices(servicesData);

      const ticketRes = await fetch(`http://localhost:3001/api/tickets/my/${user.id}`);
      if (!ticketRes.ok) throw new Error("Erreur lors de la récupération des tickets");
      const ticketData = await ticketRes.json();
      setTicketsData(ticketData);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // ── Filtrage et tri ──
  const filteredTickets = useMemo(() => {
    return ticketsData
      .filter(t => {
        const matchesStatus = !filterStatus || t.status === filterStatus;
        const matchesPriority = !filterPriority || t.priority === filterPriority;
        const matchesService = !filterService || t.service === filterService;
        const matchesCategory = !filterCategory || t.category === filterCategory;
        return matchesStatus && matchesPriority && matchesService && matchesCategory;
      })
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  }, [ticketsData, filterStatus, filterPriority, filterService, filterCategory]);

  const hasFilters = filterStatus || filterPriority || filterService || filterCategory;

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#1d4ed8", fontWeight: 600, background: "#f9f6f2", minHeight: "100vh" }}>
      Chargement des tickets...
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#dc2626", background: "#f9f6f2", minHeight: "100vh" }}>
      Erreur : {error}
    </div>
  );

  return (
    <div style={{ padding: "32px", background: "#f9f6f2", minHeight: "100vh" }}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}>

      {/* Tooltip flottant */}
      {hoveredTicketId && (
        <div style={{
          position: "fixed", pointerEvents: "none", zIndex: 50,
          left: mousePos.x, top: mousePos.y - 14,
          transform: "translateX(-50%) translateY(-100%)",
          background: "#1e293b", color: "#fff", fontSize: 11,
          padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap",
        }}>
          Cliquer pour voir les détails
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>Mes Tickets</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Suivez et gérez l'état de vos demandes de support.</p>
      </div>

      {/* Filters card */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc", padding: "18px 22px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        <FilterSelect label="Statut" value={filterStatus} onChange={setFilterStatus}>
          <option value="">Tous les statuts</option>
          {dbEnums.statuts?.map(s => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s]?.label || s}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Catégorie" value={filterCategory} onChange={setFilterCategory}>
          <option value="">Toutes les catégories</option>
          {dbEnums.categories?.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FilterSelect>

        <FilterSelect label="Priorité" value={filterPriority} onChange={setFilterPriority}>
          <option value="">Toutes les priorités</option>
          {dbEnums.priorites?.map(p => (
            <option key={p} value={p}>
              {PRIORITY_CONFIG[p]?.label || p}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Service" value={filterService} onChange={setFilterService}>
          <option value="">Tous les services</option>
          {dbServices.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </FilterSelect>

        <button
          onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterService(""); setFilterCategory(""); }}
          style={{ 
            padding: "8px 16px", 
            border: "1.5px solid #d9d4cc", 
            borderRadius: 8, 
            fontSize: 13, 
            fontWeight: 500, 
            color: hasFilters ? "#dc2626" : "#94a3b8", 
            background: "#fff", 
            cursor: "pointer", 
            marginTop: "auto", 
            borderColor: hasFilters ? "#fca5a5" : "#d9d4cc", 
            transition: "all 0.15s" 
          }}>
          Réinitialiser
        </button>

        <div style={{ marginLeft: "auto", marginTop: "auto" }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>{filteredTickets.length}</span> ticket{filteredTickets.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table card outer */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #d9d4cc" }}>

        {filteredTickets.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            Aucun ticket trouvé pour les filtres sélectionnés.
          </div>
        ) : (

          /* Table card inner */
          <div style={{ margin: 16, border: "1px solid #e8e2d9", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9f6f2" }}>
                  {["ID", "Titre", "Service", "Assigné à", "Priorité", "Statut", "Date création", "Dernière MAJ"].map(col => (
                    <th key={col} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "1px solid #e8e2d9", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, idx) => {
                  const sc = STATUS_CONFIG[t.status];
                  const pc = PRIORITY_CONFIG[t.priority];
                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/employee/ticket/${t.id}`)}
                      onMouseEnter={() => setHoveredTicketId(t.id)}
                      onMouseLeave={() => setHoveredTicketId(null)}
                      style={{
                        background: "#fff",
                        borderBottom: idx < filteredTickets.length - 1 ? "1px solid #f1ede8" : "none",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseOver={e => e.currentTarget.style.background = "#faf7f4"}
                      onMouseOut={e => e.currentTarget.style.background = "#fff"}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
                        #{t.id}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#0f172a", maxWidth: 220 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {t.title}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>
                        {t.service || <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748b" }}>
                        {t.technicien || <span style={{ color: "#d1d5db" }}>Non assigné</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {pc ? (
                          <span style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                            {pc.label}
                          </span>
                        ) : (
                          <span style={{ color: "#d1d5db" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {sc ? (
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                            {sc.label}
                          </span>
                        ) : (
                          <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                            {t.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {t.dateCreation || "—"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {t.maj || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}