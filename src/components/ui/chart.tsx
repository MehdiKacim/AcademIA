"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: { color: [LIGHT_COLOR, DARK_COLOR] } }
const COLOR_PALETTE = {
  light: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    card: "0 0% 100%",
    "card-foreground": "222.2 84% 4.9%",
    popover: "0 0% 100%",
    "popover-foreground": "222.2 84% 4.9%",
    primary: "220 80% 50%",
    "primary-foreground": "210 40% 98%",
    secondary: "210 40% 96.1%",
    "secondary-foreground": "222.2 47.4% 11.2%",
    muted: "210 40% 96.1%",
    "muted-foreground": "215.4 16.3% 46.9%",
    accent: "210 40% 96.1%",
    "accent-foreground": "222.2 47.4% 11.2%",
    destructive: "0 84.2% 60.2%",
    "destructive-foreground": "210 40% 98%",
    border: "214.3 31.8% 91.4%",
    input: "214.3 31.8% 91.4%",
    ring: "222.2 84% 4.9%",
  },
  dark: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    card: "222.2 84% 4.9%",
    "card-foreground": "210 40% 98%",
    popover: "222.2 84% 4.9%",
    "popover-foreground": "210 40% 98%",
    primary: "200 90% 70%",
    "primary-foreground": "222.2 47.4% 11.2%",
    secondary: "217.2 32.6% 17.5%",
    "secondary-foreground": "210 40% 98%",
    muted: "217.2 32.6% 17.5%",
    "muted-foreground": "215 20.2% 65.1%",
    accent: "217.2 32.6% 17.5%",
    "accent-foreground": "210 40% 98%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "210 40% 98%",
    border: "217.2 32.6% 17.5%",
    input: "217.2 32.6% 17.5%",
    ring: "212.7 26.8% 83.9%",
  },
};

type ChartConfig = {
  [k: string]: {
    label?: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
  chartProps: ChartProps;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }
  return context;
}

type ChartProps = React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> & {
  config: ChartConfig;
  children?: React.ReactNode;
};

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, children, className, ...props }, ref) => {
    const bodyStyles = typeof window === "undefined" ? null : document.body.style;
    const mode = bodyStyles?.getPropertyValue("--mode") || "light";
    const primaryColor = `hsl(${COLOR_PALETTE[mode as keyof typeof COLOR_PALETTE].primary})`;

    return (
      <ChartContext.Provider value={{ config, chartProps: props }}>
        <div
          ref={ref}
          className={cn("h-[400px] w-full", className)}
          style={
            {
              "--color-primary": primaryColor,
            } as React.CSSProperties
          }
        >
          <RechartsPrimitive.ResponsiveContainer {...props}>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);

Chart.displayName = "Chart";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.TooltipProps<any, any> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideIndicator?: boolean;
      is(active: any): boolean;
    }
>(({ active, payload, className, hideIndicator = false, ...props }, ref) => {
  const { config } = useChart();

  if (active && payload && payload.length) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid overflow-hidden rounded-md border border-border bg-background px-3 py-1.5 text-sm shadow-md",
          className
        )}
        {...props}
      >
        {props.label && (
          <div className="mb-1 flex items-center pb-0.5 text-xs font-medium">
            {config[props.label as keyof typeof config]?.icon && (
              <config.label.icon className="mr-2 h-3 w-3" />
            )}
            <span className="text-muted-foreground">{props.label}</span>
          </div>
        )}
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => {
            const key = item.dataKey || item.name;
            if (!key) return null;
            const itemConfig = config[key as keyof typeof config];
            return (
              <div
                key={item.dataKey || item.name || index}
                className="flex items-center justify-between gap-4"
              >
                {itemConfig?.icon && (
                  <itemConfig.icon
                    className={cn(
                      "h-3 w-3",
                      item.color && `text-[${item.color}]`
                    )}
                  />
                )}
                <span className="text-muted-foreground">
                  {itemConfig?.label || item.name}
                </span>
                <span className="font-medium text-foreground">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
});

ChartTooltip.displayName = "ChartTooltip";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.LegendProps & React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const { config } = useChart();

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-2", className)} {...props}>
      <RechartsPrimitive.Legend
        ref={ref as React.Ref<typeof RechartsPrimitive.Legend>} // Cast ref to correct type
        {...props}
      />
    </div>
  );
});

ChartLegend.displayName = "ChartLegend";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  RechartsPrimitive.DefaultLegendContentProps &
    React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const { config } = useChart();

  return (
    <div ref={ref} className={cn("flex flex-wrap gap-2", className)} {...props}>
      {props.payload?.map((item: any) => {
        const key = item.dataKey || item.name;
        if (!key) return null;
        const itemConfig = config[key as keyof typeof config];
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-1.5",
              props.inactiveColor && item.inactive && "text-muted-foreground"
            )}
          >
            {itemConfig?.icon && (
              <itemConfig.icon
                className={cn(
                  "h-3 w-3",
                  item.color && `text-[${item.color}]`
                )}
              />
            )}
            <span className="text-sm text-foreground">
              {itemConfig?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});

ChartLegendContent.displayName = "ChartLegendContent";

export {
  Chart,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig, // Export as type
};