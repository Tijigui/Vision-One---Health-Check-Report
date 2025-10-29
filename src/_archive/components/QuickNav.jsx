import React from 'react';
import { useActiveSection } from '../../hooks/useActiveSection.js';

export default function QuickNav({ sections }) {
  const activeId = useActiveSection(sections.map(s => s.id));
  return (
    <nav className="quick-nav">
      {sections.map(section => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={activeId === section.id ? 'active' : ''}
          onClick={() => { /* feedback imediato via classe */ }}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}