import React, { useState } from 'react';

export default function Collapsible({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible">
      <button className="collapsible-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '▾' : '▸'} {title}
      </button>
      {open && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}