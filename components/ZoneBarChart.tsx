// components/ZoneBarChart.tsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ZoneGraphData = {
  zone: string;
  areaPercent: number;
  boundaryPercent: number;
};

interface ZoneBarChartProps {
  data: ZoneGraphData[];
  chartType: "area" | "boundary";
  title: string;
}

const ZONES_ORDER = [
  "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW", "N",
];


export const ZoneBarChart: React.FC<ZoneBarChartProps> = ({ data, chartType, title }) => {
    const sortedData = [...data].sort((a, b) => ZONES_ORDER.indexOf(a.zone) - ZONES_ORDER.indexOf(b.zone));
  const dataKey = chartType === "area" ? "areaPercent" : "boundaryPercent";
  const yAxisLabel = chartType === "area" ? "Area %" : "Boundary %";
  const barColor = chartType === "area" ? "#82ca9d" : "#8884d8";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
          <XAxis dataKey="zone" stroke="#333333" />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft", fill: '#333333' }} 
            stroke="#333333"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cccccc' }}
            itemStyle={{ color: '#000000' }}
            formatter={(value: any) => [Number(value).toFixed(2), yAxisLabel]} 
          />
          <Legend />
          <Bar dataKey={dataKey} fill={barColor} name={yAxisLabel} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
