import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Latex } from './Latex';

export function Formula({ title, math, emphasis = false }: { title?: string; math: string; emphasis?: boolean }) {
  return <div className={`formula ${emphasis ? 'formula-emphasis' : ''}`}>
    {title && <p className="formula-label">{title}</p>}
    <Latex math={math} block />
  </div>;
}

export function AcademicStep({ number, title, children, expanded, initialOpen = false }: {
  number: number; title: string; children: React.ReactNode; expanded?: boolean; initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => { if (expanded !== undefined) setOpen(expanded); }, [expanded]);
  return <details className="academic-step" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary><span className="step-number">{number}</span><h3>{title}</h3><ChevronDown size={18} className="disclosure-icon" /></summary>
    <div className="step-content">{children}</div>
  </details>;
}
