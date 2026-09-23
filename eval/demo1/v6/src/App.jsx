import { useState, useEffect, useRef, useCallback } from 'react'

// ─── ZDS Tokens ───────────────────────────────────────────────────────────────
const brand = {
  10: '#E9F4F5', 20: '#CEE6E8', 30: '#9FCED3', 40: '#6BB3BA',
  50: '#2D949E', 60: '#03727D', 70: '#02545D', 80: '#013D43',
  90: '#01282C', 100: '#01181B',
}
const color = {
  bgDefault:           '#FFFFFF',
  bgSubtle:            brand[10],
  bgSurface:           '#FFFFFF',
  bgOverlay:           '#F2F5F5',
  bgDisabled:          '#F0F1F2',
  borderLighter:       '#DEE1E7',
  borderLight:         brand[20],
  borderDark:          brand[40],
  borderPrimary:       brand[60],
  typeHeaderDark:      '#13151A',
  typeLabelDark:       '#323743',
  typeBodyLight:       '#444C5D',
  typePlaceholder:     brand[40],
  typeHelper:          brand[50],
  typeDisabled:        brand[30],
  typeInverse:         '#FFFFFF',
  iconDefault:         brand[50],
  primary:             brand[60],
  primaryHover:        brand[70],
  primaryActive:       brand[80],
  primarySubtle:       brand[10],
  primarySubtleBorder: brand[20],
}
const type = {
  displaySmBold: { fontSize: 32, fontWeight: 700, lineHeight: '40px', letterSpacing: '-0.4px' },
  headingMdSemi: { fontSize: 24, fontWeight: 600, lineHeight: '32px' },
  headingSmSemi: { fontSize: 20, fontWeight: 600, lineHeight: '28px' },
  labelLgSemi:   { fontSize: 16, fontWeight: 600, lineHeight: '24px' },
  labelLgReg:    { fontSize: 16, fontWeight: 400, lineHeight: '24px' },
  labelMdReg:    { fontSize: 14, fontWeight: 400, lineHeight: '20px' },
  labelSmReg:    { fontSize: 12, fontWeight: 400, lineHeight: '16px' },
  caption:       { fontSize: 12, fontWeight: 400, lineHeight: '16px' },
}
const sp = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
const font = "'Lexend', system-ui, sans-serif"

// ─── Current user's agency (hardcoded for prototype — backend will handle auth) ─
const CURRENT_AGENCY = 'ESG'

// ─── Tag types (v3: Inaccurate / Irrelevant) ─────────────────────────────────
const TAG_TYPES = [
  { label: 'Inaccurate', promptWhy: 'Why is this inaccurate?', promptCorrect: 'Expected response' },
  { label: 'Irrelevant', promptExplanation: 'Why is it irrelevant? (optional)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso)
  const mon = d.toLocaleDateString('en-GB', { month: 'short' })
  return `${d.getDate()} ${mon} ${d.getFullYear()}`
}

// Mock answer generation — assembles updated answer from claim states + added claims
// TODO (eng): replace mockGenerate with real AI call to /api/generate-answer
function mockGenerate(pair, claimStates, addedClaims) {
  const lines = []
  pair.claims.forEach((c, i) => {
    const cs = claimStates[i]
    if (!cs) { lines.push(c.claim); return }
    if (cs.verdict === 'fail' && cs.tag === 'Irrelevant') return
    if (cs.verdict === 'fail' && cs.tag === 'Inaccurate' && cs.correction.trim()) {
      lines.push(cs.correction.trim())
    } else {
      lines.push(c.claim)
    }
  })
  addedClaims.filter(c => c.kind === 'added' && c.text.trim()).forEach(c => lines.push(c.text.trim()))
  return lines.join('\n\n') || pair.answer_text || ''
}

// ─── Shared components ────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 44 }, (_, i) => ({
    id: i,
    left: ((i * 13 + 7) % 97) + 1.5,
    delay: (i * 0.06) % 1.8,
    duration: 2.2 + (i % 7) * 0.3,
    color: ['#03727D','#6BB3BA','#CEE6E8','#FDE68A','#BBF7D0','#FCA5A5','#C7D2FE','#FDBA74','#A5F3FC'][i % 9],
    size: 5 + (i % 7),
    shape: i % 3,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 100 }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: 0,
          width: p.size, height: p.size * (p.shape === 1 ? 1.6 : 1),
          background: p.color,
          borderRadius: p.shape === 0 ? '50%' : p.shape === 2 ? 2 : 0,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  )
}

function SectionLabel({ children, style = {} }) {
  return (
    <p style={{ ...type.caption, color: color.typeHelper, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp.sm, ...style }}>
      {children}
    </p>
  )
}

const TAG = {
  teal: { bg: '#e6f2f3', c: '#03717c' },
  red:  { bg: '#FDE8E8', c: '#C81E1E' },
  grey: { bg: '#DEE1E7', c: '#323743' },
}

function Pill({ children, color: c = TAG.grey.c, bg = TAG.grey.bg }) {
  return (
    <span style={{
      color: c, background: bg,
      borderRadius: 16, padding: '0 12px',
      display: 'inline-flex', alignItems: 'center', height: 24,
    }}>
      <span style={{ color: 'inherit', fontSize: 12, fontWeight: 400, lineHeight: '16px' }}>
        {children}
      </span>
    </span>
  )
}

function PrimaryButton({ children, onClick, disabled = false, style = {} }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 48, borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? color.borderLighter : hovered ? color.primaryHover : color.primary,
        color: color.typeInverse,
        ...type.labelLgSemi, fontFamily: font, transition: 'background 0.12s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.sm,
        width: '100%', ...style,
      }}
    >
      {children}
    </button>
  )
}

function GhostButton({ children, onClick, style = {} }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 48, borderRadius: 8, cursor: 'pointer',
        background: '#f2f9f9', color: '#037e8a',
        border: `1px solid ${hovered ? '#037e8a' : '#b3d8dc'}`,
        ...type.labelLgSemi, fontFamily: font, transition: 'border-color 0.12s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.sm,
        width: '100%', ...style,
      }}
    >
      {children}
    </button>
  )
}

function KbdKey({ children }) {
  return (
    <kbd style={{
      background: color.bgOverlay, border: `1px solid ${color.borderLighter}`,
      borderRadius: 4, padding: `${sp.xs / 2}px ${sp.sm}px`,
      ...type.labelSmReg, color: color.typeLabelDark, fontFamily: font,
    }}>
      {children}
    </kbd>
  )
}

const textareaStyle = (brand) => ({
  width: '100%', borderRadius: 8, padding: `${sp.md}px ${sp.lg}px`,
  border: `1px solid #7C879F`, resize: 'vertical',
  fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font,
  color: '#323743', outline: 'none', background: color.bgDefault,
  transition: 'border-color 0.12s, box-shadow 0.12s',
})

// ─── Tooltip (ZDS visual spec — dark bg, arrow, 300ms delay) ─────────────────
function Tooltip({ label, children, side = 'left' }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const show = () => { timerRef.current = setTimeout(() => setVisible(true), 300) }
  const hide = () => { clearTimeout(timerRef.current); setVisible(false) }
  const arrowSize = 5
  const offset = 8
  const sideStyle = side === 'left'
    ? { right: `calc(100% + ${offset}px)`, left: 'auto' }
    : { left: `calc(100% + ${offset}px)`, right: 'auto' }
  const arrowStyle = side === 'left'
    ? { right: -arrowSize * 1.2, left: 'auto', borderLeft: `${arrowSize + 1}px solid #13151A`, borderRight: 'none' }
    : { left: -arrowSize * 1.2, right: 'auto', borderRight: `${arrowSize + 1}px solid #13151A`, borderLeft: 'none' }
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div style={{
          position: 'absolute', ...sideStyle, top: '50%', transform: 'translateY(-50%)',
          background: '#13151A', color: '#FFFFFF', borderRadius: 4,
          padding: '5px 10px', fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 4px 8px rgba(0,0,0,0.24), 0 1px 3px rgba(0,0,0,0.16)',
        }}>
          {label}
          <div style={{
            position: 'absolute', ...arrowStyle, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: `${arrowSize}px solid transparent`,
            borderBottom: `${arrowSize}px solid transparent`,
          }} />
        </div>
      )}
    </div>
  )
}

