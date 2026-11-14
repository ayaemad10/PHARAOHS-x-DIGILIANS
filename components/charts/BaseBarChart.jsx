"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useChartTheme from "./useChartTheme";
import {
  xAxisLabel,
  yAxisLabel,
  axisLine,
  axisTick,
  grid,
  legendStyle,
  tooltipStyle,
} from "./chartPrimitives";
import PrototypeNotice from "@/components/shared/PrototypeNotice";

const DEFAULT_MARGIN = { top: 10, right: 14, bottom: 30, left: 18 };

export default function BaseBarChart({
  data,
  xKey,
  series,
  caption,
  yLabel,
  xLabel,
  height = 240,
  margin = DEFAULT_MARGIN,
  className = "",
  captionLabel = "About this chart",
}) {
  const theme = useChartTheme();

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      {/* Inset one step below the panel so grid lines stay legible against the plot field. */}
      <div className="fx-plot-bg overflow-hidden rounded-[var(--radius-hud)] border border-line">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={margin}>
            <CartesianGrid {...grid(theme)} />
            <XAxis
              dataKey={xKey}
              tick={axisTick(theme)}
              axisLine={axisLine(theme)}
              tickLine={false}
              label={xLabel ? xAxisLabel(theme, xLabel) : undefined}
            />
            <YAxis
              tick={axisTick(theme)}
              axisLine={axisLine(theme)}
              tickLine={false}
              width={46}
              label={yLabel ? yAxisLabel(theme, yLabel) : undefined}
            />
            <Tooltip contentStyle={tooltipStyle(theme)} cursor={{ fill: theme["fx-hairline"] }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ ...legendStyle(theme), paddingTop: 0, paddingBottom: 6 }} iconSize={8} />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                fill={theme[item.color] ?? theme["fx-brand"]}
                // Square tops read as plotted bars; rounded ones read as a rounded-corner UI card.
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {caption ? (
        <PrototypeNotice compact label={captionLabel} message={caption} />
      ) : null}
    </div>
  );
}
