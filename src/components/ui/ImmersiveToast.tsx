import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImmersiveToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  action?: {
    label: string;
    onClick: () => void;
  };
  Icon?: LucideIcon; // Optional custom icon
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  loading: Loader2,
};

const ImmersiveToast = ({ title, message, type, action, Icon }: ImmersiveToastProps) => {
  const CurrentIcon = Icon || iconMap[type];
  const isLoader = type === 'loading';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg shadow-lg border",
        "w-full max-w-md md:max-w-lg lg:max-w-xl", // Responsive width
        type === 'success' && "bg-success/90 text-success-foreground border-success",
        type === 'error' && "bg-destructive/90 text-destructive-foreground border-destructive",
        type === 'info' && "bg-primary/90 text-primary-foreground border-primary",
        type === 'loading' && "bg-muted/90 text-muted-foreground border-muted",
        "backdrop-blur-md" // Add blur for immersive effect
      )}
    >
      <div className="flex-shrink-0">
        {isLoader ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <CurrentIcon className="h-6 w-6" />
        )}
      </div>
      <div className="flex-grow">
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-sm">{message}</p>
        {action && (
          <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-2">
            {action.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ImmersiveToast;