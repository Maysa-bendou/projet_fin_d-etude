import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPaperclip } from "react-icons/fa";
import { MdAdd, MdClose } from "react-icons/md";

// Kept for backend — never rendered
const PRIORITY_MATRIX = {
  high:   { high: "critical", medium: "high",   low: "medium" },
  medium: { high: "high",     medium: "medium",  low: "low" },
  low:    { high: "medium",   medium: "low",     low: "low" },
};

const EMPTY_FORM = { type: "incident", title: "", description: "", category: "", impact: "", urgency: "" };

const selectStyle = {
  width: "100%", border: "1.5px solid #d9d4cc", borderRadius: 10,
  padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b",
  background: "#fff", outline: "none", appearance: "none", cursor: "pointer",
};

const inputStyle = {
  width: "100%", border: "1.5px solid #d9d4cc", borderRadius: 10,
  padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b",
  background: "#fff", outline: "none", boxSizing: "border-box",
};

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const Label = ({ children, required, missing }) => (
  <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 7, color: missing ? "#dc2626" : "#64748b" }}>
    {children}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
    {missing && <span style={{ marginLeft: 6, fontWeight: 500, textTransform: "none", fontSize: 11 }}>— {missing}</span>}
  </label>
);

const SectionTitle = ({ children }) => (
  <div style={{ marginBottom: 22, paddingBottom: 14, borderBottom: "1.5px solid #e8e2d9" }}>
    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{children}</span>
  </div>
);

