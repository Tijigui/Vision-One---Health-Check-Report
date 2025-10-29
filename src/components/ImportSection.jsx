import React from 'react';

export default function ImportSection({ t, drop, policy, policyText, setPolicy, setPolicyText, onFiles }) {
  return (
    <section id="import" className="card">
      <h2>{t('tabs.import')}</h2>
      <div ref={drop.ref} className={`dropzone ${drop.dragOver ? 'dragover' : ''}`}>
        {t('dropzone.hint')}
        <div className="actions">
          <input
            aria-label="Escolher arquivo"
            type="file"
            accept=".cmpolicy,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              // Delegar parsing e feedback ao handler externo
              onFiles([f]);
            }}
          />
          <button className="btn" onClick={() => { setPolicy(null); setPolicyText(''); }}>
            {t('dropzone.clear')}
          </button>
        </div>
      </div>
      {!policy && (
        <div style={{ marginTop: 12 }}>
          <div className="skeleton text" />
          <div className="skeleton block" />
        </div>
      )}
      {policy && (
        <div className="preview-block">
          <div className="preview-header">
            <strong>{t('summary.title')}</strong>
            <span className="badge">{t('summary.badge.ok')}</span>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {policyText.slice(0, 800)}
            {policyText.length > 800 ? '...' : ''}
          </pre>
        </div>
      )}
    </section>
  );
}