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
          className={cn("fixed inset-0 z-[997] flex flex-col", className)} // Z-index ajusté à 997 (au-dessus de la barre de navigation inférieure)
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Overlay to block interaction with background content - REMOVED for a less modal-like appearance */}
          {/* <motion.div
            className={cn("absolute inset-0 bg-black/50 z-[997]", overlayClassName)} // Overlay, behind content (999) but above bottom nav (996)
            onClick={onClose} // Close drawer when clicking on overlay
          /> */}

          {/* Drawer Content */}
          <motion.div
            className={cn(
              "fixed left-0 right-0 w-full bg-background rounded-t-lg shadow-lg flex flex-col overflow-hidden rounded-android-tile z-[998]", // Z-index ajusté à 998 (au-dessus de l'overlay du tiroir)
              "top-0 bottom-[68px] h-auto", // Définit le haut à 0px (tout en haut de l'écran) et le bas à 68px (au-dessus de la barre de navigation inférieure), et laisse la hauteur s'ajuster.
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