const FileSelector = ({ files, setFiles, t }) => (
  <div>
    <Label>{t('createTicket.attachments')}</Label>
    <div style={{ border: "1.5px dashed #e2e8f0", borderRadius: 10, padding: "14px 16px", background: "#fff", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", minHeight: 52 }}>
      {files.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#475569", background: "#fff", border: "1px solid #d9d4cc", borderRadius: 20, padding: "4px 10px 4px 8px" }}>
          <FaPaperclip style={{ color: "#94a3b8", fontSize: 10 }} />
          <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <MdClose size={13} style={{ color: "#94a3b8" }} />
          </button>
        </div>
      ))}
      <label style={{ display: "flex", alignItems: "center", gap: 5, border: "1.5px solid #3b82f6", borderRadius: 20, padding: "4px 14px", cursor: "pointer", color: "#3b82f6", fontSize: 12, fontWeight: 600, background: "#eff6ff" }}>
        <MdAdd size={14} /> {t('createTicket.addFile')}
        <input type="file" multiple style={{ display: "none" }}
          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
      </label>
    </div>
  </div>
);

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('employee');
  const user = JSON.parse(localStorage.getItem("user"));

  // Options built inside component so t() is available
  const TYPE_OPTIONS = [
    { value: "incident",        label: t('createTicket.types.incident') },
    { value: "service_request", label: t('createTicket.types.service_request') },
  ];
  const CATEGORY_OPTIONS = [
    { value: "hardware",   label: t('createTicket.categories.hardware') },
    { value: "software",   label: t('createTicket.categories.software') },
    { value: "network",    label: t('createTicket.categories.network') },
    { value: "access",     label: t('createTicket.categories.access') },
    { value: "security",   label: t('createTicket.categories.security') },
    { value: "messagerie", label: t('createTicket.categories.messagerie') },
  ];
  const IMPACT_OPTIONS = [
    { value: "low",    label: t('createTicket.impacts.low') },
    { value: "medium", label: t('createTicket.impacts.medium') },
    { value: "high",   label: t('createTicket.impacts.high') },
  ];
  const URGENCY_OPTIONS = [
    { value: "low",    label: t('createTicket.urgencies.low') },
    { value: "medium", label: t('createTicket.urgencies.medium') },
    { value: "high",   label: t('createTicket.urgencies.high') },
  ];

  // FIELDS used only for validation label lookup
  const FIELDS = [
    { key: "title",       label: t('createTicket.fields.title') },
    { key: "description", label: t('createTicket.fields.description') },
    { key: "category",    label: t('createTicket.fields.category') },
    { key: "impact",      label: t('createTicket.fields.impact') },
    { key: "urgency",     label: t('createTicket.fields.urgency') },
  ];

  const [form, setForm]               = useState(EMPTY_FORM);
  const [files, setFiles]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [missing, setMissing]         = useState([]);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess]         = useState(null);

  const fieldRefs = {
    title:       useRef(null),
    description: useRef(null),
    category:    useRef(null),
    impact:      useRef(null),
    urgency:     useRef(null),
  };
  const errorBannerRef = useRef(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setMissing(prev => prev.filter(k => k !== name));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError("");

    const missingKeys = FIELDS.filter(f => !form[f.key]?.trim()).map(f => f.key);
    if (missingKeys.length > 0) {
      setMissing(missingKeys);
      const firstMissingRef = fieldRefs[missingKeys[0]];
      if (firstMissingRef?.current) {
        firstMissingRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        firstMissingRef.current.focus?.();
      } else {
        errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setMissing([]);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("description", form.description);
      fd.append("category",    form.category);
      fd.append("impact",      form.impact);
      fd.append("urgency",     form.urgency);
      fd.append("type",        form.type);
      fd.append("created_by",  user.id);
      files.forEach(file => fd.append("files", file));

      const res  = await fetch("http://localhost:3001/api/tickets/create", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('common.serverError'));
      setSuccess(data.ticket);
    } catch (err) {
      setServerError(err.message);
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setForm(EMPTY_FORM);
    setFiles([]);
    setSuccess(null);
    setMissing([]);
    setServerError("");
  };

  const isMissing = (key) => missing.includes(key);
  const borderFor = (key) => isMissing(key) ? "1.5px solid #dc2626" : "1.5px solid #d9d4cc";

  /* ── SUCCESS ── */
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f5f0e8" }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #d9d4cc", padding: "40px 36px", maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22, color: "#16a34a", border: "2px solid #bbf7d0" }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{t('createTicket.success.title')}</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
            {t('createTicket.success.subtitle')} <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, color: "#475569" }}>#{success.id}</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => navigate("/employee/mes-tickets")}
              style={{ width: "100%", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {t('createTicket.success.viewTickets')}
            </button>
            <button onClick={handleCreateAnother}
              style={{ width: "100%", background: "#fff", color: "#1e3a8a", border: "1.5px solid #1e3a8a", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {t('createTicket.success.createAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── FORM ── */
  return (
    <div style={{ padding: 25, background: "#f9f6f2", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>{t('createTicket.pageTitle')}</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{t('createTicket.pageSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d9d4cc", padding: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>

            {/* ── LEFT ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionTitle>{t('createTicket.section.details')}</SectionTitle>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <Label required>{t('createTicket.fields.type')}</Label>
                  <div style={{ position: "relative" }}>
                    <select name="type" value={form.type} onChange={handleChange} style={selectStyle}>
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>

                <div ref={fieldRefs.category}>
                  <Label required missing={isMissing("category") ? t('createTicket.required') : undefined}>{t('createTicket.fields.category')}</Label>
                  <div style={{ position: "relative" }}>
                    <select name="category" value={form.category} onChange={handleChange}
                      style={{ ...selectStyle, border: borderFor("category") }}>
                      <option value="" disabled>{t('createTicket.select')}</option>
                      {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              </div>

              <div ref={fieldRefs.title}>
                <Label required missing={isMissing("title") ? t('createTicket.required') : undefined}>{t('createTicket.fields.title')}</Label>
                <input name="title" value={form.title} onChange={handleChange}
                  placeholder={t('createTicket.titlePlaceholder')}
                  style={{ ...inputStyle, border: borderFor("title") }} />
              </div>

              <div ref={fieldRefs.description} style={{ flex: 1 }}>
                <Label required missing={isMissing("description") ? t('createTicket.required') : undefined}>{t('createTicket.fields.description')}</Label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={8}
                  placeholder={t('createTicket.descriptionPlaceholder')}
                  style={{ ...inputStyle, resize: "none", height: 190, border: borderFor("description") }} />
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SectionTitle>{t('createTicket.section.impact')}</SectionTitle>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div ref={fieldRefs.impact}>
                  <Label required missing={isMissing("impact") ? t('createTicket.required') : undefined}>{t('createTicket.fields.impact')}</Label>
                  <div style={{ position: "relative" }}>
                    <select name="impact" value={form.impact} onChange={handleChange}
                      style={{ ...selectStyle, border: borderFor("impact") }}>
                      <option value="" disabled>{t('createTicket.select')}</option>
                      {IMPACT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>

                <div ref={fieldRefs.urgency}>
                  <Label required missing={isMissing("urgency") ? t('createTicket.required') : undefined}>{t('createTicket.fields.urgency')}</Label>
                  <div style={{ position: "relative" }}>
                    <select name="urgency" value={form.urgency} onChange={handleChange}
                      style={{ ...selectStyle, border: borderFor("urgency") }}>
                      <option value="" disabled>{t('createTicket.select')}</option>
                      {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown />
                  </div>
                </div>
              </div>

              {/* No priority preview here — computed silently on the backend */}

              <FileSelector files={files} setFiles={setFiles} t={t} />
            </div>

            {/* ── Footer ── */}
            <div style={{ gridColumn: "1 / -1", paddingTop: 24, borderTop: "1.5px solid #e8e2d9" }}>

              {(missing.length > 0 || serverError) && (
                <div ref={errorBannerRef} style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                  padding: "11px 16px", fontSize: 13, color: "#dc2626", fontWeight: 500,
                  marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠</span>
                  <div>
                    {serverError && <div>{serverError}</div>}
                    {missing.length > 0 && (
                      <div>
                        {t('createTicket.missingFields')}:&nbsp;
                        <strong>
                          {FIELDS.filter(f => missing.includes(f.key)).map(f => f.label).join(", ")}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" onClick={() => navigate(-1)}
                  style={{ padding: "10px 24px", border: "1.5px solid #d9d4cc", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", background: "#fff", cursor: "pointer" }}>
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: "10px 32px", background: loading ? "#94a3b8" : "#1e3a8a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {loading ? t('createTicket.submitting') : t('createTicket.submit')}
                  {!loading && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}