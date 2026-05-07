import { useState, useRef, useEffect } from "react";
import {
  MessageSquare, CheckCircle2, Forward, Lock, Send, ShieldCheck,
  Info, AlertTriangle, User, Layers, Tag, Paperclip, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CATEGORIES_EN } from "./constants";
import ConvBubble from "./utils/ConvBubble";
import RichTextArea from "./utils/RichTextArea";
import FileAttachment from "./utils/FileAttachment";
import ManualCloseModal from "./utils/ManualCloseModal";

function ConfirmedCloseForm({ ticket, onClose, closing, conversation }) {
  const { t } = useTranslation("technicien");
  const [solution, setSolution] = useState(ticket.solution ?? "");
  const [note, setNote] = useState("");

  // Trouver les fichiers attachés au message de type "solution"
  const lastSolution = [...conversation].reverse().find(c => c.type === "solution");
  const solutionFiles = lastSolution?.files ?? [];

  const handleDeleteFile = async (fileId) => {
    try {
      await fetch(`http://localhost:3001/api/tech/attachments/${fileId}`, {
        method: "DELETE",
      });
      // refresh UI
      window.location.reload(); // simple (ou mieux : refetch)
    } catch (err) {
      console.error(err);
      alert(t("conv.errorDeleteFile"));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-700 flex items-center gap-2">
        <CheckCircle2 size={13}/> {t("conv.employeeConfirmedResolution")}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
          {t("conv.recordedSolution")} <span className="text-gray-400 font-normal">({t("conv.editable")})</span>
        </label>
        <textarea
          rows={4}
          value={solution}
          onChange={e => setSolution(e.target.value)}
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:border-green-400 leading-relaxed"
          placeholder={t("conv.describeSolution")}
        />
      </div>

      {/* Pièces jointes de la solution */}
      {solutionFiles.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
            {t("conv.solutionAttachments")}
          </p>
          <div className="flex flex-col gap-1">
            {solutionFiles.map((f, i) => (
              <div
                key={f.id || i}
                className="flex items-center justify-between gap-2 text-[11px] bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5"
              >
                <a
                  href={`http://localhost:3001/${f.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600"
                >
                  <Paperclip size={11}/>
                  {f.fileName}
                </a>
                {/* bouton supprimer */}
                <button
                  onClick={() => handleDeleteFile(f.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
          {t("conv.closingNote")} <span className="text-gray-400 font-normal">({t("conv.optional")})</span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t("conv.closingNotePlaceholder")}
          className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:border-gray-400 leading-relaxed"
        />
      </div>

      <button
        onClick={() => onClose(note, [], solution)}
        disabled={closing || !solution.trim()}
        className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition"
      >
        <Lock size={13}/>
        {closing ? t("conv.closing") : t("conv.closeAndSaveSolution")}
      </button>
    </div>
  );
}

export default function ConversationActions({
  conversation, empInitials, empName, currentUser, convEndRef,
  activeTab, respondMode, solution, infoMsg, solutionFiles, infoFiles,
  sending, sentError, clearSignal,
  redirectTechId, redirectServiceId, redirectCategory, redirectNote, redirecting,
  showManualClose, closingManually,
  setActiveTab, setRespondMode, setSolution, setInfoMsg, setSolutionFiles, setInfoFiles,
  handleSend, handleRedirect, handleManualClose, setShowManualClose,
  setRedirectTechId, setRedirectServiceId, setRedirectCategory, setRedirectNote,
  isClosed, ticket, services, techniciens, solutionBlocked, awaitingConfirm, fetchTicket,
}) {
  const { t } = useTranslation("technicien");
  const solutionBlockedLocal = solutionBlocked || false;
  const [filteredTechs, setFilteredTechs] = useState([]);

  useEffect(() => {
    if (!redirectServiceId) {
      setFilteredTechs(techniciens ?? []);
      return;
    }
    fetch(`http://localhost:3001/api/tech/techniciens/service/${redirectServiceId}`)
      .then(r => r.json())
      .then(setFilteredTechs)
      .catch(() => setFilteredTechs([]));
  }, [redirectServiceId, techniciens]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

      {/* ── Conversation ── */}
      <div className="bg-white rounded-xl border border-gray-200 h-[500px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={12}/> {t("conv.conversation")}
          </h2>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
            {conversation.length} {t("conv.msg")}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={28} className="text-gray-200 mb-3"/>
              <p className="text-[12px] text-gray-400 font-medium">{t("conv.noMessages")}</p>
              <p className="text-[11px] text-gray-300 mt-1">{t("conv.messagesWillAppear")}</p>
            </div>
          ) : (
            conversation.map(item => (
              <ConvBubble
                key={item.id}
                item={item}
                currentUser={currentUser}
                empInitials={empInitials}
                empName={empName}
              />
            ))
          )}
          <div ref={convEndRef}/>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="bg-white rounded-xl border border-gray-200 h-[500px] flex flex-col">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {[
            { id: "respond",  label: t("conv.tabs.respond")  },
            { id: "redirect", label: t("conv.tabs.redirect") },
            { id: "close",    label: t("conv.tabs.close")    },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[11px] font-semibold border-b-2 transition-all bg-transparent cursor-pointer
                ${activeTab === tab.id
                  ? "text-blue-700 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

          {/* ── RESPOND tab ── */}
          {activeTab === "respond" && (
            isClosed ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Lock size={15}/>
                  <p className="text-sm font-semibold">{t("conv.ticketClosedNoAction")}</p>
                </div>
                {ticket.solution && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <CheckCircle2 size={11}/> {t("conv.finalSolution")}
                    </p>
                    <div className="text-[12px] text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: ticket.solution }}/>

                    {/* Pièces jointes liées à la solution/fermeture */}
                    {(() => {
                      // Dernier message solution ou comment de fermeture uniquement
                      const lastMsg = [...conversation]
                        .reverse()
                        .find(c => ["solution", "comment"].includes(c.type));
                      const files = lastMsg?.files ?? [];
                      return files.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-green-200 flex flex-col gap-1">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Paperclip size={10}/> {t("conv.attachments")}
                          </p>
                          {files.map((f, i) => (
                            <a key={f.id ?? i}
                              href={`http://localhost:3001/${f.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[11px] text-blue-600 hover:underline px-2 py-1 rounded hover:bg-green-100 transition truncate"
                            >
                              <Paperclip size={10} className="shrink-0"/> {f.fileName}
                            </a>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                {ticket.closing_note && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{t("conv.closingNote")}</p>
                    <p className="text-[12px] text-gray-700">{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mode toggle: Solution / Commentaire */}
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                  <button onClick={() => setRespondMode("solution")}
                    className={`flex-1 py-2 text-[11px] font-semibold transition flex items-center justify-center gap-1
                      ${respondMode === "solution" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <CheckCircle2 size={12}/> {t("conv.solution")}
                  </button>
                  <button onClick={() => setRespondMode("info")}
                    className={`flex-1 py-2 text-[11px] font-semibold transition flex items-center justify-center gap-1
                      ${respondMode === "info" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    <MessageSquare size={12}/> {t("conv.comment")}
                  </button>
                </div>

                {/* ── Solution précédente après réouverture ── */}
{!isClosed && ticket.solution && conversation.some(c => c.type === "rejected_confirm") && (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1">
      <Info size={11}/> {t("conv.previousSolutionReopened")}
    </p>
    <div className="text-[12px] text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: ticket.solution }}/>
    <div className="flex gap-2 pt-1">
      <button
        onClick={async () => {
          await fetch(`http://localhost:3001/api/tech/tickets/${ticket.id}/clear-solution`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          });
          await fetchTicket(true);
        }}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
      >
        {t("conv.delete")}
      </button>
      <span className="text-[11px] text-amber-600 flex items-center">
        {t("conv.orSendNewSolution")}
      </span>
    </div>
  </div>
)}

                {/* Notices */}
                {respondMode === "solution" && solutionBlockedLocal && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700 flex items-start gap-2">
                    <Info size={13} className="shrink-0 mt-0.5"/>
                    {t("conv.solutionSentAwaitingConfirm")}
                  </div>
                )}
                {ticket?.is_resolved_confirmed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-[11px] text-green-700 flex items-center gap-2">
                    <CheckCircle2 size={13}/> {t("conv.resolutionConfirmedByEmployee")}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">
                    {respondMode === "solution" ? t("conv.solution") : t("conv.comment")}
                  </label>
                  <RichTextArea
                    onChange={respondMode === "solution" ? setSolution : setInfoMsg}
                    placeholder={respondMode === "solution" ? t("conv.describeSolution") : t("conv.addComment")}
                    rows={5}
                    disabled={respondMode === "solution" && solutionBlockedLocal}
                    clearSignal={clearSignal}
                  />
                </div>

                <FileAttachment
                  disabled={respondMode === "solution" && solutionBlockedLocal}
                  files={respondMode === "solution" ? solutionFiles : infoFiles}
                  onAdd={f => respondMode === "solution"
                    ? setSolutionFiles(p => [...p, ...f])
                    : setInfoFiles(p => [...p, ...f])}
                  onRemove={i => respondMode === "solution"
                    ? setSolutionFiles(p => p.filter((_, x) => x !== i))
                    : setInfoFiles(p => p.filter((_, x) => x !== i))}
                />

                {sentError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-700">
                    <AlertTriangle size={13}/> {sentError}
                  </div>
                )}

                <button onClick={handleSend}
                  disabled={sending || (respondMode === "solution" && solutionBlockedLocal) || (
                    !solution.replace(/<[^>]*>/g, "").trim() &&
                    !infoMsg.replace(/<[^>]*>/g, "").trim() &&
                    solutionFiles.length === 0 && infoFiles.length === 0
                  )}
                  className={`flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed transition
                    ${respondMode === "solution" ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-500 hover:bg-amber-600"}`}>
                  <Send size={13}/>
                  {sending ? t("conv.sending") : respondMode === "solution" ? t("conv.sendSolution") : t("conv.sendComment")}
                </button>

                {respondMode === "solution" && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-green-500"/>
                    {t("conv.confirmationWillBeSent")}
                  </p>
                )}
              </>
            )
          )}

          {/* ── REDIRECT tab ── */}
          {activeTab === "redirect" && (
            isClosed ? (
              <></>
            ) : (
              <>
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[11px] text-purple-700">
                  <Forward size={13} className="shrink-0 mt-0.5"/>
                  {t("conv.redirectHint")}
                </div>

                {/* 1. Service — OBLIGATOIRE */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Layers size={11} className="text-gray-400"/> {t("conv.service")}
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={redirectServiceId}
                    onChange={e => { setRedirectServiceId(e.target.value); setRedirectTechId(""); }}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400"
                  >
                    <option value="">{t("conv.chooseService")}</option>
                    {services?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Technicien — OPTIONNEL, filtré par service */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <User size={11} className="text-gray-400"/> {t("conv.technician")}
                    <span className="text-gray-400 font-normal">({t("conv.optional")})</span>
                  </label>
                  <select
                    value={redirectTechId}
                    onChange={e => setRedirectTechId(e.target.value)}
                    disabled={!redirectServiceId}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  >
                    <option value="">{t("conv.noTechnicianServiceOnly")}</option>
                    {filteredTechs.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name} {tech.surname}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Catégorie — OBLIGATOIRE */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Tag size={11} className="text-gray-400"/> {t("conv.category")}
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={redirectCategory}
                    onChange={e => setRedirectCategory(e.target.value)}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400"
                  >
                    <option value="">{t("conv.chooseCategory")}</option>
                    {CATEGORIES_EN?.map(c => (
                      <option key={c} value={c}>{t(`categories.${c}`)}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Raison — OBLIGATOIRE */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-gray-400"/> {t("conv.reason")}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={redirectNote}
                    onChange={e => setRedirectNote(e.target.value)}
                    placeholder={t("conv.whyRedirect")}
                    className="w-full text-[12px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  onClick={handleRedirect}
                  disabled={
                    !redirectServiceId ||
                    !redirectCategory  ||
                    !redirectNote?.trim() ||
                    redirecting
                  }
                  className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition"
                >
                  <Forward size={13}/>{redirecting ? "..." : t("conv.redirect")}
                </button>
              </>
            )
          )}

          {/* ── CLOSE tab ── */}
          {activeTab === "close" && (
            isClosed ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
                  <Lock size={15}/> {t("conv.closed")}
                </div>
                {ticket.closing_note && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t("conv.note")}</p>
                    <p className="text-[12px] text-gray-700">{ticket.closing_note}</p>
                  </div>
                )}
              </div>
            ) : ticket?.is_resolved_confirmed ? (
              // ✅ Employé a confirmé → formulaire de fermeture rapide
              <ConfirmedCloseForm
                ticket={ticket}
                onClose={handleManualClose}
                closing={closingManually}
                conversation={conversation}
              />
            ) : (
              <>
                {awaitingConfirm && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700 flex items-center gap-2">
                    <Info size={13}/> {t("conv.awaitingEmployeeConfirmation")}
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-gray-800 mb-1">{t("conv.manualClose")}</p>
                    <p className="text-[11px] text-gray-500">
                      {t("conv.manualCloseDescription")}
                    </p>
                  </div>
                  <button onClick={() => setShowManualClose(true)}
                    className="flex items-center justify-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 bg-white w-full">
                    <Lock size={13}/> {t("conv.closeManually")}
                  </button>
                </div>
              </>
            )
          )}

        </div>
      </div>

      {/* Modal fermeture manuelle */}
      {showManualClose && (
        <ManualCloseModal
          loading={closingManually}
          onConfirm={handleManualClose}
          onCancel={() => setShowManualClose(false)}
        />
      )}
    </div>
  );
}