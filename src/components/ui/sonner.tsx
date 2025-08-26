"use client"

import { Toaster as SonnerToaster } from "sonner"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      className={cn("toaster group rounded-card-lg shadow-card-shadow", props.className)} // Applique le nouveau rayon de bordure et l'ombre
      toastOptions={{
        classNames: {
          toast:
            "toast group group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }