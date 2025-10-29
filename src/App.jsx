import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import './App.css'
import './index.css'
import { parseCmpolicyText as parseCMP } from './services/cmpolicy'
import AreaSection from './components/AreaSection'
import TemplateExport from './components/TemplateExport.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { generatePdfFromSummary, generatePdfByCapture, generateExecutivePdf } from './services/pdf'
import { computeBenchmark } from './services/benchmark.js'
import { downloadJSON, buildFullExport } from './services/export.js'
import MetaSection from './components/MetaSection.jsx'
import AnalysisSection from './components/AnalysisSection'
import { useToast } from './components/ToastProvider.jsx'
import { useI18n } from './components/I18nProvider.jsx'
import ManualSection from './components/ManualSection.jsx'
import ImportSection from './components/ImportSection.jsx'
import PreviewSection from './components/PreviewSection.jsx'

function useDropzone(onFiles) {
  const [dragOver, setDragOver] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prevent = (e) => { e.preventDefault() }
    const onEnter = (e) => { prevent(e); setDragOver(true) }
    const onLeave = (e) => { prevent(e); setDragOver(false) }
    const onDrop = (e) => { prevent(e); setDragOver(false); const files = Array.from(e.dataTransfer.files || []); if (files.length) onFiles(files) }
    el.addEventListener('dragenter', onEnter)
    el.addEventListener('dragover', onEnter)
    el.addEventListener('dragleave', onLeave)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragenter', onEnter)
      el.removeEventListener('dragover', onEnter)
      el.removeEventListener('dragleave', onLeave)
      el.removeEventListener('drop', onDrop)
    }
  }, [onFiles])
  return { ref, dragOver }
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="quick-nav" role="tablist" aria-label="Seções">
      {tabs.map(t => (
        <button key={t.key} role="tab" type="button" aria-selected={active===t.key} className={`btn ${active===t.key?'active':''}`} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

function Toolbar({ t, lang, setLang, onExportJson, onExportPdf, onCapturePdf }) {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(v => !v)
  const close = () => setOpen(false)
  useEffect(() => {
    const onDocClick = (e) => { if (!e.target.closest('.dropdown')) close() }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])
  return (
    <div className="toolbar" aria-label="Barra de ferramentas">
      <label style={{display:'inline-flex', alignItems:'center', gap:8}} aria-label="Idioma">
        <span>🌐</span>
        <select value={lang} onChange={e => setLang(e.target.value)}>
          <option value="pt">pt-BR</option>
          <option value="en">en-US</option>
        </select>
      </label>
      <div className={`dropdown ${open?'open':''}`}>
        <button className="dropdown-toggle" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>{t('toolbar.export')}</button>
        <div className="dropdown-menu" role="menu">
          <div className="dropdown-item" role="menuitem" onClick={() => { onExportJson(); close() }}>{t('export.json')}</div>
          <div className="dropdown-item" role="menuitem" onClick={() => { onExportPdf(); close() }}>{t('pdf.structured')}</div>
          <div className="dropdown-item" role="menuitem" onClick={() => { onCapturePdf(); close() }}>{t('pdf.capture')}</div>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ sections }) {
  return (
    <nav className="sidebar" aria-label="Navegação lateral">
      <div className="quick-nav vertical" aria-label="Navegação rápida">
        {sections.map(s => (
          <a key={s.key} href={`#${s.key}`}>{s.label}</a>
        ))}
      </div>
    </nav>
  )
}

function App() {
  const { toast } = useToast()
  const { t, lang, setLang } = useI18n()
  const VALID_TABS = ['import','meta','areas','analysis','manual','models','preview']
  const [policyText, setPolicyText] = useLocalStorage('policyText', '')
  const [policy, setPolicy] = useLocalStorage('policy', null)
  const [templateArea, setTemplateArea] = useLocalStorage('templateArea', 'endpoint')
  const [areas, setAreas] = useLocalStorage('areas', [])
  const [meta, setMeta] = useLocalStorage('reportMeta', { orgName:'', ownerName:'', environment:'Produção', reportDate:'', businessId:'' })
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'import')
  const [severityWeights, setSeverityWeights] = useLocalStorage('severityWeights', { high: 3, medium: 2, low: 1 })
  const [bestPracticesOverride] = useLocalStorage('bestPracticesOverride', null)
  const [manualCEC] = useLocalStorage('manualCEC', { enabled: false })
  const [manualCGEP] = useLocalStorage('manualCGEP', { enabled: false })
  const [manualDDI] = useLocalStorage('manualDDI', { enabled: false })

  const effectiveSummary = useMemo(() => (
    policy ? { ...policy, meta, areas, cec: manualCEC, cgep: manualCGEP, ddi: manualDDI } : { meta, areas, cec: manualCEC, cgep: manualCGEP, ddi: manualDDI }
  ), [meta, policy, areas, manualCEC, manualCGEP, manualDDI])

  const enabledAreas = useMemo(() => {
    const list = Array.isArray(areas) ? areas : []
    const set = new Set(list.map(a => typeof a === 'string' ? a : a?.key))
    const keys = ['endpoint','server','cec','cgep','ddi']
    const res = {}
    for (const k of keys) res[k] = set.size ? set.has(k) : true
    return res
  }, [areas])

  const diagnosis = useMemo(() => computeBenchmark(effectiveSummary, enabledAreas, severityWeights, bestPracticesOverride), [effectiveSummary, enabledAreas, severityWeights, bestPracticesOverride])

  const quickNavSections = [
    { key: 'import', label: t('tabs.import') },
    { key: 'meta', label: t('tabs.meta') },
    { key: 'areas', label: t('tabs.areas') },
    { key: 'analysis', label: t('tabs.analysis') },
    { key: 'manual', label: t('tabs.manual') },
    { key: 'models', label: t('tabs.models') },
    { key: 'preview', label: t('tabs.preview') },
  ]

  // Sanitize aba ativa se vier inválida do localStorage
  useEffect(() => {
    if (!activeTab || !VALID_TABS.includes(activeTab)) {
      setActiveTab('import')
    }
  }, [activeTab])

  // Sync com hash da URL (#import, #analysis, etc.)
  useEffect(() => {
    const applyFromHash = () => {
      const k = (window.location.hash || '').replace('#','')
      if (k && VALID_TABS.includes(k) && k !== activeTab) {
        setActiveTab(k)
      }
    }
    applyFromHash()
    window.addEventListener('hashchange', applyFromHash)
    return () => window.removeEventListener('hashchange', applyFromHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza hash e mostra toast ao trocar de aba
  useEffect(() => {
    if (!activeTab || !VALID_TABS.includes(activeTab)) return
    if ((window.location.hash || '').replace('#','') !== activeTab) {
      window.location.hash = activeTab
    }
    const label = quickNavSections.find(s => s.key === activeTab)?.label
    if (label) {
      toast(`Aba: ${label} carregada`, 'info')
    }
  }, [activeTab, quickNavSections, toast])

  const handleFiles = useCallback(async (files) => {
    const file = files[0]
    const text = await file.text()
    setPolicyText(text)
    try {
      const parsed = await parseCMP(text)
      setPolicy(parsed)
      toast(t('import.success'), 'success', { label: t('tabs.analysis'), onClick: () => setActiveTab('analysis') })
    } catch (e) {
      toast(String(e?.message || e), 'error')
    }
  }, [setPolicyText, setPolicy, toast, t, setActiveTab])

  const drop = useDropzone(handleFiles)

  const handleExportJson = () => {
    try {
      const payload = buildFullExport({ summary: effectiveSummary, diagnosis, meta, policyText, weights: severityWeights, manualInputs: { cec: manualCEC, cgep: manualCGEP, ddi: manualDDI } })
      downloadJSON(payload, `relatorio-${meta?.orgName||'org'}.json`)
      toast(t('toast.json.success'), 'success')
    } catch (e) {
      toast(String(e?.message || e), 'error')
    }
  }

  return (
    <div className="app layout">
      <Sidebar sections={quickNavSections} />
      <div className="content">
        <header className="header" id="top">
          <div className="header-row">
            <h1>{t('header.title')}</h1>
            <Toolbar
              t={t}
              lang={lang}
              setLang={setLang}
              onExportJson={handleExportJson}
              onExportPdf={async () => {
                try {
                  await generatePdfFromSummary(effectiveSummary, null, enabledAreas, `relatorio-${meta?.orgName||'org'}.pdf`, { title: t('pdf.title'), meta: { orgName: meta?.orgName }, diagnosis })
                  toast(t('toast.pdf.success'), 'success')
                } catch (e) { toast(String(e?.message || e), 'error') }
              }}
              onCapturePdf={async () => {
                try {
                  await generatePdfByCapture('section-preview', `relatorio-captura-${meta?.orgName||'org'}.pdf`, { title: t('pdf.title'), meta: { orgName: meta?.orgName } })
                  toast(t('toast.pdf.success'), 'success')
                } catch (e) { toast(String(e?.message || e), 'error') }
              }}
            />
          </div>
          <Tabs tabs={quickNavSections} active={activeTab} onChange={setActiveTab} />
        </header>

        {/* Fallback visual para aba inválida */}
        {!activeTab || !VALID_TABS.includes(activeTab) ? (
          <div className="card" role="status" aria-live="polite">
            <div className="skeleton text" />
            <div className="skeleton block" />
            <div className="preview-block"><p className="muted">Selecione uma aba para começar</p></div>
          </div>
        ) : null}

        {activeTab === 'import' && (
          <ImportSection
            t={t}
            drop={drop}
            policy={policy}
            policyText={policyText}
            setPolicy={setPolicy}
            setPolicyText={setPolicyText}
            onFiles={handleFiles}
          />
        )}

        {activeTab === 'meta' && (
          <section id="meta" className="card">
            <h2>{t('tabs.meta')}</h2>
            <MetaSection meta={meta} setMeta={setMeta} />
          </section>
        )}

        {activeTab === 'areas' && (
          <section id="areas" className="card">
            <h2>{t('tabs.areas')}</h2>
            <div className="preview-grid" aria-label="Resumo por área">
              <AreaSection areaKey="endpoint" label="Endpoint" summary={effectiveSummary} interpretation={{}} diagnosis={diagnosis} />
              <AreaSection areaKey="server" label="Server" summary={effectiveSummary} interpretation={{}} diagnosis={diagnosis} />
              <AreaSection areaKey="cec" label="CEC" summary={effectiveSummary} interpretation={{}} diagnosis={diagnosis} />
              <AreaSection areaKey="cgep" label="CGEP" summary={effectiveSummary} interpretation={{}} diagnosis={diagnosis} />
              <AreaSection areaKey="ddi" label="DDI" summary={effectiveSummary} interpretation={{}} diagnosis={diagnosis} />
            </div>
          </section>
        )}

        {activeTab === 'analysis' && (
          <section id="analysis" className="card">
            <h2>{t('tabs.analysis')}</h2>
            <AnalysisSection summary={effectiveSummary} enabledAreas={enabledAreas} />
          </section>
        )}

        {activeTab === 'manual' && (
          <section id="manual" className="card">
            <h2>{t('tabs.manual')}</h2>
            <ManualSection />
          </section>
        )}

        {activeTab === 'models' && (
          <section id="models" className="card">
            <h2>{t('tabs.models')}</h2>
            <TemplateExport />
          </section>
        )}

        {activeTab === 'preview' && (
          <PreviewSection
            t={t}
            meta={meta}
            effectiveSummary={effectiveSummary}
            diagnosis={diagnosis}
            toast={toast}
          />
        )}

        <footer className="footer">
          <small>{t('footer.meta')}</small>
        </footer>
      </div>
    </div>
  )
}

export default App
