// frontend/src/pages/UsersPage.tsx
import React, { useEffect, useState } from 'react';
import { Card, Input, Typography, Row, Col, Select, Button, Space, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import UserTable from '../components/UserTable';
import { usersApi, BotUser } from '../api/users';
import { botsApi, Bot } from '../api/bots';

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<BotUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [bots, setBots] = useState<Bot[]>([]);

    // Filter states
    const [searchText, setSearchText] = useState('');
    const [selectedBotId, setSelectedBotId] = useState<number | undefined>(undefined);

    // Pagination state
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const fetchBots = async () => {
        try {
            const data = await botsApi.getAll();
            setBots(data);
        } catch (e) {
            console.error(e);
        }
    }

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await usersApi.getAll({
                page: pagination.current,
                limit: pagination.pageSize,
                search: searchText || undefined,
                bot_id: selectedBotId
            });
            setUsers(data.users);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки пользователей');
        } finally {
            setLoading(false);
        }
    }, [pagination, searchText, selectedBotId]);

    useEffect(() => {
        fetchBots();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    // Should we fetch on searchText change? Or on Enter/Search click?
    // Let's do fetch on specific action or debounce. For now, manual trigger or effect dependency.
    // Adding searchText to dependency might cause many requests. Let's use a search button or 'onSearch' prop of Input.Search

    const handleTableChange = (newPagination: any) => {
        setPagination(newPagination);
    };

    const handleSearch = () => {
        setPagination({ ...pagination, current: 1 }); // Reset to page 1
        fetchUsers();
    };

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontSize: 28 }}>Пользователи</Title>
                <Typography.Text type="secondary">База пользователей всех ваших ботов</Typography.Text>
            </div>

            <Card bordered={false} className="glass-card" style={{ marginBottom: 24, padding: 8 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8} md={6}>
                        <Input
                            placeholder="Поиск по username/имени"
                            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onPressEnter={handleSearch}
                            size="large"
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={8} md={6}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Фильтр по боту"
                            allowClear
                            value={selectedBotId}
                            onChange={val => {
                                setSelectedBotId(val);
                                setPagination({ ...pagination, current: 1 });
                            }}
                            size="large"
                        >
                            {bots.map(bot => (
                                <Option key={bot.id} value={bot.id}>{bot.name}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={8} md={6}>
                        <Space>
                            <Button type="primary" onClick={handleSearch} size="large" icon={<SearchOutlined />}>Найти</Button>
                            <Button icon={<ReloadOutlined />} onClick={fetchUsers} size="large"></Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card bordered={false} className="glass-card">
                <UserTable
                    users={users}
                    loading={loading}
                    pagination={{ ...pagination, total }}
                    onChange={handleTableChange}
                />
            </Card>
        </div>
    );
};

export default UsersPage;
