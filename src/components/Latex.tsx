import React, { useMemo } from 'react';
import katex from 'katex';

interface LatexProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: false,
      });
    } catch (err) {
      console.error('KaTeX render error:', err);
      return math;
    }
  }, [math, block]);

  return (
    <span
      className={`${block ? 'latex-block' : 'latex-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
