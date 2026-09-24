import { useState, useEffect, useRef, useCallback } from 'react'

// ─── ZDS Tokens (BizSG — color-bizsg.json) ───────────────────────────────────
const brand = {
  10: '#E2F1FE', 20: '#B8D7FC', 30: '#6794F5', 40: '#6794F5',
  50: '#1A3DEA', 60: '#1B39CF', 70: '#1931A3', 80: '#162879',
  90: '#111D51', 100: '#0A102B',
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
const AGENCIES = ['ACRA', 'BCA', 'ESG', 'MOM', 'MPA', 'NEA', 'SSG']

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
    color: ['#1B39CF','#6794F5','#B8D7FC','#FDE68A','#BBF7D0','#FCA5A5','#C7D2FE','#FDBA74','#A5F3FC'][i % 9],
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
  teal:        { bg: '#e6f2f3', c: '#03717c' },
  red:         { bg: '#FDE8E8', c: '#C81E1E' },
  grey:        { bg: '#DEE1E7', c: '#323743' },
  informative:     { bg: brand[10], c: brand[80] },
  informativeDark: { bg: brand[60], c: '#FFFFFF' },
  neutral:         { bg: 'rgba(255,255,255,0.15)', c: '#FFFFFF' },
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
        background: brand[10], color: brand[60],
        border: `1px solid ${hovered ? brand[60] : brand[20]}`,
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
        background: 'linear-gradient(120deg, #111D51 0%, #1B39CF 50%, #1A3DEA 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        flexShrink: 0,
      }}>BizSG Bot Evaluations</span>
      <nav style={{ display: 'flex', height: '100%', alignItems: 'stretch' }}>
        {[
          { label: 'Eval Dashboard', active: false },
          { label: 'Human Review', active: true, onClick: onHome },
          { label: 'Playground', active: false },
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
        color: disabled ? color.typeDisabled : (hov ? '#1B39CF' : '#444C5D'),
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

// ─── Turn Section Header ─────────────────────────────────────────────────────
function ResponseWithSources({ pair, claimStates, addedClaims = [] }) {
  const [open, setOpen] = useState(false)

  // Build sources with claim/source index for state lookup
  const sourcesWithMeta = (pair.claims || []).flatMap((c, claimIdx) => {
    const rawSources = Array.isArray(c.sources) ? c.sources.filter(Boolean) : c.source ? [{ text: c.source }] : []
    return rawSources.map((s, sourceIdx) => ({ s, claimIdx, sourceIdx }))
  })
  // Append added sources from claimStates (sources added to original claims)
  const addedSourcesMeta = (claimStates || []).flatMap((cs, claimIdx) =>
    (cs.claimAddedSources || []).map((s, sourceIdx) => ({ s, claimIdx, sourceIdx: `added-${sourceIdx}`, isAdded: true }))
  )
  // Append sources from added claim tiles
  const addedClaimTileSourcesMeta = (addedClaims || []).filter(t => t.kind === 'added').flatMap((tile) =>
    (tile.sources || []).map((s, sourceIdx) => ({ s, claimIdx: `tile-${tile.id}`, sourceIdx: `tilesrc-${sourceIdx}`, isAdded: true }))
  )
  const allSourcesMeta = [...sourcesWithMeta, ...addedSourcesMeta, ...addedClaimTileSourcesMeta]

  return (
    <>
      <div style={{ background: color.bgSurface, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.xl }}>
        <SectionLabel>Response</SectionLabel>
        {pair.claims && pair.claims.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
            {addedClaims.map((tile, pos) => {
              if (tile.kind === 'original') {
                const i = tile.origIdx
                const c = pair.claims[i]
                const cs = claimStates?.[i]
                const isIrrelevant = cs?.verdict === 'fail' && cs?.tag === 'Irrelevant'
                const isInaccurate = cs?.verdict === 'fail' && cs?.tag === 'Inaccurate'
                const isReplaced = isInaccurate && cs?.correction?.trim()
                const displayText = isReplaced ? cs.correction.trim() : c.claim
                return (
                  <p key={`orig-${i}`} style={{
                    ...type.labelMdReg, lineHeight: '24px', margin: 0,
                    color: isIrrelevant ? '#9CA3AF' : isReplaced ? '#166534' : isInaccurate ? '#DC2626' : color.typeBodyLight,
                    textDecoration: isIrrelevant ? 'line-through' : 'none',
                    opacity: isIrrelevant ? 0.6 : 1,
                    transition: 'color 0.2s, opacity 0.2s',
                  }}>{displayText}</p>
                )
              }
              // added claim
              return tile.text.trim() ? (
                <p key={`added-${tile.id}`} style={{
                  ...type.labelMdReg, lineHeight: '24px', margin: 0,
                  color: '#166534',
                }}>{tile.text.trim()}</p>
              ) : null
            })}
          </div>
        ) : pair.answer_text ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.md }}>
            {pair.answer_text.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} style={{ ...type.labelMdReg, lineHeight: '24px', color: color.typeBodyLight, margin: 0 }}>{line}</p>
            ))}
          </div>
        ) : (
          <p style={{ ...type.labelMdReg, color: color.typeHelper, fontStyle: 'italic' }}>No response text.</p>
        )}
      </div>

      {allSourcesMeta.length > 0 && (
        <div style={{ border: `1px solid ${color.borderLighter}`, borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { e.currentTarget.style.background = '#13151A0A'; e.currentTarget.querySelector('span').style.color = '#1B39CF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.querySelector('span').style.color = color.typeBodyLight }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: `${sp.md}px ${sp.xl}px`, background: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: font,
              transition: 'background 0.15s',
            }}
          >
            <span style={{ ...type.labelSmReg, fontWeight: 600, color: color.typeBodyLight }}>
              {allSourcesMeta.length === 1 ? 'Source' : 'Sources'} ({allSourcesMeta.length})
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.typeBodyLight} strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {open && (
            <div style={{ padding: `${sp.sm}px ${sp.xl}px ${sp.lg}px`, display: 'flex', flexDirection: 'column', gap: sp.md, background: '#fff' }}>
              {allSourcesMeta.map(({ s, claimIdx, sourceIdx, isAdded }, i) => {
                const srcState = isAdded ? null : claimStates?.[claimIdx]?.claimSourceStates?.[sourceIdx]
                const isIrrelevant = srcState === 'irrelevant'
                const isInaccurate = srcState === 'inaccurate'
                const accentColor = isInaccurate ? '#EF4444' : isAdded ? '#166534' : color.borderLighter
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    borderLeft: `3px solid ${accentColor}`,
                    paddingLeft: sp.sm,
                    minWidth: 0, overflow: 'hidden',
                    opacity: isIrrelevant ? 0.4 : 1,
                    textDecoration: isIrrelevant ? 'line-through' : 'none',
                    transition: 'opacity 0.2s',
                  }}>
                    {s.text && (
                      <p style={{
                        ...type.labelSmReg, fontFamily: font, margin: 0, lineHeight: '18px',
                        color: isInaccurate ? '#EF4444' : color.typeBodyLight,
                        textDecoration: isIrrelevant ? 'line-through' : 'none',
                      }}>{s.text}</p>
                    )}
                    {s.title && <SourceRefChip title={s.title} url={s.url} type={s.type} />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function TurnSectionHeader({ turnIndex, turnTotal, caseId, channel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, marginBottom: sp.lg }}>
      <span style={{ ...type.labelMdReg, fontWeight: 600, color: color.typeBodyLight, whiteSpace: 'nowrap' }}>
        Turn {turnIndex + 1} of {turnTotal}
      </span>
      {caseId && <Pill>{caseId}</Pill>}
      {channel && <Pill>{channel}</Pill>}
    </div>
  )
}

// ─── Multi-Turn Conversation View (aligned rows) ─────────────────────────────
function MultiTurnConversationView({ convTurns, turnStatesMap, onUpdateClaim, onAddedClaimsChange, onSubmit, onAgencyChange, onTriageStep }) {
  const [hovBtn, setHovBtn] = useState(null)
  const scrollRef = useRef(null)
  const turnRefs = useRef({})
  const firstCaseId = convTurns[0]?.case_id
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, [firstCaseId])

  const allPassed = convTurns.every(pair => {
    const ts = turnStatesMap[pair.case_id]?.triageStep
    return ts === 'passed'
  })
  useEffect(() => { if (allPassed) onSubmit() }, [allPassed, onSubmit])

  const anyFailNeedsInput = convTurns.some(pair => {
    const ts = turnStatesMap[pair.case_id]
    const triageStep = ts?.triageStep ?? 'triage'
    if (triageStep === 'triage') return true
    if (triageStep === 'passing' || triageStep === 'passed') return false
    return (ts?.claimStates || []).some((cs, i) => {
      const agency = pair.claims[i]?.agency
      if (agency && agency !== CURRENT_AGENCY) return false
      if (cs.verdict !== 'fail') return false
      if (cs.tag === 'Inaccurate') return !cs.correction.trim()
      return false
    })
  })

  const focusStyle = (e) => { e.currentTarget.style.borderColor = color.borderPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${brand[50]}33` }
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = '#7C879F'; e.currentTarget.style.boxShadow = 'none' }

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'scroll', fontFamily: font, overflowAnchor: 'none', scrollbarGutter: 'stable' }}>
      {/* One row per turn */}
      {convTurns.map((pair, tIdx) => {
        const claimStates = turnStatesMap[pair.case_id]?.claimStates || []
        const tileList = turnStatesMap[pair.case_id]?.addedClaims || []
        const ts = turnStatesMap[pair.case_id] || { claimStates: [], addedClaims: [] }
        const addedClaims = ts.addedClaims

        const handleReorder = (from, to) => {
          const next = [...addedClaims]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          onAddedClaimsChange(pair.case_id, next)
        }

        const handleAddClaim = (flatPos) => {
          const next = [...addedClaims]
          next.splice(flatPos, 0, { kind: 'added', id: Date.now(), text: '', sources: [] })
          onAddedClaimsChange(pair.case_id, next)
        }

        const triageStep = turnStatesMap[pair.case_id]?.triageStep ?? 'triage'

        return (
          <div key={pair.case_id} ref={el => { turnRefs.current[pair.case_id] = el }} style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${color.borderLighter}`, background: color.bgOverlay }}>
            {/* Full-width turn bar */}
            <div style={{
              padding: `${sp.sm}px ${sp.xl}px`,
              borderBottom: '1px solid #0A102B',
              background: '#111D51',
              display: 'flex', alignItems: 'center', gap: sp.sm,
            }}>
              <span style={{ ...type.labelMdReg, color: '#fff', whiteSpace: 'nowrap', marginRight: sp.sm }}>
                Turn <strong>{tIdx + 1}</strong> of <strong>{convTurns.length}</strong>
              </span>
              {pair.case_id && <Pill color={TAG.neutral.c} bg={TAG.neutral.bg}>{pair.case_id}</Pill>}
              {pair.channel && <Pill color={TAG.neutral.c} bg={TAG.neutral.bg}>{pair.channel}</Pill>}
              <div style={{ flex: 1 }} />
            </div>
            {/* Left + right columns */}
            <div style={{ display: 'flex', alignItems: 'flex-start', background: '#fff' }}>
            {/* Left: question + response */}
            <div style={{ flex: 1, minWidth: 0, width: '50%', borderRight: `1px solid ${color.borderLighter}`, padding: sp.xl, display: 'flex', flexDirection: 'column', gap: sp.lg, background: color.bgOverlay, position: 'sticky', top: 0, alignSelf: 'flex-start' }}>

              <div style={{ background: color.bgSurface, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.xl }}>
                <SectionLabel>Question</SectionLabel>
                <p style={{ fontSize: 18, fontWeight: 600, lineHeight: '28px', color: color.typeHeaderDark }}>{pair.question}</p>
              </div>

              <ResponseWithSources pair={pair} claimStates={claimStates} addedClaims={tileList} />
            </div>

            {/* Right: triage or claims review */}
            <div style={{ flex: 1, minWidth: 0, width: '50%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              {triageStep === 'triage' && (
                <TriagePanel
                  onPass={() => onTriageStep(pair.case_id, 'passing')}
                  onFail={() => onTriageStep(pair.case_id, 'review')}
                />
              )}
              {triageStep === 'passing' && (
                <PassingTransition caseId={pair.case_id} onSettle={onTriageStep} streak={0}
                  onScrollNext={tIdx < convTurns.length - 1 ? () => {
                    const nextEl = turnRefs.current[convTurns[tIdx + 1].case_id]
                    if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } : undefined}
                />
              )}
              {triageStep === 'passed' && (
                <div style={{ paddingTop: 160, textAlign: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 36, background: '#E9F6E9', border: '2px solid #279B27', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#1E771E', margin: '0 auto', marginBottom: sp.sm }}>✓</div>
                    <p style={{ ...type.labelLgSemi, color: '#1E771E' }}>Marked as good</p>
                  </div>
                </div>
              )}
              {triageStep === 'review' && (
                <div style={{ padding: sp.xl, display: 'flex', flexDirection: 'column' }}>
                  {tIdx === 0 && (
                    <div style={{ marginBottom: sp.lg }}>
                      <h2 style={{ ...type.headingSmSemi, color: color.typeHeaderDark, marginBottom: sp.xs }}>Review each claim</h2>
                      <p style={{ ...type.labelMdReg, color: color.typeBodyLight }}>Each claim is treated as correct unless you flag it as inaccurate or irrelevant.</p>
                    </div>
                  )}
                  {addedClaims.map((tile, pos) => {
                    const tileContent = tile.kind === 'original' ? (
                      <ClaimRow
                        index={tile.origIdx}
                        claim={pair.claims[tile.origIdx].claim}
                        agency={pair.claims[tile.origIdx].agency}
                        isOwn={!pair.claims[tile.origIdx].agency || pair.claims[tile.origIdx].agency === CURRENT_AGENCY}
                        state={claimStates[tile.origIdx]}
                        onUpdate={update => onUpdateClaim(pair.case_id, tile.origIdx, update)}
                        claimSources={pair.claims[tile.origIdx].sources}
                        onAgencyChange={newAgency => onAgencyChange(pair.case_id, tile.origIdx, newAgency)}
                      />
                    ) : (
                      <div style={{ background: color.bgDefault, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.lg, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>New claim</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm }}>
                          <input
                            type="text" placeholder="Enter claim text" value={tile.text} autoFocus
                            onChange={e => onAddedClaimsChange(pair.case_id, addedClaims.map(t => t.id === tile.id ? { ...t, text: e.target.value } : t))}
                            style={{ flex: 1, height: 44, borderRadius: 8, padding: `0 ${sp.lg}px`, border: `1px solid #7C879F`, fontSize: 16, fontWeight: 300, lineHeight: '24px', fontFamily: font, color: '#323743', outline: 'none', background: color.bgDefault }}
                            onFocus={focusStyle} onBlur={blurStyle}
                          />
                          <button
                            onClick={() => onAddedClaimsChange(pair.case_id, addedClaims.filter(t => t.id !== tile.id))}
                            onMouseEnter={() => setHovBtn(tile.id)} onMouseLeave={() => setHovBtn(null)}
                            style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hovBtn === tile.id ? '#13151A0A' : 'none', border: 'none', cursor: 'pointer', color: hovBtn === tile.id ? '#1B39CF' : '#444C5D' }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"><path d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                        <ClaimSourceReview
                          claimSources={[]}
                          claimSourceStates={{}}
                          claimAddedSources={tile.sources || []}
                          onUpdate={update => onAddedClaimsChange(pair.case_id, addedClaims.map(t => t.id === tile.id ? { ...t, sources: update.claimAddedSources ?? t.sources ?? [] } : t))}
                        />
                      </div>
                    )
                    return (
                      <div key={tile.kind === 'original' ? `orig-${pair.case_id}-${tile.origIdx}` : `added-${tile.id}`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: sp.xs, marginBottom: sp.md, minWidth: 0 }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>{tileContent}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingTop: sp.xs }}>
                          <Tooltip label="Move up">
                            <NavIconButton onClick={() => handleReorder(pos, pos - 1)} disabled={pos === 0}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 10L8 5L13 10" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </NavIconButton>
                          </Tooltip>
                          <Tooltip label="Move down">
                            <NavIconButton onClick={() => handleReorder(pos, pos + 1)} disabled={pos === addedClaims.length - 1}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.68" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </NavIconButton>
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })}
                  <GapZone key={`gap-end-${pair.case_id}`} index={addedClaims.length} onAdd={handleAddClaim} alwaysVisible />
                  {tIdx === convTurns.length - 1 && (
                    <div style={{ marginTop: sp.xl }}>
                      <PrimaryButton onClick={onSubmit} disabled={anyFailNeedsInput}>
                        Submit &amp; next →
                      </PrimaryButton>
                      {anyFailNeedsInput && (
                        <p style={{ ...type.labelSmReg, color: '#CC1616', textAlign: 'center', marginTop: sp.sm }}>
                          Complete required fields for flagged claims
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        )
      })}

    </div>
  )
}

// ─── Triage Panel ─────────────────────────────────────────────────────────────
function TriagePanel({ onPass, onFail }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPass() }
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); onFail() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPass, onFail])
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

