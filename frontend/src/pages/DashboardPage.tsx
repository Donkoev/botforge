// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, message, Tag } from 'antd';
import { UserOutlined, ArrowUpOutlined, RobotOutlined, UserAddOutlined } from '@ant-design/icons';
import StatsChart from '../components/StatsChart';
import { statsApi, StatsOverview, DailyStat } from '../api/stats';
import { usersApi, BotUser } from '../api/users';
import { botsApi, Bot } from '../api/bots';
import { formatDate } from '../utils/helpers';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
    const [overview, setOverview] = useState<StatsOverview | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [recentUsers, setRecentUsers] = useState<BotUser[]>([]);
    const [activeBots, setActiveBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewData, dailyData, usersData, botsData] = await Promise.all([
                statsApi.getOverview(),
                statsApi.getDaily(30),
                usersApi.getAll({ page: 1, limit: 5 }),
                botsApi.getAll()
            ]);

            setOverview(overviewData);
            setDailyStats(dailyData);
            setRecentUsers(usersData.users);
            setActiveBots(botsData.filter(b => b.is_active));
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const topBotsColumns = [
        { title: 'Бот', dataIndex: 'name', key: 'name', render: (text: string) => <strong style={{ color: '#fff' }}>{text}</strong> },
        { title: 'Статус', dataIndex: 'is_active', key: 'is_active', render: (active: boolean) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Stopped</Tag> },
    ];

    const recentUsersColumns = [
        { title: 'ID', dataIndex: 'telegram_id', key: 'telegram_id', render: (id: number) => <Text style={{ color: '#a0a0a0' }}>{id}</Text> },
        { title: 'Username', dataIndex: 'username', key: 'username', render: (u: string) => u ? <span style={{ color: '#818cf8' }}>@{u}</span> : '-' },
        { title: 'Дата', dataIndex: 'first_seen_at', key: 'first_seen_at', render: (d: string) => formatDate(d) },
    ];

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontSize: 28 }}>Обзор</Title>
                <Text type="secondary">Статистика и метрики за последнее время</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Всего пользователей"
                            value={overview?.total_users}
                            prefix={<UserOutlined style={{ color: '#4ade80', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Новых сегодня"
                            value={overview?.new_today}
                            prefix={<ArrowUpOutlined style={{ color: '#f87171', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Новых за неделю"
                            value={overview?.new_week}
                            prefix={<UserAddOutlined style={{ color: '#c084fc', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="glass-card">
                        <Statistic
                            title="Активных ботов"
                            value={overview?.active_bots}
                            prefix={<RobotOutlined style={{ color: '#60a5fa', fontSize: 20 }} />}
                            valueStyle={{ fontWeight: 600, fontSize: 28 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <div style={{ height: 400 }}>
                        <StatsChart data={dailyStats} />
                    </div>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card
                        title="Последние пользователи"
                        bordered={false}
                        className="glass-card"
                        headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <Table
                            dataSource={recentUsers}
                            columns={recentUsersColumns}
                            rowKey="id"
                            pagination={false}
                            size="middle"
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        title="Активные боты"
                        bordered={false}
                        className="glass-card"
                        headStyle={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <Table
                            dataSource={activeBots.slice(0, 5)}
                            columns={topBotsColumns}
                            rowKey="id"
                            pagination={false}
                            size="middle"
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
