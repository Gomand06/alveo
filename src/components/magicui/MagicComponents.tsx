import React, { useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/** Local adaptation of Magic UI's Magic Card.
 * Reference: https://magicui.design/docs/components/magic-card
 * Pointer-driven highlight without React state updates or an animation loop.
 */
export function MagicCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  return <div {...props} ref={ref} className={cn('magic-card', className)} onPointerMove={event => {
    if (event.pointerType === 'touch' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
    ref.current.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
  }}>
    <div className="magic-card-light" aria-hidden="true" />
    <div className="magic-card-content">{children}</div>
  </div>;
}
