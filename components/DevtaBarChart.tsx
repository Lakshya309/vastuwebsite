// components/DevtaBarChart.tsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DevtaArea {
  name: string;
  area: number;
  percentage: number;
}

interface DevtaBarChartProps {
  data: DevtaArea[];
  title: string;
  color?: string;
}

export const DevtaBarChart: React.FC<DevtaBarChartProps> = ({ data, title, color = "#8884d8" }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            interval={0}
            height={80}
            tick={{ fontSize: 10 }}
          />
          <YAxis label={{ value: 'Area %', angle: -90, position: "insideLeft" }} />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Area Percentage']} 
          />
          <Bar dataKey="percentage" fill={color} name="Area %">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color} opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
