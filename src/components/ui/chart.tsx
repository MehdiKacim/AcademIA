"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: { color: COLORS, ... } }
type ChartConfig = {
  [k: string]: {
    label?: string
    color?: string
    icon?: React.ComponentType
  }
}

type ChartContextProps = {
  config: ChartConfig
  stack?: boolean
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <Chart />")
  }
  return context
}

interface ChartProps extends React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> {
  config: ChartConfig
  stack?: boolean
  className?: string
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, stack, className, children, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ config, stack }}>
        <div
          ref={ref}
          className={cn("h-[400px] w-full", className)}
        >
          <RechartsPrimitive.ResponsiveContainer {...props}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  }
)

Chart.displayName = "Chart"

const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipContentProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentPropsWithoutRef<typeof ChartTooltip> & {
    hideIndicator?: boolean
    hideLabel?: boolean
    formatter?: (
      value: number | string,
      name: string,
      props: RechartsPrimitive.Payload<any, any>,
      index: number,
      active: boolean
    ) => React.ReactNode
    className?: string
  }

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, className, hideIndicator = false, hideLabel = false, formatter, ...props }, ref) => {
  const { config } = useChart()

  if (!active || !payload || !payload.length) {
    return null
  }

  const defaultFormatter = (value: any, name: string) => {
    const item = config[name]
    if (!item) {
      return value
    }
    return (
      <span className="flex flex-col">
        <span className="text-muted-foreground">{item.label || name}</span>
        <span className="font-medium text-foreground">{value}</span>
      </span>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[130px] items-center text-xs border border-border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && (
        <div className="border-b border-border pb-1 text-left font-semibold">
          {props.label}
        </div>
      )}
      <div className="pt-1 grid gap-2">
        {payload.map((item: RechartsPrimitive.Payload<any, any>, index: number) => {
          if (item.dataKey && item.value === undefined) return null; // Skip if value is undefined

          const color = config[item.dataKey as string]?.color || item.color;
          return (
            <div
              key={item.dataKey}
              className={cn("flex items-center justify-between gap-4 py-0.5")}
            >
              <div className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className={cn("h-3 w-3 shrink-0 rounded-full", color && `bg-${color}`)}
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-muted-foreground">
                  {config[item.dataKey as string]?.label || item.name}
                </span>
              </div>
              <span className="font-medium text-foreground">
                {formatter
                  ? formatter(item.value, item.name, item, index, active)
                  : defaultFormatter(item.value, item.name)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Legend>
>(({ className, ...props }, ref) => (
  <RechartsPrimitive.Legend
    ref={ref as React.Ref<RechartsPrimitive.Legend>} // Cast ref to correct type
    content={<ChartLegendContent />}
    className={cn("!h-auto !w-full", className)}
    {...props}
  />
))
ChartLegend.displayName = "ChartLegend"

type ChartLegendContentProps = React.ComponentProps<typeof RechartsPrimitive.DefaultLegendContent> & {
  className?: string
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ className, ...props }, ref) => {
  const { config } = useChart()

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-4",
        className
      )}
      {...props}
    >
      {props.payload?.map((item: RechartsPrimitive.Payload<any, any>) => {
        if (item.inactive) return null

        const activeConfig = config[item.dataKey as string]

        return (
          <div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5",
              props.itemClasses
            )}
          >
            <span
              className={cn(
                "h-3 w-3 shrink-0 rounded-full",
                item.color && `bg-[${item.color}]`,
                activeConfig?.color && `bg-${activeConfig.color}`
              )}
              style={{
                backgroundColor: item.color || activeConfig?.color,
              }}
            />
            {activeConfig?.icon ? (
              <activeConfig.icon
                className="h-3 w-3"
                style={{
                  fill: item.color || activeConfig?.color,
                }}
              />
            ) : null}
            <span className="text-xs text-muted-foreground">
              {activeConfig?.label || item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  Chart,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig, // Export as type
}