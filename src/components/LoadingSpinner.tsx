import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

const LoadingSpinner = ({ className, iconClassName, textClassName, showText = false }: LoadingSpinnerProps) => {
  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
    >
      <Logo iconClassName={cn("w-6 h-6", iconClassName)} showText={showText} textClassName={textClassName} />
    </motion.div>
  );
};

export default LoadingSpinner;