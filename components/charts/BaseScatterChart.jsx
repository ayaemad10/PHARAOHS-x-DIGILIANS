"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
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

export default function BaseScatterChart({
  data,
  xKey,
  yKey,
  zKey,
  caption,
  xLabel,
  yLabel,
  name = "Points",
  height = 240,
  margin = DEFAULT_MARGIN,
  color = "fx-brand",
  className = "",
  captionLabel = "About this chart",
}) {
  const theme = useChartTheme();
  const fill = theme[color] ?? theme["fx-brand"];

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="fx-plot-bg overflow-hidden rounded-[var(--radius-hud)] border border-line">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={margin}>
            <CartesianGrid {...grid(theme)} />
            <XAxis
              type="number"
              dataKey={xKey}
              name={xLabel ?? xKey}
              tick={axisTick(theme)}
              axisLine={axisLine(theme)}
              tickLine={false}
              label={xLabel ? xAxisLabel(theme, xLabel) : undefined}
              domain={["dataMin", "dataMax"]}
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name={yLabel ?? yKey}
              tick={axisTick(theme)}
              axisLine={axisLine(theme)}
              tickLine={false}
              width={46}
              label={yLabel ? yAxisLabel(theme, yLabel) : undefined}
            />
            <Tooltip
              cursor={{ stroke: theme["fx-hairline-lit"], strokeDasharray: "2 2" }}
              contentStyle={tooltipStyle(theme)}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ ...legendStyle(theme), paddingTop: 0, paddingBottom: 6 }} iconSize={8} />
            {/*
             * A thin lit ring around each point keeps overlapping records legible at small
             * marker sizes, which matters because several experiments share near-identical
             * gravity and oxygen values.
             */}
            <Scatter
              name={name}
              data={data}
              fill={fill}
              fillOpacity={0.75}
              stroke={theme["fx-ink"]}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {caption ? (
        <PrototypeNotice compact label={captionLabel} message={caption} />
      ) : null}
    </div>
  );
}