function PassingTransition({ caseId, onSettle, streak, onScrollNext }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onSettle(caseId, 'passed')
      if (onScrollNext) onScrollNext()
    }, 1400)
    return () => clearTimeout(t)
  }, [caseId, onSettle, onScrollNext])
  return <PassFeedbackPanel streak={streak} />
}

// ─── Pass Feedback Panel ──────────────────────────────────────────────────────
function PassFeedbackPanel({ streak }) {
  return (
    <div style={{
      padding: sp.xl, paddingTop: 160, fontFamily: font, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: sp.lg,
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
    <div style={{ marginTop: sp.lg, borderTop: `1px solid ${color.borderLighter}`, paddingTop: sp.lg, overflow: 'hidden', minWidth: 0 }}>
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
              minWidth: 0, overflow: 'hidden',
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
                <span style={{ opacity: isIrrelevant ? 0.5 : 1, display: 'block', overflow: 'hidden', minWidth: 0 }}>
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
                        minHeight: 30, padding: `${sp.sm}px ${sp.md}px`, borderRadius: 6, cursor: 'pointer',
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
          <div style={{ background: color.bgDefault, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.lg, overflow: 'hidden', minWidth: 0 }}>
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
                      background: selected ? (hov ? '#1931A3' : '#1B39CF') : (hov ? '#B8D7FC' : '#E2F1FE'),
                      color: selected ? '#FFFFFF' : (hov ? '#1931A3' : '#1B39CF'),
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
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid #DEE1E7`, borderRadius: 8, width: '100%', overflow: 'hidden' }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Add document</span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, minWidth: 0, overflow: 'hidden' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E771E" fillRule="evenodd" style={{ flexShrink: 0 }}><path fillRule="evenodd" d="M12 21.6a9.6 9.6 0 1 0 0-19.2 9.6 9.6 0 0 0 0 19.2Zm4.448-11.151a1.2 1.2 0 1 0-1.697-1.697L10.8 12.703l-1.551-1.551a1.2 1.2 0 0 0-1.698 1.697l2.4 2.4a1.2 1.2 0 0 0 1.697 0l4.8-4.8Z"/></svg>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#0054FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{formFile.name}</span>
                          </div>
                        </div>
                        <button onClick={() => setFormFile(null)} onMouseEnter={() => setIsDeleteHovered(true)} onMouseLeave={() => setIsDeleteHovered(false)}
                          style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', margin: `${sp.sm}px ${sp.sm}px 0 0`, background: isDeleteHovered ? '#13151A0A' : 'none', border: 'none', cursor: 'pointer', color: isDeleteHovered ? '#1B39CF' : '#444C5D', transition: 'background 0.12s, color 0.12s' }}>
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

function ClaimRow({ index, claim, agency, isOwn, state, onUpdate, claimSources, onAgencyChange }) {
  const [hovBtn, setHovBtn] = useState(null)
  const [hovAddComment, setHovAddComment] = useState(false)
  const [agencyOpen, setAgencyOpen] = useState(false)
  const [hovAgency, setHovAgency] = useState(null)
  const agencyRef = useRef(null)
  const isFail = state.verdict === 'fail'
  const currentAgency = agency || CURRENT_AGENCY

  useEffect(() => {
    if (!agencyOpen) return
    const close = (e) => { if (agencyRef.current && !agencyRef.current.contains(e.target)) setAgencyOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [agencyOpen])

  const focusStyle = (e) => { e.currentTarget.style.borderColor = color.borderPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${brand[50]}33` }
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = '#7C879F'; e.currentTarget.style.boxShadow = 'none' }

  return (
    <>
    <div style={{ background: color.bgDefault, border: `1px solid ${color.borderLighter}`, borderRadius: 8, padding: sp.lg, minWidth: 0, position: 'relative' }}>
      {/* Agency — compact ZDS Select (top-left) */}
      <div style={{ marginBottom: sp.sm }}>
        <div ref={agencyRef} style={{ position: 'relative', display: 'inline-flex' }}>
          <button
            onClick={() => setAgencyOpen(o => !o)}
            onMouseEnter={e => { if (!agencyOpen) e.currentTarget.style.borderColor = '#323743' }}
            onMouseLeave={e => { if (!agencyOpen) e.currentTarget.style.borderColor = '#7C879F' }}
            onFocus={e => { e.currentTarget.style.outline = `2px solid ${color.borderPrimary}`; e.currentTarget.style.outlineOffset = '0px' }}
            onBlur={e => { e.currentTarget.style.outline = 'none' }}
            style={{
              display: 'inline-flex', alignItems: 'center',
              gap: sp.xs, height: 24,
              padding: `0 ${sp.xs}px 0 ${sp.sm}px`,
              borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${agencyOpen ? color.borderPrimary : '#7C879F'}`,
              background: color.bgDefault,
              ...type.caption, fontFamily: font, fontWeight: 600,
              color: color.typeBodyLight,
              transition: 'border-color 0.12s',
            }}
          >
            <span>{currentAgency}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7C879F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transition: 'transform 0.15s', transform: agencyOpen ? 'rotate(180deg)' : 'none' }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          {agencyOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
              background: '#fff', border: `1px solid ${color.borderLighter}`, borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
              minWidth: 120, overflow: 'hidden',
              padding: `${sp.sm}px 0`,
            }}>
              {AGENCIES.map(a => {
                const selected = a === currentAgency
                return (
                  <button key={a}
                    onClick={() => { onAgencyChange(a); setAgencyOpen(false) }}
                    onMouseEnter={() => setHovAgency(a)}
                    onMouseLeave={() => setHovAgency(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', textAlign: 'left',
                      padding: `${sp.md}px ${sp.lg}px`, border: 'none', cursor: 'pointer',
                      ...type.labelMdReg, fontFamily: font,
                      fontWeight: selected ? 600 : 400,
                      background: hovAgency === a ? '#F2F5F5' : '#fff',
                      color: selected ? brand[60] : color.typeBodyLight,
                      transition: 'background 0.1s',
                    }}
                  >
                    <span>{a}</span>
                    {selected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand[60]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: sp.sm, alignItems: 'flex-start', marginBottom: isOwn ? sp.md : 0 }}>
        <span style={{ ...type.labelSmReg, color: color.typeHelper, flexShrink: 0, marginTop: 2 }}>{index + 1}</span>
        <p style={{ ...type.labelMdReg, color: color.typeBodyLight, lineHeight: '22px', flex: 1 }}>{claim}</p>
      </div>

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
                minHeight: 30, padding: `${sp.sm}px ${sp.md}px`, borderRadius: 6, cursor: 'pointer',
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
                  Expected response <span style={{ color: '#C81E1E' }}>*</span>
                </p>
                <textarea
                  placeholder="Write the correct information"
                  value={state.correction}
                  onChange={e => onUpdate({ ...state, correction: e.target.value })}
                  rows={2} style={textareaStyle(brand)} onFocus={focusStyle} onBlur={blurStyle}
                />
              </div>
              {state.comment !== undefined ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Comment <span style={{ ...type.labelMdReg, color: '#647283' }}>(Optional)</span></p>
                  <textarea
                    placeholder="Add a comment"
                    value={state.comment}
                    onChange={e => onUpdate({ ...state, comment: e.target.value })}
                    rows={2} style={textareaStyle(brand)} onFocus={focusStyle} onBlur={blurStyle}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onUpdate({ ...state, comment: '' })}
                  onMouseEnter={() => setHovAddComment(true)} onMouseLeave={() => setHovAddComment(false)}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer',
                    ...type.labelMdReg, fontFamily: font, fontWeight: 600,
                    color: hovAddComment ? color.primaryHover : color.primary,
                    padding: `${sp.xs}px ${sp.sm}px`, borderRadius: 8,
                    transition: 'color 0.12s',
                  }}
                >+ Add comment</button>
              )}
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

      {state.verdict === 'fail' && state.tag === 'Inaccurate' && (
        <ClaimSourceReview
          claimSources={claimSources}
          claimSourceStates={state.claimSourceStates || {}}
          claimAddedSources={state.claimAddedSources || []}
          onUpdate={patch => onUpdate({ ...state, ...patch })}
        />
      )}

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
        maxWidth: '100%', minWidth: 0,
        fontSize: '0.75rem', fontWeight: 400, lineHeight: '1rem', fontFamily: font,
        color: hov ? '#003FBD' : '#0054FD',
        textDecoration: 'underline',
        overflow: 'hidden', transition: 'color 0.12s',
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{title}</span>
    </a>
  )
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      maxWidth: '100%', minWidth: 0,
      fontSize: '0.75rem', fontWeight: 400, lineHeight: '1rem', fontFamily: font,
      color: '#0054FD', overflow: 'hidden',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{title}</span>
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
                color: hovBin ? '#1B39CF' : '#444C5D',
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
                      background: selected ? (hov ? '#1931A3' : '#1B39CF') : (hov ? '#B8D7FC' : '#E2F1FE'),
                      color: selected ? '#FFFFFF' : (hov ? '#1931A3' : '#1B39CF'),
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
                        width: '100%', overflow: 'hidden',
                      }}>
                        {/* Left: title + constraints + file row */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: sp.lg, gap: sp.xs }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: sp.md }}>
                            <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#323743' }}>Add document</span>
                            <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', fontFamily: font, color: '#444C5D' }}>Supports only DOC, DOCX, MD, PDF, TXT, JPG, PNG, CSV, XLS</span>
                          </div>
                          {/* FilledFileRow: checkmark + filename (link) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.sm, minWidth: 0, overflow: 'hidden' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1E771E" fillRule="evenodd" style={{ flexShrink: 0 }}><path fillRule="evenodd" d="M12 21.6a9.6 9.6 0 1 0 0-19.2 9.6 9.6 0 0 0 0 19.2Zm4.448-11.151a1.2 1.2 0 1 0-1.697-1.697L10.8 12.703l-1.551-1.551a1.2 1.2 0 0 0-1.698 1.697l2.4 2.4a1.2 1.2 0 0 0 1.697 0l4.8-4.8Z"/></svg>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 400, lineHeight: '20px', fontFamily: font, color: '#0054FD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{formFile.name}</span>
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
                            color: isDeleteHovered ? '#1B39CF' : '#444C5D',
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

// ─── Multi-Turn Right Pane ────────────────────────────────────────────────────

// ─── Legacy ClaimReviewPanel (kept for reference — not rendered) ──────────────
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
              onAgencyChange={() => {}}
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
                    color: hovBtn === tile.id ? '#1B39CF' : '#444C5D',
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
              style={{ display: 'flex', alignItems: 'flex-start', gap: sp.xs, marginBottom: sp.md, minWidth: 0 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>{tileContent}</div>
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
function freshTurnState(pair) {
  return {
    triageStep: 'triage',
    claimStates: pair.claims.map(() => ({
      verdict: 'pass', tag: null, whyInaccurate: '', correction: '',
      citation: '', citationFiles: [], explanation: '',
      claimSourceStates: {}, claimAddedSources: [],
    })),
    addedClaims: pair.claims.map((_, i) => ({ kind: 'original', origIdx: i })),
  }
}

export default function App() {
  const [phase, setPhase]               = useState('select')
  const [samplings, setSamplings]       = useState([])
  const [pairs, setPairs]               = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults]           = useState({})
  const [convTurnStates, setConvTurnStates] = useState({}) // { [case_id]: { claimStates, addedClaims } }
  const [streak, setStreak]             = useState(0)
  const resultsRef = useRef({})
  const pairsRef   = useRef([])
  const indexRef   = useRef(0)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}samplings/index.json`)
      .then(r => r.json())
      .then(d => setSamplings(d.samplings))
      .catch(console.error)
  }, [])

  const selectSampling = async (id) => {
    try {
      const data = await fetch(`${import.meta.env.BASE_URL}samplings/${id}/conversations.json`).then(r => r.json())
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
      resultsRef.current = {}
      setStreak(0)
      setPhase('reviewing')
      // Init first conversation's turns
      const firstConvId = pairsList[0]._convId
      const initStates = {}
      pairsList.filter(p => p._convId === firstConvId).forEach(p => { initStates[p.case_id] = freshTurnState(p) })
      setConvTurnStates(initStates)
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const handleConvSubmit = useCallback(() => {
    const cur = pairsRef.current[indexRef.current]
    if (!cur) return
    const convTurns = pairsRef.current.filter(p => p._convId === cur._convId)
    const convResults = convTurns.map(pair => {
      const ts = convTurnStates[pair.case_id] || freshTurnState(pair)
      if (ts.triageStep === 'passing' || ts.triageStep === 'passed') {
        return { case_id: pair.case_id, verdict: 'pass', claimResults: [], addedClaims: [] }
      }
      return {
        case_id: pair.case_id,
        verdict: ts.claimStates.some(cs => cs.verdict === 'fail') ? 'fail' : 'pass',
        claimResults: ts.claimStates.map((cs, i) => ({ claim: pair.claims[i].claim, ...cs })),
        addedClaims: ts.addedClaims.filter(t => t.kind === 'added').map(t => t.text),
      }
    })
    const updatedResults = { ...resultsRef.current }
    convResults.forEach(r => { updatedResults[r.case_id] = r })
    resultsRef.current = updatedResults
    setResults({ ...updatedResults })
    setStreak(s => s + 1)

    // Advance to first pair of next unreviewed conversation
    const nextIdx = pairsRef.current.findIndex(p => !updatedResults[p.case_id])
    if (nextIdx >= 0) {
      const nextConvId = pairsRef.current[nextIdx]._convId
      const initStates = {}
      pairsRef.current.filter(p => p._convId === nextConvId).forEach(p => { initStates[p.case_id] = freshTurnState(p) })
      setConvTurnStates(prev => ({ ...prev, ...initStates }))
      setCurrentIndex(nextIdx)
      indexRef.current = nextIdx
    }
  }, [convTurnStates])

  const handleNavigate = useCallback((firstPairIdx) => {
    if (firstPairIdx === currentIndex) return
    const target = pairs[firstPairIdx]
    if (!target) return
    const convTurns = pairs.filter(p => p._convId === target._convId)
    setConvTurnStates(prev => {
      const next = { ...prev }
      convTurns.forEach(p => { if (!next[p.case_id]) next[p.case_id] = freshTurnState(p) })
      return next
    })
    setCurrentIndex(firstPairIdx)
    indexRef.current = firstPairIdx
  }, [pairs, currentIndex])

  const handleBackToPortal = useCallback(() => {
    setPhase('select')
    setResults({})
    setPairs([])
    setConvTurnStates({})
  }, [])

  // Completed check
  useEffect(() => {
    if (phase === 'reviewing' && pairs.length > 0 && pairs.every(p => results[p.case_id])) {
      setPhase('submitted')
    }
  }, [results, pairs, phase])

  useEffect(() => {
    resultsRef.current = results
  })

  useEffect(() => {
    pairsRef.current = pairs
    indexRef.current = currentIndex
  }, [pairs, currentIndex])

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

  const currentConvTurns = pairs.filter(p => p._convId === currentPair._convId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: font, background: color.bgOverlay }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #B8D7FC; border-radius: 2px; }
        .left-pane::-webkit-scrollbar { display: none; }
        .left-pane { scrollbar-width: none; }
      `}</style>
      <NavHeader onHome={handleBackToPortal} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ConversationSidebar
          pairs={pairs}
          currentIndex={currentIndex}
          results={results}
          onNavigate={handleNavigate}
        />
        <MultiTurnConversationView
          convTurns={currentConvTurns}
          turnStatesMap={convTurnStates}
          onUpdateClaim={(caseId, claimIdx, update) => setConvTurnStates(prev => ({
            ...prev,
            [caseId]: {
              ...prev[caseId],
              claimStates: (prev[caseId]?.claimStates || []).map((cs, i) => i === claimIdx ? update : cs),
            },
          }))}
          onAddedClaimsChange={(caseId, tiles) => setConvTurnStates(prev => ({
            ...prev,
            [caseId]: { ...prev[caseId], addedClaims: tiles },
          }))}
          onSubmit={handleConvSubmit}
          onTriageStep={(caseId, step) => setConvTurnStates(prev => ({
            ...prev,
            [caseId]: { ...prev[caseId], triageStep: step },
          }))}
          onAgencyChange={(caseId, claimIdx, newAgency) => {
            setPairs(prev => prev.map(p => {
              if (p.case_id !== caseId) return p
              const claims = [...p.claims]
              claims[claimIdx] = { ...claims[claimIdx], agency: newAgency }
              return { ...p, claims }
            }))
          }}
        />
      </div>
    </div>
  )
}
