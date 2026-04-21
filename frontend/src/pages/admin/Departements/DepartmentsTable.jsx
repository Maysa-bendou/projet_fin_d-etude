import React from "react";

function DepartmentsTable({ departments = [], onRowClick }) {

  if (!departments.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
          Aucun département trouvé
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          Ajustez vos filtres ou ajoutez une entité.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', fontFamily: 'Inter, sans-serif' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>

        {/* EN-TÊTE BEIGE — comme dans la capture originale */}
        <thead>
          <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
            {['ID', 'Département', 'Description', 'Date de Création'].map((col, i) => (
              <th key={i} style={{
                padding: '12px 24px',
                fontSize: 11, fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>

        {/* LIGNES */}
        <tbody>
          {departments.map((d, idx) => (
            <tr
              key={d.id}
              onClick={() => onRowClick(d)}
              style={{
                borderBottom: idx < departments.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: '#fff'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {/* ID */}
              <td style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>
                #{d.id}
              </td>

              {/* Nom avec avatar */}
              <td style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: '#eff6ff', border: '1px solid #dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#3b82f6'
                  }}>
                    {d.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {d.name}
                  </span>
                </div>
              </td>

              {/* Description */}
              <td style={{ padding: '16px 24px', fontSize: 13, color: '#6b7280', fontWeight: 400, maxWidth: 300 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.description || '—'}
                </span>
              </td>

              {/* Date */}
              <td style={{ padding: '16px 24px', fontSize: 13, color: '#9ca3af', fontWeight: 400 }}>
                {new Date(d.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DepartmentsTable;
