import { useRef } from "react";
import {
  MessageSquare, CheckCircle2, Forward, Lock, Send, ShieldCheck,
  Info, AlertTriangle, User, Layers, Tag
} from "lucide-react";
import { CATEGORIES_EN } from "./constants";
import ConvBubble from "./utils/ConvBubble";
import RichTextArea from "./utils/RichTextArea";
import FileAttachment from "./utils/FileAttachment";
import ManualCloseModal from "./utils/ManualCloseModal";

const CATEGORY_FR = {
  hardware: "Matériel", software: "Logiciels", network: "Réseau",
  access: "Accès", security: "Sécurité", account: "Compte",
};

const TAB_STYLE = (active, color = '#3b82f6') => ({
  flex: 1, padding: '11px 0',
  fontSize: 12, fontWeight: 700,
  border: 'none', borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
  background: 'transparent', cursor: 'pointer',
  color: active ? color : '#9ca3af',
  fontFamily: 'Inter, sans-serif',
  transition: 'color 0.15s, border-color 0.15s'
});

const tabColor = { respond: '#3b82f6', redirect: '#7c3aed', close: '#374151' };

export default function ConversationActions({
  conversation, empInitials, empName, currentUser, convEndRef,
  activeTab, respondMode, solution, infoMsg, solutionFiles, infoFiles,
  sending, sentError, clearSignal,
  redirectTechId, redirectServiceId, redirectCategory, redirectNote, redirecting,
  showManualClose, closingManually,
  setActiveTab, setRespondMode, setSolution, setInfoMsg, setSolutionFiles, setInfoFiles,
  handleSend, handleRedirect, handleManualClose, setShowManualClose,
  setRedirectTechId, setRedirectServiceId, setRedirectCategory, setRedirectNote,
  isClosed, ticket, services, techniciens, solutionBlocked, awaitingConfirm,
}) {
  const solutionBlockedLocal = solutionBlocked || false;

  const inputStyle = {
    width: '100%', fontSize: 12, padding: '8px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    background: '#f9fafb', color: '#111827',
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, fontFamily: 'Inter, sans-serif' }}>

      {/* ── CONVERSATION ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 520, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={13} color="#9ca3af" />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Conversation</p>
          </div>
          <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
            {conversation.length} msg
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {conversation.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <MessageSquare size={28} color="#e5e7eb" />
              <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, margin: '10px 0 4px' }}>Aucun message</p>
              <p style={{ fontSize: 12, color: '#d1d5db', margin: 0 }}>Les échanges apparaîtront ici.</p>
            </div>
          ) : (
            conversation.map(item => (
              <ConvBubble key={item.id} item={item} currentUser={currentUser} empInitials={empInitials} empName={empName} />
            ))
          )}
          <div ref={convEndRef} />
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 520, display: 'flex', flexDirection: 'column' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          {[
            { id: 'respond',  label: 'Répondre'  },
            { id: 'redirect', label: 'Rediriger' },
            { id: 'close',    label: 'Fermer'    },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={TAB_STYLE(activeTab === tab.id, tabColor[tab.id])}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── RÉPONDRE ── */}
          {activeTab === 'respond' && (
            isClosed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                  <Lock size={15} />
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Ticket fermé — aucune action disponible</p>
                </div>
                {ticket.solution && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={11} /> Solution finale
                    </p>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: ticket.solution }} />
                  </div>
                )}
                {ticket.closing_note && (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Note de fermeture</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Toggle Solution / Commentaire */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  {[
                    { id: 'solution', label: 'Solution',    Icon: CheckCircle2, color: '#3b82f6' },
                    { id: 'info',     label: 'Commentaire', Icon: MessageSquare, color: '#d97706' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setRespondMode(m.id)} style={{
                      flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
                      border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: respondMode === m.id ? '#fff' : 'transparent',
                      color: respondMode === m.id ? m.color : '#9ca3af',
                      borderRadius: respondMode === m.id ? 8 : 0,
                      boxShadow: respondMode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s'
                    }}>
                      <m.Icon size={12} /> {m.label}
                    </button>
                  ))}
                </div>

                {/* Notices */}
                {respondMode === 'solution' && solutionBlockedLocal && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    Solution envoyée — en attente de la confirmation de l'employé.
                  </div>
                )}
                {ticket?.is_resolved_confirmed && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} /> Résolution confirmée par l'employé.
                  </div>
                )}

                {/* Label + éditeur */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                    {respondMode === 'solution' ? 'Solution' : 'Commentaire'}
                  </label>
                  <RichTextArea
                    onChange={respondMode === 'solution' ? setSolution : setInfoMsg}
                    placeholder={respondMode === 'solution' ? 'Décrivez la solution...' : 'Ajoutez un commentaire...'}
                    rows={5}
                    disabled={respondMode === 'solution' && solutionBlockedLocal}
                    clearSignal={clearSignal}
                  />
                </div>

                <FileAttachment
                  disabled={respondMode === 'solution' && solutionBlockedLocal}
                  files={respondMode === 'solution' ? solutionFiles : infoFiles}
                  onAdd={f => respondMode === 'solution' ? setSolutionFiles(p => [...p, ...f]) : setInfoFiles(p => [...p, ...f])}
                  onRemove={i => respondMode === 'solution' ? setSolutionFiles(p => p.filter((_, x) => x !== i)) : setInfoFiles(p => p.filter((_, x) => x !== i))}
                />

                {sentError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} /> {sentError}
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={sending || (respondMode === 'solution' && solutionBlockedLocal) || (!solution.replace(/<[^>]*>/g, '').trim() && !infoMsg.replace(/<[^>]*>/g, '').trim() && solutionFiles.length === 0 && infoFiles.length === 0)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: respondMode === 'solution' ? '#3b82f6' : '#d97706',
                    color: '#fff', fontFamily: 'Inter, sans-serif',
                    opacity: (sending || (respondMode === 'solution' && solutionBlockedLocal)) ? 0.4 : 1,
                    transition: 'background 0.15s'
                  }}
                >
                  <Send size={13} />
                  {sending ? 'Envoi...' : respondMode === 'solution' ? 'Envoyer solution' : 'Envoyer commentaire'}
                </button>

                {respondMode === 'solution' && (
                  <p style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                    <ShieldCheck size={11} color="#16a34a" />
                    Une demande de confirmation sera envoyée à l'employé.
                  </p>
                )}
              </>
            )
          )}

          {/* ── REDIRIGER ── */}
          {activeTab === 'redirect' && (
            isClosed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 13 }}>
                <Lock size={13} /> Ticket fermé
              </div>
            ) : (
              <>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#7c3aed', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Forward size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  Sélectionnez le technicien ou service vers lequel rediriger.
                </div>

                {[
                  { label: 'Technicien', Icon: User, value: redirectTechId, setter: setRedirectTechId, options: techniciens?.map(t => ({ value: t.id, label: `${t.name} ${t.surname}` })) },
                  { label: 'Service',    Icon: Layers, value: redirectServiceId, setter: setRedirectServiceId, options: services?.map(s => ({ value: s.id, label: s.name })) },
                  { label: 'Catégorie', Icon: Tag, value: redirectCategory, setter: setRedirectCategory, options: CATEGORIES_EN?.map(c => ({ value: c, label: CATEGORY_FR[c] ?? c })) },
                ].map(({ label, Icon, value, setter, options }) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <Icon size={11} color="#9ca3af" /> {label}
                    </label>
                    <select value={value} onChange={e => setter(e.target.value)} style={{ ...inputStyle }}>
                      <option value="">Choisir...</option>
                      {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <MessageSquare size={11} color="#9ca3af" /> Raison <span style={{ fontWeight: 400, color: '#9ca3af' }}>(obligatoire)</span>
                  </label>
                  <textarea rows={3} value={redirectNote} onChange={e => setRedirectNote(e.target.value)}
                    placeholder="Pourquoi rediriger ?"
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
                </div>

                <button onClick={handleRedirect}
                  disabled={(!redirectTechId && !redirectServiceId) || !redirectNote?.trim() || redirecting}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: '#7c3aed', color: '#fff', fontFamily: 'Inter, sans-serif',
                    opacity: ((!redirectTechId && !redirectServiceId) || !redirectNote?.trim() || redirecting) ? 0.4 : 1
                  }}>
                  <Forward size={13} /> {redirecting ? '...' : 'Rediriger'}
                </button>
              </>
            )
          )}

          {/* ── FERMER ── */}
          {activeTab === 'close' && (
            isClosed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                  <Lock size={15} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Fermé</span>
                </div>
                {ticket.closing_note && (
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Note</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {ticket?.is_resolved_confirmed && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} /> Confirmé par l'employé — prêt à fermer.
                  </div>
                )}
                {awaitingConfirm && !ticket?.is_resolved_confirmed && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={13} /> En attente de confirmation de l'employé.
                  </div>
                )}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>Fermeture manuelle</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    Résolu hors système (téléphone, sur site...) ? Documentez la solution avant de fermer.
                  </p>
                  <button onClick={() => setShowManualClose(true)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '9px 16px', borderRadius: 10,
                    border: '1px solid #e5e7eb', background: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#374151',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    <Lock size={13} /> Fermer manuellement
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </div>

      {showManualClose && (
        <ManualCloseModal loading={closingManually} onConfirm={handleManualClose} onCancel={() => setShowManualClose(false)} />
      )}
    </div>
  );
}
