/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Navigation hover states - ensure these dynamic classes are never purged
    'group-hover:text-orange-500',
    'group-hover:text-green-500',
    'group-hover:text-red-500',
    'group-hover:text-blue-500',
    'group-hover:text-amber-500',
    'group-hover:text-purple-500',
    // Active state classes
    'text-orange-500',
    'text-green-500',
    'text-red-500',
    'text-blue-500',
    'text-amber-500',
    'text-purple-500',
    // Background classes for active states
    'bg-orange-400/10',
    'bg-green-400/10',
    'bg-red-400/10',
    'bg-blue-400/10',
    'bg-amber-400/10',
    'bg-purple-400/10',
    // Border classes for active states
    'border-orange-400/50',
    'border-green-400/50',
    'border-red-400/50',
    'border-blue-400/50',
    'border-amber-400/50',
    'border-purple-400/50',
    // Notification badge classes
    'bg-red-500/20',
    'border-red-500/30',
    'text-red-400',
    // Button letter spacing
    'tracking-[-0.05em]',
    // Background theme CSS classes - CRITICAL: prevent Tailwind purging
    'war-room-classic-blue',
    'war-room-tactical-camo',
    'war-room-digital-camo',
    'war-room-dark-slate',
    'war-room-camo-overlay',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
        'semi-condensed': ['Barlow Semi Condensed', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Barlow Condensed', 'sans-serif'],
        body: ['Barlow', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
