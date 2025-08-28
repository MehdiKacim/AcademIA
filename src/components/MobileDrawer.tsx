import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSwipeable } from 'react-swipeable';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // For the main container
  overlayClassName?: string; // For the overlay div
  contentClassName?: string; // For the actual drawer content div
}

const MobileDrawer = ({ isOpen, onClose, children, className, overlayClassName, contentClassName }: MobileDrawerProps) => {
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (isOpen) {
        onClose();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = {
    hidden: { y: '100%' },
    visible: { y: '0%' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn("fixed inset-0 z-[997] flex flex-col", className)} // Z-index ajusté à 997
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Drawer Content */}
          <motion.div
            className={cn(
              "fixed left-0 right-0 w-full bg-background rounded-t-3xl shadow-lg flex flex-col overflow-hidden z-[997]", // Changed rounded-t-lg to rounded-t-3xl
              "top-[40px] bottom-[68px]", // Définit le haut à 40px (laissant un espace en haut) et le bas à 68px (au-dessus de la barre de navigation inférieure)
              "backdrop-blur-lg bg-background/80", // Added blur and transparency for immersive design
              contentClassName
            )}
            variants={contentVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
            {...swipeHandlers} // Apply swipe handlers to the content area
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;