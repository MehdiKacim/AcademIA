import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } '@/lib/utils';
import { useSwipeable } from 'react-swipeable';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // For the main overlay container
  contentClassName?: string; // For the actual drawer content panel
}

const MobileDrawer = ({ isOpen, onClose, children, className, contentClassName }: MobileDrawerProps) => {
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
    hidden: { y: '100%' }, // Start from bottom
    visible: { y: '0%' },  // Slide up
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(
            "fixed inset-x-0 top-0 bottom-[68px] z-[999] flex flex-col items-center justify-end", // Adjusted z-index to 999
            "bg-background/80 backdrop-blur-lg", // Blurred background
            className
          )}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose} // Close when clicking outside the drawer content
        >
          {/* Drawer Content Panel */}
          <motion.div
            className={cn(
              "relative w-full bg-background shadow-lg flex flex-col overflow-hidden",
              "rounded-t-card-lg", // Rounded top corners
              "h-full", // Now takes full height of its parent (which is already adjusted by bottom-[68px])
              contentClassName
            )}
            variants={contentVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the drawer content
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