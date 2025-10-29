import React, { createContext, useContext, useMemo, useState } from 'react';

const messages = {
  pt: {
    'header.title': 'Relatório de Segurança',
    'tabs.import': 'Importação',
    'tabs.meta': 'Meta',
    'tabs.areas': 'Áreas',
    'tabs.analysis': 'Análise',
    'tabs.manual': 'Manual',
    'tabs.models': 'Modelos',
    'tabs.preview': 'Preview',
    'toolbar.export': 'Exportar',
    'export.json': 'Exportar JSON',
    'pdf.structured': 'Gerar PDF estruturado',
    'pdf.capture': 'Gerar PDF por captura',
    'pdf.executive': 'Gerar PDF executivo',
    'dropzone.hint': 'Arraste e solte seu arquivo .cmpolicy aqui',
    'dropzone.clear': 'Limpar',
    'import.success': 'Arquivo importado com sucesso',
    'toast.pdf.success': 'PDF gerado',
    'toast.json.success': 'JSON exportado',
    'pdf.title': 'PoC Report - Resultado de Análise',
    'footer.meta': 'PoC de Relatório • v0.2',
    // adicionados para Preview/Resumo
    'summary.title': 'Resumo',
    'summary.badge.ok': 'OK',
    'preview.header': 'Cabeçalho',
    'preview.badge.title': 'Relatório',
    'preview.metaHint': 'Informações de meta persistem localmente',
    'preview.orgLabel': 'Organização',
  },
  en: {
    'header.title': 'Security Report',
    'tabs.import': 'Import',
    'tabs.meta': 'Meta',
    'tabs.areas': 'Areas',
    'tabs.analysis': 'Analysis',
    'tabs.manual': 'Manual',
    'tabs.models': 'Templates',
    'tabs.preview': 'Preview',
    'toolbar.export': 'Export',
    'export.json': 'Export JSON',
    'pdf.structured': 'Generate structured PDF',
    'pdf.capture': 'Generate capture PDF',
    'pdf.executive': 'Generate executive PDF',
    'dropzone.hint': 'Drag and drop your .cmpolicy file here',
    'dropzone.clear': 'Clear',
    'import.success': 'File imported successfully',
    'toast.pdf.success': 'PDF generated',
    'toast.json.success': 'JSON exported',
    'pdf.title': 'PoC Report - Analysis Result',
    'footer.meta': 'Report PoC • v0.2',
    // added for Preview/Summary
    'summary.title': 'Summary',
    'summary.badge.ok': 'OK',
    'preview.header': 'Header',
    'preview.badge.title': 'Report',
    'preview.metaHint': 'Meta info persists locally',
    'preview.orgLabel': 'Organization',
  }
};

const I18nContext = createContext(null);

export function I18nProvider({ children, defaultLang = 'pt' }) {
  const [lang, setLang] = useState(defaultLang);
  const t = useMemo(() => (key) => messages[lang]?.[key] ?? key, [lang]);
  const api = useMemo(() => ({ lang, setLang, t }), [lang]);
  return (
    <I18nContext.Provider value={api}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}