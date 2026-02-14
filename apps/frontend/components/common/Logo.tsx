import Image from 'next/image';

type LogoProps = {
  size?: number;
};

export function Logo({ size = 48 }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <Image src="/brand/martillo_icon.svg" alt="Martillo" width={size} height={size} priority />
      <span className="text-xl font-semibold text-foreground">Martillo</span>
    </div>
  );
}
