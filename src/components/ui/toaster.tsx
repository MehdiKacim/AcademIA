"use client"

import { Toaster as ToasterPrimitive } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  return (
    <ToasterPrimitive
      className={cn("toaster group rounded-card-lg shadow-card-shadow")} // Applique le nouveau rayon de bordure et l'ombre
    />
  )
}