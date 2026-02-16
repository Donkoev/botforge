// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, message } from 'antd';
import { UserOutlined, ArrowUpOutlined, RobotOutlined, UserAddOutlined } from '@ant-design/icons';
import StatsChart from '../components/StatsChart';
import { statsApi, StatsOverview, DailyStat } from '../api/stats';
import { usersApi, BotUser } from '../api/users';
import { botsApi, Bot } from '../api/bots';
import { formatDate } from '../utils/helpers';

const { Title } = Typography;

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
        { title: 'Бот', dataIndex: 'name', key: 'name' },
        { title: 'Статус', dataIndex: 'is_active', key: 'is_active', render: (active: boolean) => active ? <span style={{ color: '#52c41a' }}>Active</span> : <span style={{ color: '#ff4d4f' }}>Stopped</span> },
    ];

    const recentUsersColumns = [
        { title: 'ID', dataIndex: 'telegram_id', key: 'telegram_id' },
        { title: 'Username', dataIndex: 'username', key: 'username', render: (u: string) => u ? `@${u}` : '-' },
        { title: 'Дата', dataIndex: 'first_seen_at', key: 'first_seen_at', render: (d: string) => formatDate(d) },
    ];

    return (
        <div>
            <Title level={2}>Обзор</Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Всего пользователей"
                            value={overview?.total_users}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Новых сегодня"
                            value={overview?.new_today}
                            prefix={<ArrowUpOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Новых за неделю"
                            value={overview?.new_week}
                            prefix={<UserAddOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false}>
                        <Statistic
                            title="Активных ботов"
                            value={overview?.active_bots}
                            prefix={<RobotOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <StatsChart data={dailyStats} />
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <Card title="Последние пользователи" bordered={false}>
                        <Table
                            dataSource={recentUsers}
                            columns={recentUsersColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Активные боты" bordered={false}>
                        <Table
                            dataSource={activeBots.slice(0, 5)}
                            columns={topBotsColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;
