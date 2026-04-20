import { useState, useRef } from "react";
import { Lock, Paperclip, X } from "lucide-react";

export default function ManualCloseModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = "";
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: '24px', maxWidth: 420, width: '100%',
        margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 16,
        fontFamily: 'Inter, sans-serif'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={18} color="#374151" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px 0' }}>Fermer le ticket manuellement</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Utilisez cette option si vous avez résolu le problème par téléphone ou en personne.
            </p>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: '#f3f4f6' }} />

        {/* Note */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>
            Note de fermeture <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex : Résolu par téléphone à 11h30 — problème confirmé résolu par l'employé."
            style={{
              width: '100%', fontSize: 12, padding: '10px 12px',
              border: '1px solid #e5e7eb', borderRadius: 10,
              background: '#f9fafb', color: '#111827',
              resize: 'none', outline: 'none', lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Pièces jointes */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>
            Pièces jointes <span style={{ fontWeight: 400 }}>(optionnel)</span>
          </label>

          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <Paperclip size={11} color="#9ca3af" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>({(f.size / 1024).toFixed(0)} Ko)</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '8px 12px', borderRadius: 8,
              border: '1px dashed #d1d5db', background: 'transparent',
              fontSize: 11, fontWeight: 600, color: '#6b7280', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', justifyContent: 'center',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#9ca3af'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            <Paperclip size={12} /> Joindre un fichier
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 16px', fontSize: 12, fontWeight: 600,
              border: '1px solid #e5e7eb', borderRadius: 10,
              background: '#fff', color: '#374151', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(note, files)}
            disabled={loading || !note.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', fontSize: 12, fontWeight: 700,
              border: 'none', borderRadius: 10,
              background: !note.trim() || loading ? '#e5e7eb' : '#111827',
              color: !note.trim() || loading ? '#9ca3af' : '#fff',
              cursor: !note.trim() || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'background 0.15s'
            }}
          >
            <Lock size={13} /> {loading ? 'Fermeture...' : 'Fermer le ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
