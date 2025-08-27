import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ThemeTransitionOverlayProps {
  isOpen: boolean;
  targetThemeName: string; // Ex: "Clair", "Sombre", "Violet Sombre"
}

const ThemeTransitionOverlay = ({ isOpen, targetThemeName }: ThemeTransitionOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center",
            "bg-background" // Ceci prendra la couleur de fond du *nouveau* thème
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeInOut" }}
          >
            {targetThemeName}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeTransitionOverlay;