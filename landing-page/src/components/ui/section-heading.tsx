import type {ReactNode} from 'react';
import {cn} from '@/lib/cn';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-3',
        align === 'center' && 'mx-auto max-w-2xl text-center',
        className
      )}
    >
      {eyebrow ? <div>{eyebrow}</div> : null}
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="text-base text-slate-600 sm:text-lg">{description}</p> : null}
    </div>
  );
}
