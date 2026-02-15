import Image from 'next/image';

type LogoProps = {
  size?: number;
  /**
   * Use the correct SVG variant depending on background color.
   * - default: main brand mark (recommended for light backgrounds)
   * - black: dark-only mark (e.g. printing / very light backgrounds)
   * - white: for dark backgrounds (e.g. admin sidebar)
   */
  variant?: 'default' | 'black' | 'white';
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

const srcByVariant: Record<NonNullable<LogoProps['variant']>, string> = {
  default: '/brand/martillo_icon.svg',
  black: '/brand/martillo_icon_black.svg',
  white: '/brand/martillo_icon_white.svg',
};

export function Logo({
  size = 48,
  variant = 'default',
  showWordmark = true,
  className,
  wordmarkClassName,
}: LogoProps) {
  const wordmarkClass =
    wordmarkClassName ?? (variant === 'white' ? 'text-brand-offWhite' : 'text-foreground');

  return (
    <div className={`inline-flex items-center gap-3 ${className ?? ''}`.trim()}>
      <Image src={srcByVariant[variant]} alt="Martillo" width={size} height={size} priority />
      {showWordmark ? (
        <span className={`text-xl font-semibold ${wordmarkClass}`.trim()}>Martillo</span>
      ) : null}
    </div>
  );
}
