import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  MdAccessTime, 
  MdCheckCircleOutline, 
  MdBarChart, 
  MdAssignment, 
  MdErrorOutline 
} from 'react-icons/md';

export default function StatistiqueGlobal() {
  const [servicesData, setServicesData] = useState([]);
  const [totalTicketsAll, setTotalTicketsAll] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3001/api/services/global-stats');
        setServicesData(response.data.services || []);
        setTotalTicketsAll(response.data.totalGlobal || 0);
        setError(null);
      } catch (err) {
        console.error("Erreur stats globales:", err);
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  const globalResRate = servicesData.length > 0 
    ? Math.round(servicesData.reduce((acc, s) => acc + (s.resolutionRate || 0), 0) / servicesData.length)
    : 0;

  const globalAvgTime = servicesData.length > 0 
    ? (servicesData.reduce((acc, s) => acc + parseFloat(s.avgTime || 0), 0) / servicesData.length).toFixed(1)
    : "0.0";

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ marginLeft: 12, color: '#6b7280', fontWeight: 600 }}>Chargement des données...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <MdErrorOutline style={{ fontSize: 48, color: '#dc2626' }} />
      <p style={{ marginTop: 8, fontWeight: 700, color: '#dc2626' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', padding: '40px 32px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MdBarChart style={{ color: '#3b82f6', fontSize: 26 }} />
          Dashboard Analytics
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 16, padding: '10px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Volume Total :</span>
          <span style={{ color: '#1d4ed8', fontSize: 20, fontWeight: 800 }}>{totalTicketsAll} Tickets</span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdCheckCircleOutline style={{ fontSize: 24, color: '#16a34a' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px 0' }}>Taux de Résolution</p>
            <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', margin: '0 0 8px 0' }}>Moyenne de performance inter-services</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', margin: '0 0 6px 0', lineHeight: 1 }}>{globalResRate}%</p>
            <div style={{ background: '#f3f4f6', height: 4, borderRadius: 99 }}>
              <div style={{ width: `${globalResRate}%`, background: '#16a34a', height: '100%', borderRadius: 99 }} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdAccessTime style={{ fontSize: 24, color: '#3b82f6' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px 0' }}>Délai Moyen (MTTR)</p>
            <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', margin: '0 0 8px 0' }}>Temps moyen jusqu'à résolution</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6', margin: '0 0 6px 0', lineHeight: 1 }}>{globalAvgTime}h</p>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Calculé sur les tickets clôturés</p>
          </div>
        </div>
      </div>

      {/* OUTER CARD */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Titre de la card */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MdAssignment style={{ fontSize: 18, color: '#9ca3af' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
            Répartition par Service
          </h2>
        </div>

        {/* INNER CARD — tableau avec bordure propre */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>

              {/* EN-TÊTE BEIGE */}
              <thead>
                <tr style={{ background: '#f9f6f2', borderBottom: '1px solid #e8e4de' }}>
                  {[
                    { label: 'Nom du Service', align: 'left' },
                    { label: 'Tickets Liés',   align: 'center' },
                    { label: 'Efficacité',      align: 'center' },
                    { label: 'Temps de Traitement', align: 'center' },
                  ].map((col, i) => (
                    <th key={i} style={{
                      padding: '11px 24px', fontSize: 11, fontWeight: 700,
                      color: '#6b7280', textTransform: 'uppercase',
                      letterSpacing: '0.08em', textAlign: col.align, whiteSpace: 'nowrap'
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {servicesData.map((service, idx) => (
                  <tr
                    key={service.id}
                    style={{
                      borderBottom: idx < servicesData.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 0.15s',
                      background: '#fff'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      {service.name}
                    </td>

                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#f3f4f6', color: '#374151',
                        fontSize: 13, fontWeight: 700
                      }}>
                        {service.totalTickets}
                      </span>
                    </td>

                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                          {service.resolutionRate}%
                        </span>
                        <div style={{ width: 80, background: '#f3f4f6', height: 4, borderRadius: 99 }}>
                          <div style={{ width: `${service.resolutionRate}%`, background: '#16a34a', height: '100%', borderRadius: 99 }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                      {service.avgTime}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}