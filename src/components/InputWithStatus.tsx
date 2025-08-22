import React from 'react';
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputWithStatusProps extends React.ComponentPropsWithoutRef<typeof Input> {
  status: 'idle' | 'checking' | 'available' | 'taken';
  errorMessage?: string; // To display XCircle if status is 'taken' and there's an error
}

const InputWithStatus = React.forwardRef<HTMLInputElement, InputWithStatusProps>(
  ({ status, errorMessage, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input ref={ref} className={cn("pr-10", className)} {...props} />
        {status === 'checking' && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {status === 'available' && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        {status === 'taken' && errorMessage && ( // Only show XCircle if there's an error message
          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
        )}
      </div>
    );
  }
);

InputWithStatus.displayName = "InputWithStatus";

export default InputWithStatus;