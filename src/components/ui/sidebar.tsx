"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ResizablePanel } from "react-resizable-panels"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.ComponentPropsWithoutRef<"div"> {
  isCollapsed: boolean
  onCollapse: (collapsed: boolean) => void
  children: React.ReactNode
  direction?: "left" | "right"
  variant?: "default" | "floating" | "inset" | "offcanvas" | "icon"
  collapsible?: "default" | "offcanvas" | "icon"
  defaultCollapsedSize?: number
  collapsedSize?: number
  minSize?: number
  maxSize?: number
  id?: string
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      isCollapsed,
      onCollapse,
      children,
      direction = "left",
      variant = "default",
      collapsible = "default",
      defaultCollapsedSize = 0,
      collapsedSize = 0,
      minSize = 15,
      maxSize = 30,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const [isResizing, setIsResizing] = React.useState(false)
    const [isHovering, setIsHovering] = React.useState(false)

    const isOffcanvas = collapsible === "offcanvas"
    const isIcon = collapsible === "icon"

    const handleCollapse = () => {
      onCollapse(!isCollapsed)
    }

    const handleMouseEnter = () => {
      setIsHovering(true)
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    const isFloating = variant === "floating"
    const isInset = variant === "inset"

    const sidebarWidth = isIcon
      ? "var(--sidebar-width-icon)"
      : isCollapsed
        ? "var(--sidebar-width-collapsed)"
        : "var(--sidebar-width)"

    const sidebarWidthIcon = "var(--sidebar-width-icon)"

    return (
      <ResizablePanel
        id={id}
        ref={ref}
        defaultSize={isCollapsed ? defaultCollapsedSize : maxSize}
        collapsedSize={collapsedSize}
        minSize={minSize}
        maxSize={maxSize}
        collapsible={collapsible === "default"}
        onCollapse={onCollapse}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative flex h-svh flex-col border-r bg-background transition-[width] duration-300 ease-in-out",
          direction === "right" && "border-r-0 border-l",
          isCollapsed && "w-[var(--sidebar-width-collapsed)]",
          isFloating &&
            "absolute inset-y-0 z-50 m-2 h-[calc(100svh-theme(spacing.4))] rounded-card-lg shadow", // Applique le nouveau rayon de bordure et l'ombre
          isInset &&
            "m-2 h-[calc(100svh-theme(spacing.4))] rounded-card-lg shadow md:ml-0 md:rounded-bl-none md:rounded-tl-none", // Applique le nouveau rayon de bordure et l'ombre
          isOffcanvas &&
            "absolute inset-y-0 z-50 h-svh w-0 transition-[width] duration-300 ease-in-out data-[state=open]:w-[var(--sidebar-width)]",
          isIcon && "w-[var(--sidebar-width-icon)]",
          className
        )}
        data-collapsed={isCollapsed}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={direction}
        {...props}
      >
        {/* Toggle Button */}
        {collapsible === "default" && (
          <Button
            onClick={handleCollapse}
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full",
              direction === "left" ? "right-[-16px]" : "left-[-16px]",
              isCollapsed && "opacity-0 group-hover:opacity-100",
              isResizing && "opacity-0",
              isFloating && "hidden",
              isInset && "md:hidden"
            )}
          >
            {direction === "left" ? (
              isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )
            ) : isCollapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Offcanvas Close Button */}
        {isOffcanvas && (
          <Button
            onClick={handleCollapse}
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-4 rounded-full",
              direction === "left" ? "right-4" : "left-4",
              "opacity-0 group-data-[state=open]:opacity-100"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Sidebar Content */}
        <ScrollArea className="h-full w-full">
          <div
            className={cn(
              "flex h-full flex-col",
              isIcon && "items-center p-2",
              isOffcanvas && "group-data-[collapsible=offcanvas]:w-0"
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </ResizablePanel>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar }