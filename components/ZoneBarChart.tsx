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
  isAnimationActive?: boolean;
}

const ZONES_ORDER = [
  "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW", "N",
];


export const ZoneBarChart: React.FC<ZoneBarChartProps> = ({ data, chartType, title, isAnimationActive = true }) => {
  const sortedData = [...data].sort((a, b) => ZONES_ORDER.indexOf(a.zone) - ZONES_ORDER.indexOf(b.zone));
  const dataKey = chartType === "area" ? "areaPercent" : "boundaryPercent";
  const yAxisLabel = chartType === "area" ? "Area %" : "Boundary %";
  
  // Premium Colors
  const barColor = chartType === "area" ? "url(#colorArea)" : "url(#colorBoundary)";
  const strokeColor = chartType === "area" ? "#10B981" : "#6366F1";

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-10 px-6">
        <h2 className="text-3xl font-cormorant font-bold italic text-primary tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${chartType === "area" ? "bg-emerald-500" : "bg-indigo-500"}`} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{yAxisLabel}</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[500px]">
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#34D399" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorBoundary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="zone" 
              stroke="#6B7280" 
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ 
                borderRadius: '20px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                padding: '15px 20px'
              }}
              labelStyle={{ 
                fontFamily: 'Cormorant Garamond', 
                fontWeight: 'bold', 
                color: '#13547a',
                fontSize: '18px',
                marginBottom: '5px'
              }}
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, yAxisLabel]} 
            />
            <Bar 
              dataKey={dataKey} 
              fill={barColor} 
              stroke={strokeColor}
              strokeWidth={1}
              name={yAxisLabel} 
              radius={[6, 6, 0, 0]}
              isAnimationActive={isAnimationActive} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-6 px-6 text-[10px] font-medium text-gray-400 italic text-center w-full">
        * Statistical distribution across the 16 cardinal and ordinal directions.
      </p>
    </div>
  );
};

