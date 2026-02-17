// frontend/src/components/StatsChart.tsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Typography } from 'antd';
import { DailyStat } from '../api/stats';

const { Title } = Typography;

interface StatsChartProps {
    data: DailyStat[];
    title?: string;
}

const StatsChart: React.FC<StatsChartProps> = ({ data, title = 'Новые пользователи' }) => {
    return (
        <Card bordered={false} className="glass-card" style={{ height: '100%' }}>
            <Title level={4} style={{ marginBottom: 24 }}>{title}</Title>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20, // Tighten left margin
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 30, 35, 0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                            labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Количество"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default StatsChart;
