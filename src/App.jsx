import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './index.css'
import { parseCmpolicyText as parseCMP } from './services/cmpolicy'
import AreaSection from './components/AreaSection'
import TemplateExport from './components/TemplateExport.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { generatePdfFromSummary, generatePdfByCapture } from './services/pdf'
import { computeBenchmark } from './services/benchmark.js'
import MetaSection from './components/MetaSection.jsx'
import AnalysisSection from './components/AnalysisSection'
import { useToast } from './components/ToastProvider.jsx'
import { useI18n } from './components/I18nProvider.jsx'

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
        <button key={t.key} role="tab" aria-selected={active===t.key} className={`btn ${active===t.key?'active':''}`} onClick={() => onChange(t.key)}>
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
  const [policyText, setPolicyText] = useLocalStorage('policyText', '')
  const [policy, setPolicy] = useLocalStorage('policy', null)
  const [templateArea, setTemplateArea] = useLocalStorage('templateArea', 'endpoint')
  const [areas, setAreas] = useLocalStorage('areas', [])
  const [meta, setMeta] = useLocalStorage('reportMeta', { orgName:'', ownerName:'', environment:'Produção', reportDate:'', businessId:'' })
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'import')

  const effectiveSummary = useMemo(() => (
    policy ? { ...policy, meta, areas } : { meta, areas }
  ), [meta, policy, areas])

  const enabledAreas = useMemo(() => {
    const list = Array.isArray(areas) ? areas : []
    const set = new Set(list.map(a => typeof a === 'string' ? a : a?.key))
    const keys = ['endpoint','server','cec','cgep','ddi']
    const res = {}
    for (const k of keys) res[k] = set.size ? set.has(k) : true
    return res
  }, [areas])

  const diagnosis = useMemo(() => computeBenchmark(effectiveSummary, enabledAreas), [effectiveSummary, enabledAreas])

  const quickNavSections = [
    { key: 'import', label: t('tabs.import') },
    { key: 'meta', label: t('tabs.meta') },
    { key: 'areas', label: t('tabs.areas') },
    { key: 'analysis', label: t('tabs.analysis') },
    { key: 'models', label: t('tabs.models') },
    { key: 'preview', label: t('tabs.preview') },
  ]

  const drop = useDropzone(async (files) => {
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
  })

  const handleExportJson = () => {
    try {
      const data = JSON.stringify(effectiveSummary, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${meta?.orgName||'org'}.json`
      a.click()
      URL.revokeObjectURL(url)
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
                  await generatePdfFromSummary(effectiveSummary, null, enabledAreas, `relatorio-${meta?.orgName||'org'}.pdf`, { title: t('pdf.title'), meta: { orgName: meta?.orgName } })
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

        {activeTab === 'import' && (
          <section id="import" className="card">
            <h2>{t('tabs.import')}</h2>
            <div ref={drop.ref} className={`dropzone ${drop.dragOver?'dragover':''}`}>
              {t('dropzone.hint')}
              <div className="actions">
                <input aria-label="Escolher arquivo" type="file" accept=".cmpolicy,.json" onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const text = await f.text()
                  setPolicyText(text)
                  try {
                    const parsed = await parseCMP(text)
                    setPolicy(parsed)
                    toast(t('import.success'), 'success', { label: t('tabs.analysis'), onClick: () => setActiveTab('analysis') })
                  } catch (err) {
                    toast(String(err?.message || err), 'error')
                  }
                }} />
                <button className="btn" onClick={() => { setPolicy(null); setPolicyText('') }}>{t('dropzone.clear')}</button>
              </div>
            </div>
            {!policy && (
              <div style={{marginTop:12}}>
                <div className="skeleton text" />
                <div className="skeleton block" />
              </div>
            )}
            {policy && (
              <div className="preview-block">
                <div className="preview-header"><strong>{t('summary.title')}</strong><span className="badge">{t('summary.badge.ok')}</span></div>
                <pre style={{whiteSpace:'pre-wrap'}}>{policyText.slice(0,800)}{policyText.length>800?'...':''}</pre>
              </div>
            )}
          </section>
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

        {activeTab === 'models' && (
          <section id="models" className="card">
            <h2>{t('tabs.models')}</h2>
            <TemplateExport />
          </section>
        )}

        {activeTab === 'preview' && (
          <section id="preview" className="card">
            <h2>{t('tabs.preview')}</h2>
            <div id="section-preview" className="preview-grid">
              <div className="preview-block">
                <div className="preview-header"><strong>{t('preview.header')}</strong><span className="chip">{t('preview.badge.title')}</span></div>
                <p className="tooltip" data-title={t('preview.metaHint')}>{t('preview.orgLabel')}: {meta?.orgName||'-'}</p>
              </div>
            </div>
          </section>
        )}

        <footer className="footer">
          <small>{t('footer.meta')}</small>
        </footer>
      </div>
    </div>
  )
}

export default App
