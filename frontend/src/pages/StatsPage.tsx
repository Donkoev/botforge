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

    const fetchData = async () => {
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
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Статистика</Title>
                <Select defaultValue={30} style={{ width: 150 }} onChange={val => setDays(val)}>
                    <Select.Option value={7}>Последние 7 дней</Select.Option>
                    <Select.Option value={30}>Последние 30 дней</Select.Option>
                    <Select.Option value={90}>Последние 3 месяца</Select.Option>
                </Select>
            </div>

            {/* Overview Cards (Duplicate from Dashboard but maybe more detailed here?) */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Всего пользователей"
                            value={overview?.total_users}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Новых сегодня"
                            value={overview?.new_today}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false}>
                        <Statistic
                            title="Рост за неделю"
                            value={overview?.new_week}
                            prefix={<RiseOutlined />}
                            suffix="users"
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={16}>
                    <StatsChart data={dailyStats} title={`Динамика пользователей (${days} дней)`} />
                </Col>
                <Col xs={24} lg={8}>
                    <TopBotsChart bots={bots} />
                </Col>
            </Row>
        </div>
    );
};

export default StatsPage;
