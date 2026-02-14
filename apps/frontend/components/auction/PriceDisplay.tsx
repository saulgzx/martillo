'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  amount: number;
  label?: string;
  size?: 'default' | 'lg' | 'xl';
};

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

export function PriceDisplay({ amount, label, size = 'default' }: Props) {
  const [prevAmount, setPrevAmount] = useState(amount);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (amount !== prevAmount) {
      setFlash(true);
      setPrevAmount(amount);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [amount, prevAmount]);

  const sizeClasses = {
    default: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-6xl',
  };

  return (
    <div className="text-center">
      {label && <p className="mb-1 text-sm text-muted-foreground">{label}</p>}
      <AnimatePresence mode="wait">
        <motion.span
          key={amount}
          initial={{ scale: 1.15, color: '#22c55e' }}
          animate={{ scale: 1, color: 'var(--foreground-raw, #0F172A)' }}
          transition={{ duration: 0.5 }}
          className={`${sizeClasses[size]} font-bold tabular-nums ${flash ? 'text-green-500' : 'text-foreground'}`}
        >
          {formatCLP(amount)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
