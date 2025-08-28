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
          className={cn("fixed inset-0 z-[998] flex flex-col", className)} // Main container, higher than bottom nav (996)
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
              "fixed left-0 right-0 w-full bg-background rounded-t-lg shadow-lg flex flex-col overflow-hidden rounded-android-tile z-[1]", // Changed z-index to 1
              "bottom-[68px] h-[calc(100vh-136px)]", // Adjusted bottom and height to be above the 68px bottom nav and below the 68px top header
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