// ─── Sampling Selector ────────────────────────────────────────────────────────
function SamplingSelector({ samplings, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null)
  return (
    <div style={{
      flex: 1, background: color.bgDefault, fontFamily: font,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      overflowY: 'auto',
      padding: sp.xl * 2,
    }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ marginBottom: sp.xl * 1.5 }}>
          <p style={{ ...type.caption, color: color.typeHelper, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: sp.md }}>
            BizSG Bot Evaluation
          </p>
          <h1 style={{ ...type.displaySmBold, color: color.typeHeaderDark, marginBottom: sp.sm }}>
            Select a sampling
          </h1>
          <p style={{ ...type.labelLgReg, color: color.typeBodyLight }}>
            Choose a set of Q&amp;A pairs to review.
          </p>
        </div>
        {samplings.length === 0 ? (
          <p style={{ ...type.labelMdReg, color: color.typeHelper }}>Loading…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
            {samplings.map(s => (
              <button
                key={s.sampling_id}
                onClick={() => onSelect(s.sampling_id)}
                onMouseEnter={() => setHoveredId(s.sampling_id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: color.bgSurface, border: `1px solid ${hoveredId === s.sampling_id ? color.borderPrimary : color.borderLighter}`,
                  borderRadius: 8, padding: `${sp.lg}px ${sp.xl}px`,
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: hoveredId === s.sampling_id ? `0 0 0 3px ${brand[50]}33` : 'none',
                  transition: 'border-color 0.12s, box-shadow 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.lg, marginBottom: sp.sm }}>
                  <p style={{ ...type.labelLgSemi, color: color.typeHeaderDark }}>{s.name}</p>
                  <span style={{
                    ...type.labelSmReg, fontWeight: 400, color: color.primary,
                    background: color.primarySubtle,
                    borderRadius: 16, padding: `${sp.xs}px ${sp.md}px`, whiteSpace: 'nowrap', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', height: 24,
                  }}>
                    {s.n_conversations ?? s.n_pairs} {s.n_conversations ? 'conversations' : 'pairs'}
                  </span>
                </div>
                <p style={{ ...type.labelSmReg, color: color.typeBodyLight, marginBottom: sp.sm }}>
                  Created by {s.created_by} · {formatDate(s.created_at)}
                </p>
                <div style={{ display: 'flex', gap: sp.sm }}>
                  <Pill>{s.taxonomy_version}</Pill>
                  <Pill>{s.cycle}</Pill>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nav Header ───────────────────────────────────────────────────────────────
function NavHeader({ onHome }) {
  return (
    <div style={{
      height: 64, background: color.bgSurface,
      borderBottom: `1px solid ${color.borderLighter}`,
      display: 'flex', alignItems: 'center',
      padding: `0 ${sp.xl}px`, gap: sp.xl,
      fontFamily: font, flexShrink: 0,
    }}>
      <span style={{
        fontSize: 20, fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.4px',
        background: 'linear-gradient(120deg, #037E8A 7.76%, #4FA5AD 92.24%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        flexShrink: 0,
      }}>BizSG Bot Evaluations</span>
      <nav style={{ display: 'flex', height: '100%', alignItems: 'stretch' }}>
        {[
          { label: 'Results', active: false },
          { label: 'Tagging', active: true, onClick: onHome },
          { label: 'Chat', active: false },
        ].map(item => (
          <div key={item.label} onClick={item.onClick} style={{
            display: 'flex', alignItems: 'center',
            padding: `0 ${sp.md}px`,
            fontSize: 16, fontWeight: 400,
            color: item.active ? color.primary : color.typeLabelDark,
            borderBottom: item.active ? `4px solid ${color.primary}` : '4px solid transparent',
            cursor: item.onClick ? 'pointer' : 'default', userSelect: 'none',
          }}>
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  )
}

// ─── Progress Header ──────────────────────────────────────────────────────────
function NavIconButton({ onClick, disabled, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov && !disabled ? '#13151A0A' : 'none',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        color: disabled ? color.typeDisabled : (hov ? '#03727D' : '#444C5D'),
        transition: 'background 0.12s, color 0.12s',
        opacity: disabled ? 0.4 : 1,
      }}
    >{children}</button>
  )
}

function ProgressHeader({ showKeyHint, streak }) {
  const hasContent = streak >= 3 || showKeyHint
  if (!hasContent) return null
  return (
    <div style={{
      background: color.bgSurface, borderBottom: `1px solid ${color.borderLighter}`,
      padding: `0 ${sp.xl}px`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      fontFamily: font, flexShrink: 0, minHeight: 44,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.lg, flexShrink: 0 }}>
        {streak >= 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
            <span style={{ fontSize: 14 }}>👏</span>
            <span style={{ ...type.labelSmReg, color: color.typeBodyLight, fontWeight: 600 }}>{streak} in a row</span>
          </div>
        )}
        {showKeyHint && (
          <div style={{ display: 'flex', gap: sp.md, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
              <KbdKey>↵</KbdKey>
              <span style={{ ...type.labelSmReg, color: color.typeHelper }}>good</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
              <KbdKey>N</KbdKey>
              <span style={{ ...type.labelSmReg, color: color.typeHelper }}>flag</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pair Viewer (left pane — v3: claims only, no expected outcome/raw enquiry) ─
function PairViewer({ pair, claimStates, tileList, turnCurrent, turnTotal, canGoBack, onBack, canGoForward, onForward }) {
  return (
    <div style={{
      padding: sp.xl, overflowY: 'auto', height: '100%',
      fontFamily: font, display: 'flex', flexDirection: 'column', gap: sp.lg,
    }}>
      {/* Meta pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.sm }}>
        <Pill>{pair.case_id}</Pill>
        <Pill>{pair.channel}</Pill>
      </div>

      {/* Inline turn nav */}
      {(
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs }}>
          <NavIconButton onClick={onBack} disabled={!canGoBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavIconButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `0 ${sp.xs}px` }}>
            {Array.from({ length: turnTotal }, (_, i) => (
              <div key={i} style={{
                width: i + 1 === turnCurrent ? 16 : 6,
                height: 6, borderRadius: 3,
                background: i + 1 <= turnCurrent ? color.primary : color.borderLighter,
                opacity: i + 1 < turnCurrent ? 0.4 : 1,
                transition: 'width 0.2s, background 0.2s',
              }} />
            ))}
          </div>
          <span style={{ ...type.labelSmReg, color: color.typeBodyLight, whiteSpace: 'nowrap' }}>
            Question {turnCurrent} of {turnTotal}
          </span>
          <NavIconButton onClick={onForward} disabled={!canGoForward}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </NavIconButton>
        </div>
      )}

      {/* Question */}
      <div style={{ background: color.bgSurface, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.xl }}>
        <SectionLabel>Question</SectionLabel>
        <p style={{ fontSize: 18, fontWeight: 600, lineHeight: '28px', color: color.typeHeaderDark }}>
          {pair.question}
        </p>
      </div>

      {/* Response — claims with live annotation */}
      <div style={{ background: color.bgSurface, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.xl }}>
        <SectionLabel>Response</SectionLabel>
        {tileList && tileList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
            {tileList.map((tile, tilePos) => {
              if (tile.kind === 'added') {
                const hasSources = (tile.sources || []).length > 0
                return (
                  <div key={`added-${tile.id}`} style={{
                    display: 'flex', gap: sp.sm, alignItems: 'flex-start',
                    padding: `${sp.md}px ${sp.lg}px`,
                    background: tile.text.trim() ? '#F0FDF4' : color.bgOverlay,
                    borderRadius: 6,
                    opacity: tile.text.trim() ? 1 : 0.5,
                    transition: 'background 0.2s, opacity 0.2s',
                  }}>
                    <span style={{
                      ...type.caption, flexShrink: 0, marginTop: 2,
                      background: brand[10], color: brand[60],
                      border: `1px solid ${brand[20]}`,
                      borderRadius: 3, padding: '1px 6px', fontWeight: 600,
                    }}>New</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...type.labelMdReg, lineHeight: '20px', color: tile.text.trim() ? '#166534' : color.typeBodyLight, fontStyle: tile.text.trim() ? 'normal' : 'italic' }}>
                        {tile.text.trim() || 'Pending…'}
                      </p>
                      {hasSources && (
                        <ClaimSourceBox
                          sources={tile.sources}
                          claimSourceStates={{}}
                          claimAddedSources={[]}
                        />
                      )}
                    </div>
                  </div>
                )
              }
              const i = tile.origIdx
              const c = pair.claims[i]
              const cs = claimStates?.[i]
              const isIrrelevant = cs?.verdict === 'fail' && cs?.tag === 'Irrelevant'
              const isInaccurate = cs?.verdict === 'fail' && cs?.tag === 'Inaccurate'
              const displayText = isInaccurate && cs.correction.trim() ? cs.correction.trim() : c.claim
              const isReplaced = isInaccurate && cs.correction.trim()
              return (
                <div key={`orig-${i}`} style={{
                  display: 'flex', gap: sp.sm, alignItems: 'flex-start',
                  padding: `${sp.md}px ${sp.lg}px`,
                  background: isIrrelevant ? '#FFF8F8' : isInaccurate ? (isReplaced ? '#F0FDF4' : '#FFF8F8') : color.bgOverlay,
                  borderRadius: 6,
                  opacity: isIrrelevant ? 0.5 : 1,
                  transition: 'background 0.2s, opacity 0.2s',
                }}>
                  <span style={{ ...type.labelSmReg, color: color.typeHelper, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: sp.xs }}>
                    <div style={{ display: 'flex', gap: sp.sm, alignItems: 'flex-start' }}>
                      <p style={{
                        ...type.labelMdReg, lineHeight: '20px', flex: 1,
                        color: isIrrelevant ? color.typeBodyLight : isReplaced ? '#166534' : isInaccurate ? '#DC2626' : color.typeBodyLight,
                        textDecoration: isIrrelevant ? 'line-through' : 'none',
                        transition: 'color 0.2s',
                      }}>{displayText}</p>
                      {c.agency && (
                        <span style={{
                          flexShrink: 0, marginTop: 2,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          height: 24, borderRadius: 16, padding: '0 12px',
                          fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font,
                          background: c.agency === CURRENT_AGENCY ? '#DEE1E7' : '#DEE1E7',
                          color: c.agency === CURRENT_AGENCY ? '#323743' : '#323743',
                        }}>{c.agency}</span>
                      )}
                    </div>
                    <ClaimSourceBox
                      sources={c.sources}
                      claimSourceStates={cs?.claimSourceStates}
                      claimAddedSources={cs?.claimAddedSources}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ ...type.labelMdReg, color: color.typeBodyLight }}>No individual claims extracted for this pair.</p>
        )}
      </div>
    </div>
  )
}

// ─── Triage Panel ─────────────────────────────────────────────────────────────
function TriagePanel({ onPass, onFail }) {
  return (
    <div style={{ padding: sp.xl, fontFamily: font, display: 'flex', flexDirection: 'column', gap: sp.xl, height: '100%' }}>
      <div style={{ paddingTop: sp.sm }}>
        <h2 style={{ ...type.headingSmSemi, color: color.typeHeaderDark, marginBottom: sp.sm }}>
          Is this response good enough?
        </h2>
        <p style={{ ...type.labelMdReg, color: color.typeBodyLight, lineHeight: '22px' }}>
          Check the claims and their cited sources against the question.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
        <PrimaryButton onClick={onPass}>
          Yes, looks good
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: `${sp.xs / 2}px ${sp.sm}px`, ...type.caption }}>↵</span>
        </PrimaryButton>
        <GhostButton onClick={onFail}>
          No, something's off
          <span style={{ background: color.bgOverlay, border: `1px solid ${color.borderLighter}`, borderRadius: 4, padding: `${sp.xs / 2}px ${sp.sm}px`, ...type.caption }}>N</span>
        </GhostButton>
      </div>
    </div>
  )
}

// ─── Sources Review Panel ─────────────────────────────────────────────────────
function SourcesReviewPanel({ sources, onConfirm, onFail }) {
  return (
    <div style={{ padding: sp.xl, fontFamily: font, display: 'flex', flexDirection: 'column', gap: sp.xl, height: '100%', overflowY: 'scroll', scrollbarGutter: 'stable' }}>
      <div style={{ paddingTop: sp.sm }}>
        <h2 style={{ ...type.headingSmSemi, color: color.typeHeaderDark, marginBottom: sp.sm }}>
          Check the sources
        </h2>
        <p style={{ ...type.labelMdReg, color: color.typeBodyLight, lineHeight: '22px' }}>
          Are the sources cited correct and relevant?
        </p>
      </div>
      {sources.length === 0 ? (
        <div style={{
          border: `1px dashed ${color.borderLighter}`, borderRadius: 8,
          padding: `${sp.xl}px ${sp.lg}px`, textAlign: 'center',
        }}>
          <p style={{ ...type.labelMdReg, color: color.typeBodyLight, fontFamily: font }}>No sources cited for this response.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.sm }}>
          {sources.map(src => (
            <div key={src.id} style={{
              background: color.bgDefault, border: `1px solid ${color.borderLighter}`,
              borderRadius: 8, padding: sp.lg, display: 'flex', flexDirection: 'column', gap: sp.xs,
            }}>
              <p style={{ ...type.labelMdReg, fontWeight: 600, color: color.typeLabelDark, fontFamily: font }}>{src.title}</p>
              {src.url && (
                <a href={src.url} target="_blank" rel="noopener noreferrer"
                  style={{ ...type.labelSmReg, color: color.primary, fontFamily: font, wordBreak: 'break-all' }}>
                  {src.url}
                </a>
              )}
              {src.excerpt && (
                <p style={{ ...type.labelSmReg, color: color.typeBodyLight, fontFamily: font, lineHeight: '20px' }}>{src.excerpt}</p>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
        <PrimaryButton onClick={onConfirm}>
          Confirm &amp; submit
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: `${sp.xs / 2}px ${sp.sm}px`, ...type.caption }}>↵</span>
        </PrimaryButton>
        <GhostButton onClick={onFail}>
          Something's off
          <span style={{ background: color.bgOverlay, border: `1px solid ${color.borderLighter}`, borderRadius: 4, padding: `${sp.xs / 2}px ${sp.sm}px`, ...type.caption }}>N</span>
        </GhostButton>
      </div>
    </div>
  )
}

// ─── Pass Feedback Panel ──────────────────────────────────────────────────────
function PassFeedbackPanel({ streak }) {
  return (
    <div style={{
      padding: sp.xl, fontFamily: font, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', height: '100%', gap: sp.lg,
    }}>
      <style>{`
        @keyframes checkIn {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes labelIn {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{
        width: 72, height: 72, borderRadius: 36,
        background: '#E9F6E9', border: '2px solid #279B27',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, animation: 'checkIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both', color: '#1E771E',
      }}>✓</div>
      <div style={{ textAlign: 'center', animation: 'labelIn 0.3s 0.2s ease both' }}>
        <p style={{ ...type.labelLgSemi, color: '#1E771E', marginBottom: sp.xs }}>Marked as good</p>
        {streak >= 2 && (
          <p style={{ ...type.labelSmReg, color: color.typeBodyLight }}>{streak} in a row 👏</p>
        )}
      </div>
    </div>
  )
}

// ─── Claim Row (v3) ───────────────────────────────────────────────────────────
function ClaimSourceReview({ claimSources, claimSourceStates, claimAddedSources, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('url')
  const [formUrl, setFormUrl] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formFile, setFormFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false)
  const [isDeleteHovered, setIsDeleteHovered] = useState(false)
  const [hovTypeBtn, setHovTypeBtn] = useState(null)
  const [hovAddSource, setHovAddSource] = useState(false)
  const [hovCancel, setHovCancel] = useState(false)
  const [hovSrcBtn, setHovSrcBtn] = useState(null)
  const [expandedSrc, setExpandedSrc] = useState({})
  const formFileId = useRef(`csrc-${Math.random().toString(36).slice(2)}`).current

  const allOriginal = claimSources || []
  const total = allOriginal.length + claimAddedSources.length
  const canAdd = formType === 'url' ? formUrl.trim().length > 0 : formFile !== null

  const focusSrc = e => { e.target.style.borderColor = color.borderPrimary; e.target.style.boxShadow = `0 0 0 1px ${color.primary}`; e.target.style.borderColor = color.primary }
  const blurSrc  = e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#7C879F' }

  const setSourceFlag = (idx, flag) => {
    const next = { ...claimSourceStates }
    if (next[idx] === flag) { delete next[idx] } else { next[idx] = flag }
    onUpdate({ claimSourceStates: next })
  }

  const handleAdd = () => {
    if (!canAdd) return
    const newSrc = formType === 'url'
      ? { id: `csrc-${Date.now()}`, type: 'url', url: formUrl.trim(), title: formTitle.trim() || formUrl.trim() }
      : { id: `csrc-${Date.now()}`, type: 'doc', file: formFile, title: formFile.name }
    onUpdate({ claimAddedSources: [...claimAddedSources, newSrc] })
    setFormUrl(''); setFormTitle(''); setFormFile(null); setShowForm(false)
  }

  const removeAdded = (id) => onUpdate({ claimAddedSources: claimAddedSources.filter(s => s.id !== id) })

  return (
    <div style={{ marginTop: sp.lg, borderTop: `1px solid ${color.borderLighter}`, paddingTop: sp.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md }}>
        <p style={{ ...type.labelMdReg, fontFamily: font, fontWeight: 600, color: color.typeLabelDark }}>
          {total === 1 ? 'Source' : 'Sources'}<span style={{ ...type.labelMdReg, fontFamily: font, fontWeight: 400, color: color.typeBodyLight, marginLeft: sp.xs }}>({total})</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          onMouseEnter={() => setHovAddSource(true)} onMouseLeave={() => setHovAddSource(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            ...type.labelMdReg, fontFamily: font, fontWeight: 600,
            color: hovAddSource ? color.primaryHover : color.primary,
            padding: `${sp.xs}px ${sp.sm}px`, borderRadius: 8,
            transition: 'color 0.12s',
          }}
        >+ Add source</button>
      </div>

      {total === 0 && !showForm && (
        <div style={{ border: `1px dashed ${color.borderLighter}`, borderRadius: 8, padding: `${sp.xl}px ${sp.lg}px`, textAlign: 'center' }}>
          <p style={{ ...type.labelMdReg, color: color.typeBodyLight, fontFamily: font }}>No sources cited for this claim.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
        {/* Original sources with Inaccurate / Irrelevant buttons */}
        {allOriginal.map((src, idx) => {
          const flag = claimSourceStates[idx]
          const isIrrelevant = flag === 'irrelevant'
          const isInaccurate = flag === 'inaccurate'
          return (
            <div key={idx} style={{
              display: 'flex', flexDirection: 'column', gap: sp.sm,
              borderLeft: `3px solid ${isInaccurate ? '#FCA5A5' : color.borderLighter}`,
              paddingLeft: sp.sm,
              opacity: isIrrelevant ? 0.4 : 1,
              transition: 'opacity 0.15s, border-color 0.15s',
            }}>
              {/* Text snippet */}
              {src.text && (() => {
                const isExpanded = expandedSrc[idx]
                const lineH = 18
                const LIMIT = 80
                const pStyle = { ...type.labelSmReg, fontFamily: font, margin: 0, lineHeight: `${lineH}px`, color: isInaccurate ? '#EF4444' : color.typeBodyLight, textDecoration: isIrrelevant ? 'line-through' : 'none' }
                const needsClamp = src.text.length > LIMIT
                const toggleBtn = (label) => (
                  <button
                    onClick={() => setExpandedSrc(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    onMouseEnter={e => e.currentTarget.style.color = '#003FBD'}
                    onMouseLeave={e => e.currentTarget.style.color = '#0054FD'}
                    style={{
                      display: 'inline', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: '0.75rem', fontFamily: font, fontWeight: 400,
                      color: '#0054FD', lineHeight: `${lineH}px`, textDecoration: 'underline',
                    }}>{label}</button>
                )
                if (!needsClamp) return <p style={pStyle}>{src.text}</p>
                if (isExpanded) return <p style={pStyle}>{src.text}{' '}{toggleBtn('Show less')}</p>
                return <p style={pStyle}>{src.text.slice(0, LIMIT).trimEnd()}…{' '}{toggleBtn('Show more')}</p>
              })()}
              {/* Chip */}
              {src.title && (
                <span style={{ opacity: isIrrelevant ? 0.5 : 1 }}>
                  <SourceRefChip title={src.title} url={src.url} type={src.type} />
                </span>
              )}
              <div style={{ display: 'flex', gap: sp.sm }}>
                {['Inaccurate', 'Irrelevant'].map(label => {
                  const flagKey = label.toLowerCase()
                  const active = flag === flagKey
                  const hov = hovSrcBtn === `${idx}-${label}`
                  return (
                    <button
                      key={label}
                      onClick={() => setSourceFlag(idx, flagKey)}
                      onMouseEnter={() => setHovSrcBtn(`${idx}-${label}`)}
                      onMouseLeave={() => setHovSrcBtn(null)}
                      style={{
                        height: 30, padding: `0 ${sp.md}px`, borderRadius: 6, cursor: 'pointer',
                        ...type.labelSmReg, fontFamily: font, transition: 'all 0.12s',
                        background: active ? '#FEE2E2' : (hov ? '#FFF1F1' : 'transparent'),
                        color: active ? '#DC2626' : (hov ? '#DC2626' : color.typeBodyLight),
                        border: `1px solid ${active ? '#FCA5A5' : (hov ? '#FCA5A5' : color.borderLighter)}`,
                        fontWeight: active ? 600 : 400,
                      }}
                    >✗ {label}</button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Added sources — removable via bin icon */}
        {claimAddedSources.map(src => (
          <SourceCard
            key={src.id}
            source={src}
            isIncorrect={false}
            onRemove={() => removeAdded(src.id)}
          />
        ))}

        {/* Add source form — exact SourcesSection form */}
        {showForm && (
          <div style={{ background: color.bgDefault, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.lg }}>
            <div style={{ display: 'flex', gap: sp.sm, marginBottom: sp.md }}>
              {['url', 'doc'].map(t => {
                const selected = formType === t
                const hov = hovTypeBtn === t
                return (
                  <button key={t} onClick={() => setFormType(t)}
                    onMouseEnter={() => setHovTypeBtn(t)} onMouseLeave={() => setHovTypeBtn(null)}
                    style={{
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      padding: `${sp.sm}px ${sp.md}px`,
                      fontSize: 12, fontWeight: 600, lineHeight: '16px', fontFamily: font,
                      background: selected ? (hov ? '#02545D' : '#03727D') : (hov ? '#CEE6E8' : '#E9F4F5'),
                      color: selected ? '#FFFFFF' : (hov ? '#02545D' : '#03727D'),
                      transition: 'background 0.12s, color 0.12s',
                    }}>{t === 'url' ? 'URL' : 'Document'}</button>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.lg }}>
              {formType === 'url' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>URL</label>
                    <input type="url" placeholder="https://…" value={formUrl} autoFocus
                      onChange={e => setFormUrl(e.target.value)}
                      onFocus={e => { focusSrc(e); e.currentTarget.style.boxShadow = `0 0 0 1px ${color.primary}`; e.currentTarget.style.borderColor = color.primary }}
                      onBlur={e => { blurSrc(e); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#7C879F' }}
                      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#5C677E' }}
                      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#7C879F' }}
                      style={{ width: '100%', height: 44, borderRadius: 8, padding: `0 ${sp.md}px`, border: `1px solid #7C879F`, fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font, color: '#323743', outline: 'none', background: color.bgDefault, transition: 'border-color 0.12s, box-shadow 0.12s' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Label <span style={{ color: '#5C677E', fontWeight: 300 }}>(optional)</span></label>
                    <input type="text" placeholder="e.g. MRA Grant Guidelines" value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      onFocus={e => { focusSrc(e); e.currentTarget.style.boxShadow = `0 0 0 1px ${color.primary}`; e.currentTarget.style.borderColor = color.primary }}
                      onBlur={e => { blurSrc(e); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#7C879F' }}
                      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#5C677E' }}
                      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#7C879F' }}
                      style={{ width: '100%', height: 44, borderRadius: 8, padding: `0 ${sp.md}px`, border: `1px solid #7C879F`, fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font, color: '#323743', outline: 'none', background: color.bgDefault, transition: 'border-color 0.12s, box-shadow 0.12s' }}
                    />
                  </div>
                </>
              )}
              {formType === 'doc' && (() => {
                const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) setFormFile(f) }
                return (
                  <>
                    <input type="file" id={formFileId} accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.xls,.xlsx,.csv" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFormFile(f); e.target.value = '' }}
                    />
                    {formFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid #DEE1E7`, borderRadius: 8 }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Add document</span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, height: 20, minWidth: 0, overflow: 'hidden' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E771E" fillRule="evenodd" style={{ flexShrink: 0 }}><path fillRule="evenodd" d="M12 21.6a9.6 9.6 0 1 0 0-19.2 9.6 9.6 0 0 0 0 19.2Zm4.448-11.151a1.2 1.2 0 1 0-1.697-1.697L10.8 12.703l-1.551-1.551a1.2 1.2 0 0 0-1.698 1.697l2.4 2.4a1.2 1.2 0 0 0 1.697 0l4.8-4.8Z"/></svg>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#0054FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{formFile.name}</span>
                          </div>
                        </div>
                        <button onClick={() => setFormFile(null)} onMouseEnter={() => setIsDeleteHovered(true)} onMouseLeave={() => setIsDeleteHovered(false)}
                          style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', margin: `${sp.sm}px ${sp.sm}px 0 0`, background: isDeleteHovered ? '#13151A0A' : 'none', border: 'none', cursor: 'pointer', color: isDeleteHovered ? '#03727D' : '#444C5D', transition: 'background 0.12s, color 0.12s' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ) : (
                      <label htmlFor={formFileId}
                        onMouseEnter={() => setIsDropZoneHovered(true)} onMouseLeave={() => setIsDropZoneHovered(false)}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
                        style={{ display: 'flex', alignItems: 'center', border: `1px dashed ${isDragging ? color.primary : isDropZoneHovered ? '#323743' : '#7C879F'}`, borderRadius: 8, cursor: 'pointer', background: isDragging ? color.primarySubtle : color.bgDefault, transition: 'border-color 0.12s, background 0.12s' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Add document</span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 300, lineHeight: '20px', fontFamily: font, color: '#5C677E' }}>Browse or drop a file to upload</span>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', margin: `${sp.sm}px ${sp.sm}px 0 0`, color: isDragging ? color.primary : color.typeBodyLight }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDragging ? color.primary : '#444C5D'} strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"/></svg>
                        </div>
                      </label>
                    )}
                  </>
                )
              })()}
            </div>

            <div style={{ display: 'flex', gap: sp.sm, justifyContent: 'flex-end', marginTop: sp.md }}>
              <button onClick={() => { setFormUrl(''); setFormTitle(''); setFormFile(null); setShowForm(false) }}
                onMouseEnter={() => setHovCancel(true)} onMouseLeave={() => setHovCancel(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: `${sp.xs}px ${sp.md}px`, height: 36, ...type.labelSmReg, fontFamily: font, fontWeight: 600, color: hovCancel ? color.primaryHover : color.primary, transition: 'color 0.12s' }}
              >Cancel</button>
              <button onClick={handleAdd} disabled={!canAdd}
                style={{ background: canAdd ? color.primary : color.bgDisabled, border: 'none', borderRadius: 8, cursor: canAdd ? 'pointer' : 'not-allowed', padding: `${sp.xs}px ${sp.md}px`, height: 36, ...type.labelSmReg, fontFamily: font, fontWeight: 600, color: color.typeInverse, transition: 'background 0.12s' }}
              >Add source</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClaimRow({ index, claim, agency, isOwn, state, onUpdate, claimSources }) {
  const [hovBtn, setHovBtn] = useState(null)
  const isFail = state.verdict === 'fail'

  const focusStyle = (e) => { e.currentTarget.style.borderColor = color.borderPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${brand[50]}33` }
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = '#7C879F'; e.currentTarget.style.boxShadow = 'none' }

  return (
    <>
    <div style={{ background: color.bgDefault, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.lg }}>
      <div style={{ display: 'flex', gap: sp.sm, alignItems: 'flex-start', marginBottom: isOwn ? sp.md : 0 }}>
        <span style={{ ...type.labelSmReg, color: color.typeHelper, flexShrink: 0, marginTop: 2 }}>{index + 1}</span>
        <p style={{ ...type.labelMdReg, color: color.typeBodyLight, lineHeight: '22px', flex: 1 }}>{claim}</p>
      </div>

      {!isOwn && null}
      {/* Inaccurate / Irrelevant toggle buttons — own claims only */}
      {isOwn && <div style={{ display: 'flex', gap: sp.sm }}>
        {['Inaccurate', 'Irrelevant'].map(label => {
          const active = state.verdict === 'fail' && state.tag === label
          const hov = hovBtn === label
          return (
            <button
              key={label}
              onClick={() => onUpdate({
                verdict: active ? 'pass' : 'fail',
                tag: active ? null : label,
                whyInaccurate: '', correction: '', explanation: '',
              })}
              onMouseEnter={() => setHovBtn(label)}
              onMouseLeave={() => setHovBtn(null)}
              style={{
                height: 30, padding: `0 ${sp.md}px`, borderRadius: 6, cursor: 'pointer',
                ...type.labelSmReg, fontFamily: font, transition: 'all 0.12s',
                background: active ? '#FEE2E2' : (hov ? '#FFF1F1' : 'transparent'),
                color: active ? '#DC2626' : (hov ? '#DC2626' : color.typeBodyLight),
                border: `1px solid ${active ? '#FCA5A5' : (hov ? '#FCA5A5' : color.borderLighter)}`,
                fontWeight: active ? 600 : 400,
              }}
            >✗ {label}</button>
          )
        })}
      </div>}

      {/* Sub-fields — own claims only */}
      {isOwn && isFail && (
        <div style={{ marginTop: sp.xl, display: 'flex', flexDirection: 'column', gap: sp.lg }}>
          {state.tag === 'Inaccurate' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>
                  Why is this inaccurate? <span style={{ color: '#C81E1E' }}>*</span>
                </p>
                <textarea
                  placeholder="Explain what is wrong or misleading"
                  value={state.whyInaccurate}
                  onChange={e => onUpdate({ ...state, whyInaccurate: e.target.value })}
                  rows={2} style={textareaStyle(brand)} onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>
                  Expected response <span style={{ color: '#C81E1E' }}>*</span>
                </p>
                <textarea
                  placeholder="Write the correct information"
                  value={state.correction}
                  onChange={e => onUpdate({ ...state, correction: e.target.value })}
                  rows={2} style={textareaStyle(brand)} onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
            </>
          )}

          {state.tag === 'Irrelevant' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>
                Why is it irrelevant? <span style={{ ...type.labelMdReg, color: '#647283' }}>(Optional)</span>
              </p>
              <textarea
                placeholder="Explain why this claim is irrelevant"
                value={state.explanation}
                onChange={e => onUpdate({ ...state, explanation: e.target.value })}
                rows={2} style={textareaStyle(brand)} onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
          )}
        </div>
      )}

      <ClaimSourceReview
        claimSources={claimSources}
        claimSourceStates={state.claimSourceStates || {}}
        claimAddedSources={state.claimAddedSources || []}
        onUpdate={patch => onUpdate({ ...state, ...patch })}
      />
    </div>
    </>
  )
}

// ─── Claim Source Box ─────────────────────────────────────────────────────────
function SourceRefChip({ title, url, type: srcType }) {
  const [hov, setHov] = useState(false)
  const isUrl = srcType === 'url' && url
  if (isUrl) return (
    <a href={url} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.75rem', fontWeight: 400, lineHeight: '1rem', fontFamily: font,
        color: hov ? '#003FBD' : '#0054FD',
        textDecoration: 'underline',
        overflow: 'hidden', transition: 'color 0.12s',
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
    </a>
  )
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.75rem', fontWeight: 400, lineHeight: '1rem', fontFamily: font,
      color: '#0054FD', overflow: 'hidden',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
    </span>
  )
}

function ClaimSourceBox({ sources, claimSourceStates = {}, claimAddedSources = [] }) {
  const [expanded, setExpanded] = useState(true)
  const allSources = [...(sources || []), ...claimAddedSources]
  const hasSources = allSources.length > 0
  const total = allSources.length
  return (
    <div style={{ marginTop: sp.sm, borderTop: `1px solid ${color.borderLighter}`, paddingTop: sp.sm }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: sp.xs, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        <span style={{ ...type.labelSmReg, fontWeight: 600, color: color.typeBodyLight, fontFamily: font, flex: 1, textAlign: 'left' }}>
          {`Source${total !== 1 ? 's' : ''} (${total})`}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.typeBodyLight} strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.18s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {expanded && (
        <div style={{ marginTop: sp.xs, display: 'flex', flexDirection: 'column', gap: sp.md }}>
          {hasSources ? (sources || []).map((s, idx) => {
            const flag = claimSourceStates[idx]
            const isIrrelevant = flag === 'irrelevant'
            const isInaccurate = flag === 'inaccurate'
            return (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                borderLeft: `3px solid ${isInaccurate ? '#FCA5A5' : isIrrelevant ? color.borderLighter : color.borderLighter}`,
                paddingLeft: sp.sm,
                opacity: isIrrelevant ? 0.4 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
              }}>
                {s.text && (
                  <p style={{
                    ...type.labelSmReg, fontFamily: font, margin: 0, lineHeight: '18px',
                    color: isInaccurate ? '#EF4444' : color.typeBodyLight,
                    textDecoration: isIrrelevant ? 'line-through' : 'none',
                  }}>{s.text}</p>
                )}
                {s.title && (
                  <span style={{ opacity: isIrrelevant ? 0.5 : 1 }}>
                    <SourceRefChip title={s.title} url={s.url} type={s.type} />
                  </span>
                )}

              </div>
            )
          }) : null}
          {claimAddedSources.map((s, idx) => (
            <div key={`added-${idx}`} style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              borderLeft: `3px solid ${brand[30]}`, paddingLeft: sp.sm,
            }}>
              {s.title && <SourceRefChip title={s.title} url={s.url} type={s.type} />}
            </div>
          ))}
          {!hasSources && (
            <p style={{ ...type.labelSmReg, fontFamily: font, margin: 0, color: color.typeBodyLight, lineHeight: '18px' }}>Not available</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gap Zone (insert claim between tiles) ────────────────────────────────────
function GapZone({ index, onAdd, alwaysVisible = false }) {
  const [hovered, setHovered] = useState(false)
  const show = alwaysVisible || hovered
  return (
    <div
      onClick={() => onAdd(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: show ? 36 : 16,
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
        cursor: show ? 'pointer' : 'default',
        transition: 'height 0.18s ease',
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.15s ease 0.04s',
      }}>
        <div style={{
          flex: 1, height: 2,
          backgroundImage: `radial-gradient(circle, ${brand[30]} 1px, transparent 1px)`,
          backgroundSize: '8px 2px', backgroundRepeat: 'repeat-x', backgroundPosition: 'center',
        }} />
        <button
          onClick={() => onAdd(index)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            ...type.labelMdReg, fontWeight: 600, fontFamily: font,
            color: alwaysVisible && hovered ? color.primaryHover : color.primary,
            padding: `${sp.xs}px ${sp.sm}px`, borderRadius: 4,
            transition: 'color 0.12s',
          }}
        >+ Add claim</button>
        <div style={{
          flex: 1, height: 2,
          backgroundImage: `radial-gradient(circle, ${brand[30]} 1px, transparent 1px)`,
          backgroundSize: '8px 2px', backgroundRepeat: 'repeat-x', backgroundPosition: 'center',
        }} />
      </div>
    </div>
  )
}

// ─── Source components ────────────────────────────────────────────────────────
function SourceCard({ source, isIncorrect, onToggle, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [hovToggle, setHovToggle] = useState(false)
  const [hovBin, setHovBin] = useState(false)

  const isDoc = source.type === 'doc'

  const getHostname = (url) => { try { return new URL(url).hostname } catch { return url } }

  return (
    <div style={{
      background: isIncorrect ? '#FFF8F8' : color.bgDefault,
      border: `1px solid ${isIncorrect ? '#FCA5A5' : color.borderLighter}`,
      borderRadius: 8, padding: sp.lg,
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      <div style={{ display: 'flex', gap: sp.sm, alignItems: 'flex-start' }}>
        {/* icon */}
        <div style={{ color: isIncorrect ? '#EF4444' : '#7C879F', flexShrink: 0, marginTop: 3 }}>
          {isDoc
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1"/></svg>
          }
        </div>
        {/* content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isDoc ? (
            source.excerpt ? (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: sp.xs, width: '100%', textAlign: 'left',
                  ...type.labelMdReg, fontFamily: font, fontWeight: 600,
                  color: isIncorrect ? '#EF4444' : color.typeLabelDark,
                  textDecoration: isIncorrect ? 'line-through' : 'none',
                }}
              >
                <span style={{ flex: 1 }}>{source.title}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68"
                  style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: '#444C5D' }}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            ) : (
              <p style={{
                ...type.labelMdReg, fontFamily: font, fontWeight: 600,
                color: isIncorrect ? '#EF4444' : color.typeLabelDark,
                textDecoration: isIncorrect ? 'line-through' : 'none',
              }}>{source.title || source.file?.name}</p>
            )
          ) : (
            <>
              <a
                href={source.url} target="_blank" rel="noopener noreferrer"
                onMouseEnter={e => e.currentTarget.style.color = isIncorrect ? '#EF4444' : color.primaryHover}
                onMouseLeave={e => e.currentTarget.style.color = isIncorrect ? '#EF4444' : color.primary}
                style={{
                  ...type.labelMdReg, fontFamily: font, fontWeight: 600,
                  color: isIncorrect ? '#EF4444' : color.primary,
                  textDecoration: isIncorrect ? 'line-through' : 'none',
                  display: 'block', transition: 'color 0.12s',
                }}
              >{source.title || source.url}</a>
              <p style={{ ...type.labelSmReg, fontFamily: font, color: color.typeBodyLight, marginTop: 2 }}>
                {getHostname(source.url)}
              </p>
            </>
          )}
          {isDoc && expanded && (
            <p style={{
              ...type.labelMdReg, fontFamily: font, color: color.typeBodyLight,
              marginTop: sp.sm, lineHeight: '20px',
            }}>{source.excerpt}</p>
          )}
        </div>
        {/* actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.xs, flexShrink: 0 }}>
          {onRemove ? (
            <button
              onClick={onRemove}
              onMouseEnter={() => setHovBin(true)}
              onMouseLeave={() => setHovBin(false)}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hovBin ? '#13151A0A' : 'none',
                border: 'none', cursor: 'pointer',
                color: hovBin ? '#03727D' : '#444C5D',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={onToggle}
              onMouseEnter={() => setHovToggle(true)}
              onMouseLeave={() => setHovToggle(false)}
              style={{
                height: 30, padding: `0 ${sp.md}px`, borderRadius: 6, cursor: 'pointer',
                ...type.labelSmReg, fontFamily: font, transition: 'all 0.12s', whiteSpace: 'nowrap',
                background: isIncorrect ? '#FEE2E2' : (hovToggle ? '#FFF1F1' : 'transparent'),
                color: isIncorrect ? '#DC2626' : (hovToggle ? '#DC2626' : color.typeBodyLight),
                border: `1px solid ${isIncorrect ? '#FCA5A5' : (hovToggle ? '#FCA5A5' : color.borderLighter)}`,
                fontWeight: isIncorrect ? 600 : 400,
              }}
            >✗ Wrong source</button>
          )}
        </div>
      </div>
    </div>
  )
}

function SourcesSection({ sources, sourceStates, onSourceStateChange, addedSources, onAddedSourcesChange, compact = false }) {
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('url')
  const [formUrl, setFormUrl] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formFile, setFormFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false)
  const [isDeleteHovered, setIsDeleteHovered] = useState(false)
  const formFileId = useRef(`src-file-${Math.random().toString(36).slice(2)}`).current
  const [hovCancel, setHovCancel] = useState(false)
  const [hovAddSource, setHovAddSource] = useState(false)
  const [hovTypeBtn, setHovTypeBtn] = useState(null)
  const resetForm = () => { setFormUrl(''); setFormTitle(''); setFormFile(null) }

  const allSources = sources || []
  const total = allSources.length + addedSources.length

  const focusSrc = e => { e.target.style.borderColor = color.borderPrimary; e.target.style.outline = `3px solid ${brand[50]}33` }
  const blurSrc  = e => { e.target.style.borderColor = color.borderDark;    e.target.style.outline = 'none' }

  const canAdd = formType === 'url' ? formUrl.trim().length > 0 : formFile !== null

  const handleAdd = () => {
    if (!canAdd) return
    const newSrc = formType === 'url'
      ? { id: `added-src-${Date.now()}`, type: 'url', url: formUrl.trim(), title: formTitle.trim() || formUrl.trim() }
      : { id: `added-src-${Date.now()}`, type: 'doc', file: formFile, title: formFile.name }
    onAddedSourcesChange([...addedSources, newSrc])
    resetForm(); setShowForm(false)
  }

  const handleCancel = () => { resetForm(); setShowForm(false) }

  return (
    <div style={{ marginTop: compact ? sp.sm : sp.xl }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md }}>
        <p style={{ ...type.labelLgSemi, fontFamily: font, color: color.typeLabelDark }}>
          Sources<span style={{ ...type.labelMdReg, fontFamily: font, fontWeight: 400, color: color.typeBodyLight, marginLeft: sp.xs }}>({total})</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          onMouseEnter={() => setHovAddSource(true)}
          onMouseLeave={() => setHovAddSource(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            ...type.labelMdReg, fontFamily: font, fontWeight: 600,
            color: hovAddSource ? color.primaryHover : color.primary,
            padding: `${sp.xs}px ${sp.sm}px`, borderRadius: 8,
            transition: 'color 0.12s',
          }}
        >+ Add source</button>
      </div>

      {total === 0 && !showForm && (
        <div style={{
          border: `1px dashed ${color.borderLighter}`, borderRadius: 8,
          padding: `${sp.xl}px ${sp.lg}px`, textAlign: 'center',
        }}>
          <p style={{ ...type.labelMdReg, color: color.typeBodyLight, fontFamily: font }}>
            No sources cited for this response.
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
        {allSources.map(src => (
          <SourceCard
            key={src.id}
            source={src}
            isIncorrect={!!(sourceStates[src.id]?.isIncorrect)}
            onToggle={() => onSourceStateChange(src.id, { isIncorrect: !sourceStates[src.id]?.isIncorrect })}
          />
        ))}
        {addedSources.map(src => (
          <SourceCard
            key={src.id}
            source={src}
            isIncorrect={!!(sourceStates[src.id]?.isIncorrect)}
            onToggle={() => onSourceStateChange(src.id, { isIncorrect: !sourceStates[src.id]?.isIncorrect })}
            onRemove={() => onAddedSourcesChange(addedSources.filter(s => s.id !== src.id))}
          />
        ))}

        {showForm && (
          <div style={{
            background: color.bgDefault, border: `1px solid ${color.borderLighter}`,
            borderRadius: 8, padding: sp.lg,
          }}>
            <div style={{ display: 'flex', gap: sp.sm, marginBottom: sp.md }}>
              {['url', 'doc'].map(t => {
                const selected = formType === t
                const hov = hovTypeBtn === t
                return (
                  <button key={t} onClick={() => setFormType(t)}
                    onMouseEnter={() => setHovTypeBtn(t)} onMouseLeave={() => setHovTypeBtn(null)}
                    style={{
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      padding: `${sp.sm}px ${sp.md}px`,
                      fontSize: 12, fontWeight: 600, lineHeight: '16px', fontFamily: font,
                      background: selected ? (hov ? '#02545D' : '#03727D') : (hov ? '#CEE6E8' : '#E9F4F5'),
                      color: selected ? '#FFFFFF' : (hov ? '#02545D' : '#03727D'),
                      transition: 'background 0.12s, color 0.12s',
                    }}>{t === 'url' ? 'URL' : 'Document'}</button>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.lg }}>
              {formType === 'url' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>URL</label>
                    <input
                      type="url" placeholder="https://…" value={formUrl} autoFocus
                      onChange={e => setFormUrl(e.target.value)}
                      onFocus={e => { focusSrc(); e.currentTarget.style.boxShadow = `0 0 0 1px ${color.primary}`; e.currentTarget.style.borderColor = color.primary }}
                      onBlur={e => { blurSrc(); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#7C879F' }}
                      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#5C677E' }}
                      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#7C879F' }}
                      style={{
                        width: '100%', height: 44, borderRadius: 8,
                        padding: `0 ${sp.md}px`, border: `1px solid #7C879F`,
                        fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font,
                        color: '#323743', outline: 'none', background: color.bgDefault,
                        transition: 'border-color 0.12s, box-shadow 0.12s',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Label <span style={{ color: '#5C677E', fontWeight: 300 }}>(optional)</span></label>
                    <input
                      type="text" placeholder="e.g. MRA Grant Guidelines" value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      onFocus={e => { focusSrc(); e.currentTarget.style.boxShadow = `0 0 0 1px ${color.primary}`; e.currentTarget.style.borderColor = color.primary }}
                      onBlur={e => { blurSrc(); e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#7C879F' }}
                      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#5C677E' }}
                      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#7C879F' }}
                      style={{
                        width: '100%', height: 44, borderRadius: 8,
                        padding: `0 ${sp.md}px`, border: `1px solid #7C879F`,
                        fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font,
                        color: '#323743', outline: 'none', background: color.bgDefault,
                        transition: 'border-color 0.12s, box-shadow 0.12s',
                      }}
                    />
                  </div>
                </>
              )}
              {formType === 'doc' && (() => {
                const handleDrop = (e) => {
                  e.preventDefault(); setIsDragging(false)
                  const f = e.dataTransfer.files?.[0]; if (f) setFormFile(f)
                }
                return (
                  <>
                    <input type="file" id={formFileId} accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.xls,.xlsx,.csv" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFormFile(f); e.target.value = '' }}
                    />
                    {formFile ? (
                      // Filled state — matches ZDS FileUploader complete variant
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        border: `1px solid #DEE1E7`, borderRadius: 8,
                      }}>
                        {/* Left: title + constraints + file row */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Add document</span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS</span>
                          </div>
                          {/* FilledFileRow: checkmark + filename (link) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, height: 20, minWidth: 0, overflow: 'hidden' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E771E" fillRule="evenodd" style={{ flexShrink: 0 }}><path fillRule="evenodd" d="M12 21.6a9.6 9.6 0 1 0 0-19.2 9.6 9.6 0 0 0 0 19.2Zm4.448-11.151a1.2 1.2 0 1 0-1.697-1.697L10.8 12.703l-1.551-1.551a1.2 1.2 0 0 0-1.698 1.697l2.4 2.4a1.2 1.2 0 0 0 1.697 0l4.8-4.8Z"/></svg>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#0054FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{formFile.name}</span>
                          </div>
                        </div>
                        {/* Right: DeleteAction — 36px circle, trash icon */}
                        <button
                          onClick={() => setFormFile(null)}
                          onMouseEnter={() => setIsDeleteHovered(true)}
                          onMouseLeave={() => setIsDeleteHovered(false)}
                          style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            alignSelf: 'flex-start', margin: `${sp.sm}px ${sp.sm}px 0 0`,
                            background: isDeleteHovered ? '#13151A0A' : 'none',
                            border: 'none', cursor: 'pointer',
                            color: isDeleteHovered ? '#03727D' : '#444C5D',
                            transition: 'background 0.12s, color 0.12s',
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ) : (
                      // Empty state — dashed drop zone, matches ZDS FileUploader exactly
                      <label htmlFor={formFileId}
                        onMouseEnter={() => setIsDropZoneHovered(true)}
                        onMouseLeave={() => setIsDropZoneHovered(false)}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                          display: 'flex', alignItems: 'center',
                          border: `1px dashed ${isDragging ? color.primary : isDropZoneHovered ? '#323743' : '#7C879F'}`,
                          borderRadius: 8, cursor: 'pointer',
                          background: isDragging ? color.primarySubtle : color.bgDefault,
                          transition: 'border-color 0.12s, background 0.12s',
                        }}
                      >
                        {/* Left: title + constraints + browse prompt — matches FileUploader inner layout */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>
                              Add document
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>
                              Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS
                            </span>
                          </div>
                          {/* EmptyFileRow equivalent: label-md-light + type-color-label-light */}
                          <span style={{ fontSize: 14, fontWeight: 300, lineHeight: '20px', fontFamily: font, color: '#5C677E' }}>
                            Browse or drop a file to upload
                          </span>
                        </div>
                        {/* Right: BrowseAction — 36px circle, cloud-arrow-up icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          alignSelf: 'flex-start', margin: `${sp.sm}px ${sp.sm}px 0 0`,
                          color: isDragging ? color.primary : color.typeBodyLight,
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDragging ? color.primary : '#444C5D'} strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"/></svg>
                        </div>
                      </label>
                    )}
                  </>
                )
              })()}
            </div>

            <div style={{ display: 'flex', gap: sp.sm, justifyContent: 'flex-end', marginTop: sp.md }}>
              <button
                onClick={handleCancel}
                onMouseEnter={() => setHovCancel(true)}
                onMouseLeave={() => setHovCancel(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: `${sp.xs}px ${sp.md}px`, height: 36,
                  ...type.labelSmReg, fontFamily: font, fontWeight: 600,
                  color: hovCancel ? color.primaryHover : color.primary,
                  transition: 'color 0.12s',
                }}
              >Cancel</button>
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                style={{
                  background: canAdd ? color.primary : color.bgDisabled,
                  border: 'none', borderRadius: 8, cursor: canAdd ? 'pointer' : 'not-allowed',
                  padding: `${sp.xs}px ${sp.md}px`, height: 36,
                  ...type.labelSmReg, fontFamily: font, fontWeight: 600,
                  color: color.typeInverse,
                  transition: 'background 0.12s',
                }}
              >Add source</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Claim Review Panel (v3) ──────────────────────────────────────────────────
function ClaimReviewPanel({
  pair, claimStates, onUpdate,
  addedClaims, onAddedClaimsChange,
  sourceStates, onSourceStateChange, addedSources, onAddedSourcesChange,
  onSubmit, sourcesOnly = false,
}) {
  const handleReorder = (from, to) => {
    const next = [...addedClaims]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onAddedClaimsChange(next)
  }

  const handleAddClaim = (flatPos) => {
    const next = [...addedClaims]
    next.splice(flatPos, 0, { kind: 'added', id: Date.now(), text: '', sources: [] })
    onAddedClaimsChange(next)
  }

  const handleRemove = (id) => {
    onAddedClaimsChange(addedClaims.filter(t => t.id !== id))
  }

  const handleAddedChange = (id, text) => {
    onAddedClaimsChange(addedClaims.map(t => t.id === id ? { ...t, text } : t))
  }

  const handleAddedSourcesChange = (id, update) => {
    onAddedClaimsChange(addedClaims.map(t => t.id === id ? { ...t, ...update } : t))
  }

  const [hovBtn, setHovBtn] = useState(null)

  const failNeedsInput = claimStates.some((cs, i) => {
    const agency = pair.claims[i]?.agency
    if (agency && agency !== CURRENT_AGENCY) return false
    if (cs.verdict !== 'fail') return false
    if (cs.tag === 'Inaccurate') return !cs.whyInaccurate.trim() || !cs.correction.trim()
    return false
  })

  const focusStyle = (e) => { e.currentTarget.style.borderColor = color.borderPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${brand[50]}33` }
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = '#7C879F'; e.currentTarget.style.boxShadow = 'none' }

  return (
    <div style={{ padding: sp.xl, fontFamily: font, display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflowY: 'scroll', scrollbarGutter: 'stable' }}>
      {/* Header */}
      <div style={{ marginBottom: sourcesOnly ? sp.xs : sp.lg }}>
        <h2 style={{ ...type.headingSmSemi, color: color.typeHeaderDark, marginBottom: sp.xs }}>
          {sourcesOnly ? 'Review each source' : 'Review each claim'}
        </h2>
        {!sourcesOnly && (
          <p style={{ ...type.labelMdReg, color: color.typeBodyLight }}>
            Each claim is treated as correct unless you flag it as inaccurate or irrelevant.
          </p>
        )}
      </div>

      {/* Flat tile list — hidden when sourcesOnly */}
      {!sourcesOnly && (() => {
        const items = []
        addedClaims.forEach((tile, pos) => {
          const tileContent = tile.kind === 'original' ? (
            <ClaimRow
              index={tile.origIdx}
              claim={pair.claims[tile.origIdx].claim}
              agency={pair.claims[tile.origIdx].agency}
              isOwn={!pair.claims[tile.origIdx].agency || pair.claims[tile.origIdx].agency === CURRENT_AGENCY}
              state={claimStates[tile.origIdx]}
              onUpdate={update => onUpdate(tile.origIdx, update)}
              claimSources={pair.claims[tile.origIdx].sources}
            />
          ) : (
            <div style={{
              background: color.bgDefault, border: `1px solid ${color.borderLighter}`,
              borderRadius: 8, padding: sp.lg, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>New claim</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm }}>
                <input
                  type="text" placeholder="Enter claim text" value={tile.text} autoFocus
                  onChange={e => handleAddedChange(tile.id, e.target.value)}
                  style={{
                    flex: 1, height: 44, borderRadius: 8,
                    padding: `0 ${sp.lg}px`, border: `1px solid #7C879F`,
                    fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font,
                    color: '#323743', outline: 'none', background: color.bgDefault,
                    transition: 'border-color 0.12s, box-shadow 0.12s',
                  }}
                  onFocus={focusStyle} onBlur={blurStyle}
                  onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#5C677E' }}
                  onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#7C879F' }}
                />
                <button
                  onClick={() => handleRemove(tile.id)}
                  onMouseEnter={() => setHovBtn(tile.id)}
                  onMouseLeave={() => setHovBtn(null)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hovBtn === tile.id ? '#13151A0A' : 'none',
                    border: 'none', cursor: 'pointer',
                    color: hovBtn === tile.id ? '#03727D' : '#444C5D',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg></button>
              </div>
              <ClaimSourceReview
                claimSources={[]}
                claimSourceStates={{}}
                claimAddedSources={tile.sources || []}
                onUpdate={update => handleAddedSourcesChange(tile.id, { sources: update.claimAddedSources ?? tile.sources ?? [] })}
              />
            </div>
          )
          items.push(
            <div key={tile.kind === 'original' ? `orig-${tile.origIdx}` : `added-${tile.id}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: sp.xs, marginBottom: sp.md }}
            >
              <div style={{ flex: 1 }}>{tileContent}</div>
              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingTop: sp.xs }}>
                <Tooltip label="Move up">
                  <NavIconButton onClick={() => handleReorder(pos, pos - 1)} disabled={pos === 0}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 10L8 5L13 10" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </NavIconButton>
                </Tooltip>
                <Tooltip label="Move down">
                  <NavIconButton onClick={() => handleReorder(pos, pos + 1)} disabled={pos === addedClaims.length - 1}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </NavIconButton>
                </Tooltip>
              </div>
            </div>
          )
        })
        items.push(<GapZone key={`gap-${addedClaims.length}`} index={addedClaims.length} onAdd={handleAddClaim} alwaysVisible />)
        return items
      })()}

      {/* Submit */}
      <div style={{ marginTop: 32 }}>
        <PrimaryButton onClick={onSubmit} disabled={failNeedsInput}>
          Submit &amp; next →
        </PrimaryButton>
        {failNeedsInput && (
          <p style={{ ...type.labelSmReg, color: '#CC1616', textAlign: 'center', marginTop: sp.sm }}>
            Complete required fields for flagged claims
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Conversation Sidebar ─────────────────────────────────────────────────────
function ConversationSidebar({ pairs, currentIndex, results, onNavigate }) {
  const [hoveredId, setHoveredId] = useState(null)

  // Build per-conversation entries from flat turns array
  const convEntries = []
  pairs.forEach((p) => {
    if (!convEntries.length || convEntries[convEntries.length - 1].convId !== p._convId) {
      convEntries.push({
        convId: p._convId,
        topic: p._convTopic,
        scheme: p.taxonomy?.scheme ?? null,
        convIndex: p._convIndex,
        turnTotal: p._turnTotal,
        firstPairIndex: pairs.indexOf(p),
      })
    }
  })

  const currentConvId = pairs[currentIndex]?._convId

  const isConvComplete = (convId) =>
    pairs.filter(p => p._convId === convId).every(p => results[p.case_id])

  return (
    <div style={{
      width: 196, flexShrink: 0, overflowY: 'auto',
      borderRight: `1px solid ${color.borderLighter}`,
      background: color.bgSurface, fontFamily: font,
      display: 'flex', flexDirection: 'column',
    }}>
      {(() => {
        const done = pairs.filter(p => results[p.case_id]).length
        const total = pairs.length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <div style={{
            padding: `${sp.md}px ${sp.xl}px`,
            borderBottom: `1px solid ${color.borderLighter}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: sp.xs }}>
              <p style={{ ...type.caption, color: color.typeHelper, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Conversations
              </p>
              <span style={{ ...type.caption, color: color.typeHelper }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: color.borderLighter, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, background: color.primary,
                borderRadius: 2, transition: 'width 0.35s ease',
              }} />
            </div>
          </div>
        )
      })()}
      <div style={{ flex: 1, overflowY: 'auto', padding: `0` }}>
        {convEntries.map((conv, i) => {
          const isActive = conv.convId === currentConvId
          const isHovered = hoveredId === conv.convId && !isActive
          const done = isConvComplete(conv.convId)
          return (
            <div
              key={conv.convId}
              onClick={() => onNavigate(conv.firstPairIndex)}
              onMouseEnter={() => setHoveredId(conv.convId)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: `${sp.lg}px ${sp.xl}px ${sp.lg}px 20px`,
                background: 'transparent',
                borderLeft: `4px solid ${isActive ? color.primary : isHovered ? color.borderLighter : 'transparent'}`,
                transition: 'border-color 0.12s',
                cursor: isActive ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp.xs }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    ...type.labelMdReg, lineHeight: '20px',
                    color: isActive ? color.primary : color.typeLabelDark,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {conv.topic || (conv.scheme ? conv.scheme.replace(/^[^.]+\./, '') : `Conversation ${i + 1}`)}
                  </p>
                </div>
                {done && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="7.5" fill="#E9F6E9" stroke="#279B27" />
                    <path d="M5 8L7 10L11 6" stroke="#1E771E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]               = useState('select')
  const [samplings, setSamplings]       = useState([])
  const [pairs, setPairs]               = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults]           = useState({})
  const [panelState, setPanelState]     = useState('triage')
  const [claimStates, setClaimStates]   = useState([])
  const [addedClaims, setAddedClaims]   = useState([])
  const [sourceStates, setSourceStates] = useState({})
  const [addedSources, setAddedSources] = useState([])
  const [pendingResult, setPendingResult]   = useState(null)
  const [generatedAnswer, setGeneratedAnswer] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [generateError, setGenerateError] = useState(false)
  const [streak, setStreak]             = useState(0)
  const [showKeyHint, setShowKeyHint]   = useState(true)
  const [passFeedback, setPassFeedback] = useState(false)
  const advanceRef = useRef(null)
  const draftsRef  = useRef({})
  const resultsRef = useRef({})
  const pairsRef   = useRef([])
  const indexRef   = useRef(0)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}samplings/index.json`)
      .then(r => r.json())
      .then(d => setSamplings(d.samplings))
      .catch(console.error)
  }, [])

  const freshClaimStates = (pair) =>
    pair.claims.map(() => ({ verdict: 'pass', tag: null, whyInaccurate: '', correction: '', citation: '', citationFiles: [], explanation: '', claimSourceStates: {}, claimAddedSources: [] }))

  const freshTileList = (pair) =>
    pair.claims
      .map((_, i) => ({ kind: 'original', origIdx: i }))

  const initPair = useCallback((pair) => {
    setPanelState('triage')
    setClaimStates(freshClaimStates(pair))
    setAddedClaims(freshTileList(pair))
    setSourceStates({})
    setAddedSources([])
    setGeneratedAnswer('')
    setHasGenerated(false)
    setGenerateError(false)
    setPassFeedback(false)
    setPendingResult(null)
  }, [])

  const saveDraft = useCallback((pair, ps, cs, ac, ga, hg) => {
    if (!pair) return
    draftsRef.current[pair.case_id] = { panelState: ps, claimStates: cs, addedClaims: ac, generatedAnswer: ga, hasGenerated: hg }
  }, [])

  const loadPairWithDraft = useCallback((pair) => {
    setPassFeedback(false)
    setGenerateError(false)
    const draft = draftsRef.current[pair.case_id]
    if (draft) {
      setPanelState(draft.panelState)
      setClaimStates(draft.claimStates)
      setAddedClaims(draft.addedClaims || [])
      setGeneratedAnswer(draft.generatedAnswer || '')
      setHasGenerated(draft.hasGenerated || false)
      return
    }
    const existing = resultsRef.current[pair.case_id]
    if (existing) {
      if (existing.claimResults) {
        setPanelState('claims')
        setClaimStates(existing.claimResults.map(cr => ({
          verdict: cr.verdict, tag: cr.tag,
          whyInaccurate: cr.whyInaccurate || '', correction: cr.correction || '',
          explanation: cr.explanation || '',
          claimSourceStates: cr.claimSourceStates || {}, claimAddedSources: cr.claimAddedSources || [],
        })))
        setAddedClaims(existing.addedClaims || [])
        setGeneratedAnswer(existing.generatedAnswer || '')
        setHasGenerated(!!existing.generatedAnswer)
      } else {
        initPair(pair)
      }
      return
    }
    initPair(pair)
  }, [initPair])

  const selectSampling = async (id) => {
    try {
      const data = await fetch(`${import.meta.env.BASE_URL}samplings/${id}/conversations.json`).then(r => r.json())
      // Flatten conversations → turns, attaching _conv* metadata for sidebar + progress
      const pairsList = []
      data.forEach((conv, convIdx) => {
        conv.turns.forEach((turn, turnIdx) => {
          const turnData = (!turn.answer_text?.trim() || !turn.claims?.length)
            ? {
                ...turn,
                claims: [
                  ...(turn.claims || []),
                  { claim: `Please contact the ${turn.agency || 'relevant'} helpdesk directly for assistance with your enquiry.`, agency: turn.agency || null, source: null },
                ],
              }
            : turn
          pairsList.push({
            ...turnData,
            _convId: conv.conversation_id,
            _convTopic: conv.topic || null,
            _convIndex: convIdx,
            _convTotal: data.length,
            _turnIndex: turnIdx,
            _turnTotal: conv.turns.length,
          })
        })
      })
      setPairs(pairsList)
      pairsRef.current = pairsList
      setCurrentIndex(0)
      indexRef.current = 0
      setResults({})
      setStreak(0)
      setShowKeyHint(true)
      setPhase('reviewing')
      initPair(pairsList[0])
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const advance = useCallback((result, pairsList, idx) => {
    setResults(prev => ({ ...prev, [result.case_id]: result }))
    delete draftsRef.current[result.case_id]
    const updatedResults = { ...resultsRef.current, [result.case_id]: result }
    const nextIndex = idx + 1
    if (nextIndex < pairsList.length) {
      setCurrentIndex(nextIndex)
      indexRef.current = nextIndex
      initPair(pairsList[nextIndex])
    } else {
      // At end of list — go to first unreviewed if any; useEffect handles submission when all done
      const firstUnreviewed = pairsList.findIndex(p => !updatedResults[p.case_id])
      if (firstUnreviewed >= 0) {
        setCurrentIndex(firstUnreviewed)
        indexRef.current = firstUnreviewed
        initPair(pairsList[firstUnreviewed])
      }
    }
  }, [initPair])

  // Submit only when every pair has a result
  useEffect(() => {
    if (phase === 'reviewing' && pairs.length > 0 && pairs.every(p => results[p.case_id])) {
      setPhase('submitted')
    }
  }, [results, pairs, phase])

  useEffect(() => {
    advanceRef.current = (result) => advance(result, pairsRef.current, indexRef.current)
    resultsRef.current = results
  })

  useEffect(() => {
    pairsRef.current = pairs
    indexRef.current = currentIndex
  }, [pairs, currentIndex])

  const handlePassConfirm = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair) return
    if (pendingResult) {
      const result = pendingResult
      setPendingResult(null)
      advance(result, pairs, currentIndex)
    } else {
      setPassFeedback(true)
      setStreak(s => s + 1)
      setShowKeyHint(false)
      setTimeout(() => {
        advanceRef.current({ case_id: pair.case_id, verdict: 'pass' })
      }, 1400)
    }
  }, [pairs, currentIndex, pendingResult, advance])

  const handlePass = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair) return
    setPassFeedback(true)
    setStreak(s => s + 1)
    setShowKeyHint(false)
    setTimeout(() => { advanceRef.current({ case_id: pair.case_id, verdict: 'pass' }) }, 1400)
  }, [pairs, currentIndex])

  const handleFail = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair) return
    setStreak(0)
    setShowKeyHint(false)
    setPanelState('claims')
  }, [pairs, currentIndex])

  const handleSourcesFail = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair) return
    setStreak(0)
    setShowKeyHint(false)
    setPanelState('sources-only-claims')
  }, [pairs, currentIndex])

  const handleGenerate = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair || isGenerating) return
    setIsGenerating(true)
    setGenerateError(false)
    // TODO (eng): replace with real AI API call
    setTimeout(() => {
      setGeneratedAnswer(mockGenerate(pair, claimStates, addedClaims))
      setHasGenerated(true)
      setIsGenerating(false)
    }, 1500)
  }, [pairs, currentIndex, claimStates, addedClaims, isGenerating])

  const handleClaimsSubmit = useCallback(() => {
    const pair = pairs[currentIndex]
    if (!pair) return
    advance({
      case_id: pair.case_id,
      verdict: 'fail',
      claimResults: claimStates.map((cs, i) => ({ claim: pair.claims[i].claim, ...cs })),
      addedClaims: addedClaims.filter(t => t.kind === 'added').map(t => t.text),
    }, pairs, currentIndex)
  }, [pairs, currentIndex, panelState, claimStates, addedClaims, sourceStates, advance])

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return
    const cur = pairs[currentIndex]
    const prev = pairs[currentIndex - 1]
    if (!prev) return
    saveDraft(cur, panelState, claimStates, addedClaims, generatedAnswer, hasGenerated)
    const prevIndex = currentIndex - 1
    setCurrentIndex(prevIndex)
    indexRef.current = prevIndex
    loadPairWithDraft(prev)
  }, [currentIndex, pairs, panelState, claimStates, addedClaims, generatedAnswer, hasGenerated, saveDraft, loadPairWithDraft])

  const handleNext = useCallback(() => {
    if (currentIndex >= pairs.length - 1) return
    const cur = pairs[currentIndex]
    const next = pairs[currentIndex + 1]
    if (!next) return
    saveDraft(cur, panelState, claimStates, addedClaims, generatedAnswer, hasGenerated)
    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)
    indexRef.current = nextIndex
    loadPairWithDraft(next)
  }, [currentIndex, pairs, panelState, claimStates, addedClaims, generatedAnswer, hasGenerated, saveDraft, loadPairWithDraft])

  const handleBackToPortal = useCallback(() => {
    setPhase('select')
    setResults({})
    setPairs([])
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (phase !== 'reviewing') return
      const inField = e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT'
      const cmdEnter = (e.metaKey || e.ctrlKey) && e.key === 'Enter'
      if (cmdEnter) {
        e.preventDefault()
        if (panelState === 'triage' && !passFeedback) { handlePass(); return }
        return
      }
      if (inField) return
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleBack(); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); return }
      if (panelState === 'triage' && !passFeedback) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handlePass() }
        if (e.key === 'n' || e.key === 'N')     { e.preventDefault(); handleFail() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, panelState, passFeedback, handlePass, handleFail, handleBack, handleNext])

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: color.bgOverlay }}>
        <NavHeader onHome={handleBackToPortal} />
        <SamplingSelector samplings={samplings} onSelect={selectSampling} />
      </div>
    )
  }

  if (phase === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: color.bgOverlay, fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Confetti />
        <div style={{ textAlign: 'center', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 40,
            background: color.bgSurface, border: `2px solid ${color.borderLighter}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto', marginBottom: sp.xl, color: '#1E771E',
          }}>✓</div>
          <h1 style={{ ...type.headingMdSemi, color: color.typeHeaderDark, marginBottom: sp.md }}>All tasks done!</h1>
          <p style={{ ...type.labelLgReg, color: color.typeBodyLight, marginBottom: sp.xl }}>
            Your responses have been recorded.<br />Thank you for your time.
          </p>
          <PrimaryButton onClick={handleBackToPortal}>← Back to portal</PrimaryButton>
        </div>
      </div>
    )
  }

  const currentPair = pairs[currentIndex]
  if (!currentPair) return null

  const canGoBackTurn = currentIndex > 0
  const canGoForwardTurn = currentIndex < pairs.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: font, background: color.bgOverlay }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CEE6E8; border-radius: 2px; }
      `}</style>
      <NavHeader onHome={handleBackToPortal} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ConversationSidebar
          pairs={pairs}
          currentIndex={currentIndex}
          results={results}
          onNavigate={(idx) => {
            const cur = pairs[currentIndex]
            const target = pairs[idx]
            if (!target || idx === currentIndex) return
            saveDraft(cur, panelState, claimStates, addedClaims, generatedAnswer, hasGenerated)
            setCurrentIndex(idx)
            indexRef.current = idx
            loadPairWithDraft(target)
          }}
        />
        <div style={{ flex: 1, overflow: 'hidden', borderRight: `1px solid ${color.borderLighter}` }}>
          <PairViewer
            pair={currentPair}
            claimStates={claimStates}
            tileList={addedClaims}
            turnCurrent={currentPair._turnIndex + 1}
            turnTotal={currentPair._turnTotal}
            canGoBack={canGoBackTurn}
            onBack={handleBack}
            canGoForward={canGoForwardTurn}
            onForward={handleNext}
          />
        </div>
        <div style={{ flex: 1, background: color.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {passFeedback && <PassFeedbackPanel streak={streak} />}
          {!passFeedback && panelState === 'triage' && <TriagePanel onPass={handlePass} onFail={handleFail} />}
          {!passFeedback && panelState === 'claims' && (
            <ClaimReviewPanel
              pair={currentPair}
              claimStates={claimStates}
              onUpdate={(i, update) => setClaimStates(prev => prev.map((cs, idx) => idx === i ? update : cs))}
              addedClaims={addedClaims}
              onAddedClaimsChange={setAddedClaims}
              sourceStates={sourceStates}
              onSourceStateChange={(id, update) => setSourceStates(prev => ({ ...prev, [id]: update }))}
              addedSources={addedSources}
              onAddedSourcesChange={setAddedSources}
              onSubmit={handleClaimsSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
