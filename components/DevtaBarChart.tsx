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
  isAnimationActive?: boolean;
}

export const DevtaBarChart: React.FC<DevtaBarChartProps> = ({ data, title, color = "#8884d8", isAnimationActive = true }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-10 px-6">
        <h2 className="text-3xl font-cormorant font-bold italic text-primary tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Intensity</span>
        </div>
      </div>

      <div className="flex-1 min-h-[600px]">
        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 90 }}>
            <defs>
              <linearGradient id="colorDevta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0}
              height={100}
              tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
              stroke="#6B7280"
              tickLine={false}
              axisLine={false}
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
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Intensity']} 
            />
            <Bar 
              dataKey="percentage" 
              fill="url(#colorDevta)" 
              stroke={color}
              strokeWidth={1}
              name="Area %" 
              radius={[6, 6, 0, 0]}
              isAnimationActive={isAnimationActive}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="url(#colorDevta)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-6 px-6 text-[10px] font-medium text-gray-400 italic text-center w-full">
        * Celestial distribution mapping the macro-symmetry of spatial energy.
      </p>
    </div>
  );
};
