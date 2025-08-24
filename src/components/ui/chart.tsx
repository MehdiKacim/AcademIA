"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { key: string; color?: string; icon?: ConstructorOf<Icon> }
type ChartConfig = {
  [k: string]: {
    label?: string;
    icon?: React.ElementType;
  } & (
    | {
        color?: string;
        theme?: never;
      }
    | {
        color?: never;
        theme?: string;
      }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

type ChartContainerProps = React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> & {
  config: ChartConfig;
  children: React.ReactNode;
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    const newChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === ChartTooltip) {
        return React.cloneElement(child, {
          content: React.forwardRef<
            HTMLDivElement,
            {
              active?: boolean;
              payload?: Array<Record<string, any>>;
              label?: string;
            }
          >(({ active, payload, label }, ref) => {
            if (active && payload && payload.length) {
              return (
                <div
                  ref={ref}
                  className="rounded-md border bg-card p-2 text-sm shadow-md"
                >
                  {label && (
                    <div className="grid gap-1">
                      <div className="block text-muted-foreground">{label}</div>
                    </div>
                  )}
                  <div className="grid gap-1">
                    {payload.map((item: Record<string, any>) => {
                      const key = item.dataKey as string;
                      const configItem = config[key];
                      if (!configItem) return null;

                      return (
                        <div
                          key={item.dataKey}
                          className="flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-2">
                            {configItem.icon && (
                              <configItem.icon
                                className={cn(
                                  "h-3 w-3",
                                  configItem.color
                                    ? `text-${configItem.color}`
                                    : configItem.theme
                                )}
                              />
                            )}
                            <span className="text-muted-foreground">
                              {configItem.label || item.dataKey}
                            </span>
                          </div>
                          <span className="font-medium">
                            {item.value?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          }),
        });
      }
      return child;
    });

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn("h-80 w-full", className)}
        >
          <RechartsPrimitive.ResponsiveContainer {...props}>
            {newChildren}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);

ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.LegendProps
>(({ className, ...props }, ref) => (
  <RechartsPrimitive.Legend
    ref={ref as React.Ref<RechartsPrimitive.Legend>} // Cast ref to correct type
    wrapperStyle={{ paddingTop: 10 }}
    className={cn("!flex flex-wrap justify-center gap-2", className)}
    content={({ payload }) => {
      const { config } = useChart();

      if (!payload || payload.length === 0) return null;

      return (
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-2",
            className
          )}
        >
          {payload.map((item: Record<string, any>) => {
            const key = item.dataKey as string;
            const configItem = config[key];

            if (!configItem) return null;

            return (
              <div
                key={key}
                className="flex items-center gap-1"
              >
                {configItem.icon && (
                  <configItem.icon
                    className={cn(
                      "h-3 w-3",
                      configItem.color
                        ? `text-${configItem.color}`
                        : configItem.theme
                    )}
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {configItem.label || item.value}
                </span>
              </div>
            );
          })}
        </div>
      );
    }}
    {...props}
  />
));
ChartLegend.displayName = "ChartLegend";

export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  type ChartConfig,
};