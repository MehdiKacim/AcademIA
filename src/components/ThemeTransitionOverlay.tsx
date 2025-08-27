import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Logo from './Logo'; // Import the Logo component

interface ThemeTransitionOverlayProps {
  isOpen: boolean;
  targetThemeName: string; // Ex: "Clair", "Sombre", "Violet Sombre"
}

const ThemeTransitionOverlay = ({ isOpen, targetThemeName }: ThemeTransitionOverlayProps) => {
  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.05, // Stagger each letter
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
            "bg-background/80 backdrop-blur-lg" // Ajout du flou et du fond semi-transparent
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }} // Durée de l'opacité de la superposition
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="mb-8"
          >
            <Logo iconClassName="w-24 h-24" showText={false} /> {/* Ajout du logo */}
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan"
            variants={textVariants}
            initial="hidden"
            animate="visible"
            exit="hidden" // Assure que le texte disparaît aussi
          >
            {targetThemeName.split("").map((char, index) => (
              <motion.span key={index} variants={letterVariants}>
                {char}
              </motion.span>
            ))}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeTransitionOverlay;