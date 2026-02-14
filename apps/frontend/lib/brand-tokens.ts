export const brandTokens = {
  palette: {
    navyPrimary: '#1A3C5E',
    grayCarbon: '#64748B',
    blueMedium: '#3B82C4',
    blueLight: '#DBEAFE',
    textBlack: '#0F172A',
    offWhite: '#F8FAFC',
  },
  color: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    surface: 'hsl(var(--card))',
    surfaceForeground: 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',
    destructive: 'hsl(var(--destructive))',
    destructiveForeground: 'hsl(var(--destructive-foreground))',
    border: 'hsl(var(--border))',
    ring: 'hsl(var(--ring))',
  },
  radius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
  },
  spacing: {
    compact: '0.5rem',
    default: '1rem',
    comfortable: '1.5rem',
    section: '2.5rem',
  },
  shadow: {
    card: '0 2px 8px rgba(15, 23, 42, 0.08)',
    focus: '0 0 0 2px rgba(59, 130, 196, 0.35)',
  },
  typography: {
    bodyClass: 'font-sans',
    titleClass: 'font-semibold tracking-tight',
    labelClass: 'text-sm font-medium',
  },
} as const;

export type BrandTokens = typeof brandTokens;
