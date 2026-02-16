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
        <Card bordered={false} style={{ height: '100%' }}>
            <Title level={4}>{title}</Title>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="date" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f1f1f', border: 'none', borderRadius: 6 }}
                            labelStyle={{ color: '#ccc' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#1890ff" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default StatsChart;
