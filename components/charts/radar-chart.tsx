import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Polygon } from "react-native-svg";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface RadarDataPoint {
  label: string;
  value: number;
  percent: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  rings?: number;
}

interface Point {
  x: number;
  y: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
): Point {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export const RadarChart = memo(function RadarChart({
  data,
  size = 280,
  rings = 5,
}: RadarChartProps) {
  const theme = useColorScheme() ?? "light";
  const palette = Colors[theme];
  const center = size / 2;
  const chartRadius = center - 26;
  const count = data.length;

  const axisPoints = useMemo(() => {
    if (count === 0) return [] as Point[];
    return data.map((_, index) => {
      const angle = (360 / count) * index;
      return polarToCartesian(center, center, chartRadius, angle);
    });
  }, [count, center, chartRadius, data]);

  const radarPoints = useMemo(() => {
    if (count === 0) return [] as Point[];
    return data.map((datum, index) => {
      const angle = (360 / count) * index;
      const radius = chartRadius * (clampPercent(datum.percent) / 100);
      return polarToCartesian(center, center, radius, angle);
    });
  }, [count, center, chartRadius, data]);

  const ringPolygons = useMemo(() => {
    if (count < 3) return [] as Point[][];
    return Array.from({ length: rings }, (_, ringIndex) => {
      const ratio = (ringIndex + 1) / rings;
      return data.map((_, index) => {
        const angle = (360 / count) * index;
        return polarToCartesian(center, center, chartRadius * ratio, angle);
      });
    });
  }, [center, chartRadius, count, data, rings]);

  if (count < 3) {
    return <View style={[styles.placeholder, { width: size, height: size }]} />;
  }

  return (
    <Svg width={size} height={size}>
      <G>
        {ringPolygons.map((polygonPoints, index) => (
          <Polygon
            key={`ring-${index}`}
            points={pointsToString(polygonPoints)}
            fill="none"
            stroke={palette.borderGlass}
            strokeWidth={1}
          />
        ))}

        {axisPoints.map((point, index) => (
          <Line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke={palette.borderGlass}
            strokeWidth={1}
          />
        ))}

        <Polygon
          points={pointsToString(radarPoints)}
          fill={
            theme === "dark"
              ? "rgba(125, 211, 252, 0.26)"
              : "rgba(125, 211, 252, 0.22)"
          }
          stroke={palette.primary}
          strokeWidth={2}
        />

        {radarPoints.map((point, index) => (
          <Circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r={3.8}
            fill={palette.primary}
            stroke={theme === "dark" ? "#0f1722" : "#ffffff"}
            strokeWidth={1}
          />
        ))}
      </G>
    </Svg>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 999,
    opacity: 0.2,
  },
});
