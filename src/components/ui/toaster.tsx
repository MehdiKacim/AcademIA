"use client"

import React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <React.Fragment>
      <ToastProvider>
        {/* Envelopper le résultat de .map() dans un Fragment pour que ToastProvider reçoive un seul enfant */}
        <React.Fragment>
          {toasts.map(function ({ id, title, description, action, ...props }) {
            return (
              <Toast key={id} {...props}>
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                {action}
                <ToastClose />
              </Toast>
            )
          })}
        </React.Fragment>
      </ToastProvider>
      <ToastViewport />
    </React.Fragment>
  )
}