import {
  Activity, CheckCircle, XCircle, AlertCircle, Clock,
  UserCheck, TrendingUp, CornerUpRight, Calendar, AlignLeft, Star
} from "lucide-react";
import { ACT_META } from "./constants";

const ICON_MAP = {
  "user-check":      UserCheck,
  "clock":           Clock,
  "alert-circle":    AlertCircle,
  "check-circle":    CheckCircle,
  "x-circle":        XCircle,
  "trending-up":     TrendingUp,
  "corner-up-right": CornerUpRight,
  "calendar":        Calendar,
  "align-left":      AlignLeft,
  "star":            Star,
};

const DOT_COLOR = {
  "bg-blue-400":   "#60a5fa",
  "bg-green-400":  "#4ade80",
  "bg-red-400":    "#f87171",
  "bg-amber-400":  "#fbbf24",
  "bg-purple-400": "#c084fc",
  "bg-gray-300":   "#d1d5db",
  "bg-pink-400":   "#f472b6",
};

export default function Actuality({ actuality }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={13} color="#9ca3af" />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Actualité
        </p>
      </div>

      {/* Scroll horizontal des cards */}
      <div style={{ height: 180, padding: '12px 16px', overflowY: 'hidden' }}>
        {actuality.length === 0 ? (
          <p style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center', marginTop: 40 }}>Aucune activité</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', height: '100%', paddingBottom: 4 }}>
            {actuality.map(item => {
              const meta = ACT_META[item.type] ?? ACT_META.comment;
              const Icon = ICON_MAP[meta.icon] ?? AlignLeft;
              const dotColor = DOT_COLOR[meta.dot] ?? "#d1d5db";
              return (
                <div key={item.id} style={{
                  flexShrink: 0, width: 180, padding: '12px 14px',
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 12, display: 'flex', flexDirection: 'column',
                  minHeight: 120, transition: 'box-shadow 0.15s',
                  cursor: 'default'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Type label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <Icon size={11} color="#9ca3af" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meta.label}
                    </p>
                  </div>
                  {/* Heure */}
                  <p style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', margin: '0 0 5px 0' }}>{item.date}</p>
                  {/* Message */}
                  <p
                    style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}
                    dangerouslySetInnerHTML={{ __html: item.message }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
