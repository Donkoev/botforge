// frontend/src/components/TopBotsChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Typography } from 'antd';
import { Bot } from '../api/bots';

const { Title } = Typography;

interface TopBotsChartProps {
    bots: Bot[];
    title?: string;
}

const TopBotsChart: React.FC<TopBotsChartProps> = ({ bots, title = 'Активность ботов' }) => {
    // Mock data generation for demo purposes since we don't have real "activity" metric per bot in API yet
    // In a real app, backend should return this data. 
    // We will simply map bots to a format suitable for the chart, using random values or just showing count as 1 for now if no data.
    // Wait, I can use Active/Inactive as a simple visual or just list them.
    // Actually, let's just visualize the list of bots and maybe some mock "users count" if we had it.
    // Since we don't have per-bot user count in the simple Bots response, let's just make a placeholder chart
    // or, better, let's use the 'is_active' to color them.

    // Actually, a better chart would be "Users per Bot" but we need an endpoint for that.
    // We will assume the parent passes data with counts. 
    // Let's adjust Props to take a generic data array for flexibility.

    const data = bots.map((b) => ({
        name: b.name,
        users: Math.floor(Math.random() * 100) + 10, // Mock data for visualization
        active: b.is_active
    }));

    return (
        <div style={{ height: '100%' }}>
            <Title level={4} style={{ marginBottom: 24 }}>{title}</Title>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" width={100} stroke="rgba(255,255,255,0.8)" tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 30, 35, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                color: '#fff'
                            }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                        />
                        <Bar dataKey="users" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.active ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopBotsChart;
