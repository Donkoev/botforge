// frontend/src/pages/StatsPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Select, message } from 'antd';
import { UserOutlined, ClockCircleOutlined, RiseOutlined } from '@ant-design/icons';
import StatsChart from '../components/StatsChart';
import TopBotsChart from '../components/TopBotsChart';
import { statsApi, StatsOverview, DailyStat } from '../api/stats';
import { botsApi, Bot } from '../api/bots';

const { Title } = Typography;

const StatsPage: React.FC = () => {
    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [bots, setBots] = useState<Bot[]>([]);
    const [days, setDays] = useState(30);

    const fetchData = React.useCallback(async () => {
        try {
            const [overviewData, dailyData, botsData] = await Promise.all([
                statsApi.getOverview(),
                statsApi.getDaily(days),
                botsApi.getAll()
            ]);
            setOverview(overviewData);
            setDailyStats(dailyData);
            setBots(botsData);
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки статистики');
        }
    }, [days]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>Статистика</Title>
                    <Typography.Text type="secondary">Аналитика по всем ботам</Typography.Text>
                </div>
                <Select
                    defaultValue={30}
                    style={{ width: 180 }}
                    onChange={val => setDays(val)}
                    size="large"
                >
                    <Select.Option value={7}>Последние 7 дней</Select.Option>
                    <Select.Option value={30}>Последние 30 дней</Select.Option>
                    <Select.Option value={90}>Последние 3 месяца</Select.Option>
                </Select>
            </div>

            {/* Overview Cards (Duplicate from Dashboard but maybe more detailed here?) */}
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Всего пользователей"
                            value={overview?.total_users}
                            prefix={<UserOutlined style={{ color: '#6366f1', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Новых сегодня"
                            value={overview?.new_today}
                            prefix={<ClockCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Рост за неделю"
                            value={overview?.new_week}
                            prefix={<RiseOutlined style={{ color: '#8b5cf6', fontSize: 20 }} />}
                            suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>польз.</span>}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={16}>
                    <div className="glass-card" style={{ padding: 24, height: '100%' }}>
                        <StatsChart data={dailyStats} title={`Динамика пользователей (${days} дней)`} />
                    </div>
                </Col>
                <Col xs={24} lg={8}>
                    <div className="glass-card" style={{ padding: 24, height: '100%' }}>
                        <TopBotsChart bots={bots} />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default StatsPage;
