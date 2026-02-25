"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, X, AlertTriangle, Search, Lightbulb,
  Fuel, BatteryCharging, ChevronDown, ChevronUp,
  MessageCircleQuestion,
} from 'lucide-react';

const FUEL_OPTIONS = [
  { value: 'CNG', label: 'CNG' },
  { value: 'ELECTRIC', label: 'Electric' },
];

const s = {
  bubble: {
    position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 20px', background: '#0f172a', color: '#ffffff',
    border: 'none', borderRadius: '999px', fontSize: '0.875rem',
    fontWeight: 600, letterSpacing: '0.02em', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(15,23,42,0.35)', fontFamily: 'inherit',
  },
  bubbleIcon: {
    width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  panel: {
    position: 'fixed', bottom: '90px', right: '32px', zIndex: 999,
    width: '360px', maxHeight: 'calc(100vh - 140px)',
    display: 'flex', flexDirection: 'column',
    background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '16px',
    boxShadow: '0 16px 48px rgba(15,23,42,0.18), 0 4px 12px rgba(15,23,42,0.1)',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', background: '#0f172a', color: '#ffffff', flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerIcon: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', flexShrink: 0,
  },
  agentName: { fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'block' },
  agentSubtitle: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400, display: 'block' },
  closeBtn: {
    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
    padding: '4px 6px', borderRadius: '6px', fontSize: '1rem', lineHeight: 1, fontFamily: 'inherit',
  },
  filterRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 20px', borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc', flexShrink: 0,
  },
  filterLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' },
  fuelSelect: {
    flex: 1, padding: '7px 12px', border: '1.5px solid #cbd5e1',
    borderRadius: '8px', background: '#ffffff', color: '#0f172a',
    fontSize: '0.85rem', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  },
  panelBody: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  centeredBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 20px', gap: '12px', textAlign: 'center',
  },
  spinner: {
    width: '28px', height: '28px', border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6', borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },
  stateText: { fontSize: '0.82rem', fontWeight: 500, color: '#94a3b8' },
  emptyIcon: { fontSize: '1.8rem', opacity: 0.5 },
  sectionLabel: {
    fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: '#94a3b8', padding: '4px 4px 8px',
  },
  questionList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  qBtn: {
    width: '100%', textAlign: 'left', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px',
    cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500, color: '#334155',
    fontFamily: 'inherit', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '8px',
  },
  qBtnActive: { background: '#eff6ff', border: '1.5px solid #3b82f6', color: '#1d4ed8' },
  qIndex: {
    flexShrink: 0, width: '20px', height: '20px', background: '#e2e8f0',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginTop: '1px',
  },
  qIndexActive: { background: '#3b82f6', color: '#ffffff' },
  answerCard: {
    marginTop: '6px', border: '1.5px solid #bfdbfe',
    borderRadius: '10px', background: '#eff6ff', overflow: 'hidden',
  },
  answerHeader: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', background: '#dbeafe', borderBottom: '1px solid #bfdbfe',
  },
  answerHeaderLabel: {
    fontSize: '0.75rem', fontWeight: 700, color: '#1e40af',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  answerText: {
    fontSize: '0.83rem', color: '#1e40af',
    padding: '10px 14px 12px', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap',
  },
  badgeCng: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '999px',
    margin: '0 14px 10px', background: '#dcfce7', color: '#15803d',
  },
  badgeElectric: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '999px',
    margin: '0 14px 10px', background: '#fef3c7', color: '#b45309',
  },
  qChevron: { flexShrink: 0, marginTop: '1px', color: '#94a3b8' },
  qChevronActive: { flexShrink: 0, marginTop: '1px', color: '#3b82f6' },
};

export default function EnergyInsightsAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [fuelType, setFuelType] = useState('CNG');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const fetchQuestions = useCallback(async (fuel) => {
    setLoading(true);
    setError(null);
    setActiveQuestion(null);
    try {
      const res = await fetch(`/api/llm-questions?fuelType=${fuel}`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const json = await res.json();
      setQuestions(json.data || []);
    } catch {
      setError('Could not load questions. Please try again.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchQuestions(fuelType);
  }, [isOpen, fuelType, fetchQuestions]);

  return (
    <>
      {/* ---- Floating bubble ---- */}
      <button style={s.bubble} onClick={() => setIsOpen((p) => !p)} aria-label="Open Energy Insights Agent">
        <span style={s.bubbleIcon}><Zap size={11} strokeWidth={2.5} /></span>
        Summarize
      </button>

      {/* ---- Panel ---- */}
      {isOpen && (
        <div style={s.panel} role="dialog" aria-label="Energy Insights Agent">

          {/* Header */}
          <div style={s.panelHeader}>
            <div style={s.headerLeft}>
              <div style={s.headerIcon}>
                <MessageCircleQuestion size={17} strokeWidth={2} color="#fff" />
              </div>
              <div>
                <span style={s.agentName}>Energy Insights</span>
                {/* <span style={s.agentSubtitle}>Rule-based Q&amp;A · Powertrain Intelligence</span> */}
              </div>
            </div>
            <button style={s.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Filter */}
          <div style={s.filterRow}>
            <span style={s.filterLabel}>Fuel Type</span>
            <select style={s.fuelSelect} value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
              {FUEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div style={s.panelBody}>
            {loading && (
              <div style={s.centeredBox}>
                <div style={s.spinner} />
                <span style={s.stateText}>Fetching insights…</span>
              </div>
            )}

            {error && !loading && (
              <div style={s.centeredBox}>
                <AlertTriangle size={28} color="#f59e0b" strokeWidth={1.5} />
                <span style={s.stateText}>{error}</span>
              </div>
            )}

            {!loading && !error && questions.length === 0 && (
              <div style={s.centeredBox}>
                <Search size={28} color="#94a3b8" strokeWidth={1.5} />
                <span style={s.stateText}>No questions found.</span>
              </div>
            )}

            {!loading && !error && questions.length > 0 && (
              <>
                <div style={s.sectionLabel}>
                  {questions.length} question{questions.length !== 1 ? 's' : ''} available
                </div>

                <div style={s.questionList}>
                  {questions.map((q, idx) => {
                    const isActive = activeQuestion?.rowNumber === q.rowNumber;
                    const isCng = q.fuelType?.toUpperCase() === 'CNG';
                    return (
                      <div key={q.rowNumber ?? idx}>
                        <button
                          style={isActive ? { ...s.qBtn, ...s.qBtnActive } : s.qBtn}
                          onClick={() => setActiveQuestion((prev) =>
                            prev?.rowNumber === q.rowNumber ? null : q
                          )}
                        >
                          <span style={isActive ? { ...s.qIndex, ...s.qIndexActive } : s.qIndex}>
                            {idx + 1}
                          </span>
                          <span style={{ flex: 1 }}>{q.question}</span>
                          <span style={isActive ? s.qChevronActive : s.qChevron}>
                            {isActive
                              ? <ChevronUp size={14} strokeWidth={2.5} />
                              : <ChevronDown size={14} strokeWidth={2.5} />}
                          </span>
                        </button>

                        {isActive && (
                          <div style={s.answerCard}>
                            <div style={s.answerHeader}>
                              <Lightbulb size={14} color="#1e40af" strokeWidth={2} />
                              <span style={s.answerHeaderLabel}>Insight</span>
                            </div>
                            <p style={s.answerText}>{q.answer}</p>
                            <span style={isCng ? s.badgeCng : s.badgeElectric}>
                              {isCng
                                ? <Fuel size={10} strokeWidth={2} />
                                : <BatteryCharging size={10} strokeWidth={2} />}
                              {' '}{q.fuelType}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
