import * as React from 'react';
import { cn } from '@/lib/utils';

type TypographyElement = 'h1' | 'h2' | 'h3' | 'p' | 'span';

type TypographyProps<T extends TypographyElement> = {
  as?: T;
  className?: string;
} & React.ComponentPropsWithoutRef<T>;

export function Typography<T extends TypographyElement = 'p'>({
  as,
  className,
  ...props
}: TypographyProps<T>) {
  const Comp = as ?? 'p';
  return (
    <Comp
      className={cn(
        Comp === 'h1' && 'text-4xl font-bold tracking-tight',
        Comp === 'h2' && 'text-2xl font-semibold tracking-tight',
        Comp === 'h3' && 'text-xl font-semibold',
        Comp === 'p' && 'text-base leading-7',
        Comp === 'span' && 'text-sm',
        className,
      )}
      {...props}
    />
  );
}
