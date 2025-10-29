import React from 'react';
import { generateExecutivePdf } from '../services/pdf';

export default function PreviewSection({ t, meta, effectiveSummary, diagnosis, toast }) {
  return (
    <section id="preview" className="card">
      <h2>{t('tabs.preview')}</h2>
      <div id="section-preview" className="preview-grid">
        <div className="preview-block">
          <div className="preview-header">
            <strong>{t('preview.header')}</strong>
            <span className="chip">{t('preview.badge.title')}</span>
          </div>
          <p className="tooltip" data-title={t('preview.metaHint')}>
            {t('preview.orgLabel')}: {meta?.orgName || '-'}
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button
              className="btn"
              onClick={async () => {
                try {
                  const res = await generateExecutivePdf(effectiveSummary, diagnosis, meta);
                  toast(t('toast.pdf.success'), 'success');
                  if (res?.warnings?.length) {
                    toast('Um ou mais gráficos falharam ao gerar', 'warn');
                  }
                } catch (e) {
                  toast(String(e?.message || e), 'error');
                }
              }}
            >
              {t('pdf.executive')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}