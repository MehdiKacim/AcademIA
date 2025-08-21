import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils"; // Import cn

type ChartProps = React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> & {
  config: ChartConfig;
  children: React.ReactNode;
};

type ChartConfig = {
  [key: string]: {
    label: string;
    color?: string;
    icon?: React.ElementType;
  };
};

const ChartContext = React.createContext<
  | {
      config: ChartConfig;
      /**
       * @deprecated Use `config` instead.
       */
      chartProps: Omit<ChartProps, "config" | "children">; // Corrected type for chartProps
    }
  | null
>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <Chart />");
  }

  return context;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, children, className, ...props }, ref) => { // Added className to destructuring
    const newChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          // @ts-ignore
          config,
        });
      }
      return child;
    });

    return (
      <ChartContext.Provider value={{ config, chartProps: props }}>
        <div
          ref={ref}
          className={cn("flex aspect-video justify-center text-foreground", className)} // Used cn for className
          {...props}
        >
          <RechartsPrimitive.ResponsiveContainer {...props}>
            {newChildren}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideIndicator?: boolean;
  }
>(({ active, payload, className, hideIndicator = false, ...props }, ref) => { // Removed 'indicator' from destructuring as it's not a standard prop
  const { config } = useChart();

  if (active && payload && payload.length) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-md",
          className,
        )}
        {...props}
      >
        {props.label && (
          <div className="text-muted-foreground">{props.label}</div>
        )}
        <div className="grid gap-1">
          {payload.map((item, i) => {
            const key = item.dataKey as keyof typeof config;
            const indicatorColor = config[key]?.color || item.fill || item.stroke;

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex items-center justify-between gap-2",
                  // indicator && "recharts-tooltip-indicator", // Removed indicator prop usage
                )}
              >
                {/* {indicator && !hideIndicator && ( // Removed indicator prop usage */}
                {!hideIndicator && ( // Only check hideIndicator
                  <div
                    className={cn(
                      "recharts-tooltip-indicator-dot h-2 w-2 rounded-full",
                      indicatorColor && `bg-[${indicatorColor}]`,
                    )}
                  />
                )}
                {item.name && (
                  <div className="text-muted-foreground">
                    {config[key]?.label || item.name}
                  </div>
                )}
                {item.value && (
                  <div className="font-medium text-foreground">
                    {item.value.toLocaleString()}
                  </div>
                )}
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

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof ChartTooltip>
>((props, ref) => {
  return <ChartTooltip ref={ref} {...props} />;
});
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Legend> & {
    content?: React.ComponentType<
      React.ComponentProps<typeof RechartsPrimitive.Legend>
    >;
  }
>(({ content, ...props }, ref) => {
  const { config } = useChart();

  return (
    <RechartsPrimitive.Legend
      ref={ref as React.Ref<RechartsPrimitive.Legend>} // Cast ref to correct type
      {...props}
      content={content || <ChartLegendContent config={config} />}
    />
  );
});
ChartLegend.displayName = "ChartLegend";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Legend> & {
    config?: ChartConfig;
  }
>(({ className, ...props }, ref) => {
  const { config } = useChart();

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-4",
        className,
      )}
      {...props}
    >
      {props.payload?.map((item) => {
        const key = item.dataKey as keyof typeof config;
        const itemConfig = key ? config[key] : undefined;
        const indicatorColor = itemConfig?.color || item.color;

        return (
          <div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5",
              props.inactiveColor && item.inactive && `text-${props.inactiveColor}`,
            )}
          >
            {itemConfig?.icon ? (
              <itemConfig.icon />
            ) : (
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full",
                  indicatorColor && `bg-[${indicatorColor}]`,
                )}
              />
            )}
            {item.value && (
              <span className="text-sm text-muted-foreground">
                {itemConfig?.label || item.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
};