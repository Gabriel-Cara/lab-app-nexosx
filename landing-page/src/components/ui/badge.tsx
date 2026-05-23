import type {ReactNode} from 'react';
import {cn} from '@/lib/cn';

export default function Badge({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur',
        className
      )}
    >
      {children}
    </span>
  );
}
