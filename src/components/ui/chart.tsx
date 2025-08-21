import * as React from "react";
import * as RechartsPrimitive from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartProps,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

// Layout

const Chart = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & ChartProps
>(({ className, ...props }, ref) => (
  <ChartContainer
    ref={ref}
    className={cn("flex aspect-video justify-center text-foreground", className)}
    {...props}
  />
));
Chart.displayName = "Chart";

// Recharts

const Recharts = {
  ...RechartsPrimitive,
};

export {
  Chart,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  Recharts,
};