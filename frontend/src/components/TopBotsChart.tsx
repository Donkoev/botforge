// frontend/src/components/TopBotsChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Typography } from 'antd';
import { Bot } from '../api/bots';

const { Title } = Typography;

interface TopBotsChartProps {
    bots: Bot[];
    title?: string;
}

const TopBotsChart: React.FC<TopBotsChartProps> = ({ bots, title = 'Статус ботов' }) => {
    const activeCount = bots.filter(b => b.is_active).length;
    const inactiveCount = bots.length - activeCount;

    const data = [
        { name: 'Активные', value: activeCount, color: '#10b981' },
        { name: 'Остановленные', value: inactiveCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div style={{ height: '100%' }}>
            <Title level={4} style={{ marginBottom: 24 }}>{title}</Title>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(30, 30, 35, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8,
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`${value} ботов`, '']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)' }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TopBotsChart;
