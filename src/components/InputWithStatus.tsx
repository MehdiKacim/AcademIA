import React from 'react';
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion"; // Import motion

interface InputWithStatusProps extends React.ComponentPropsWithoutRef<typeof Input> {
  status: 'idle' | 'checking' | 'available' | 'taken';
  errorMessage?: string; // To display XCircle if status is 'taken' and there's an error
}

const InputWithStatus = React.forwardRef<HTMLInputElement, InputWithStatusProps>(
  ({ status, errorMessage, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input ref={ref} className={cn("pr-10", className)} {...props} />
        <AnimatePresence>
          {status === 'checking' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <LoadingSpinner iconClassName="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
          {status === 'available' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
          {status === 'taken' && errorMessage && ( // Only show XCircle if there's an error message
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XCircle className="h-5 w-5 text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

InputWithStatus.displayName = "InputWithStatus";

export default InputWithStatus;