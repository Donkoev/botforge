// frontend/src/pages/BotsPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Typography, Modal, Form, Input, message, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import BotCard from '../components/BotCard';
import { botsApi, Bot } from '../api/bots';

const { Title, Text } = Typography;

const BotsPage: React.FC = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBots = async () => {
        try {
            setLoading(true);
            const data = await botsApi.getAll();
            setBots(data);
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки ботов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBots();
    }, []);

    const handleCreate = async (values: any) => {
        try {
            setActionLoading(true);
            await botsApi.create(values);
            message.success('Бот добавлен');
            setIsModalOpen(false);
            form.resetFields();
            fetchBots();
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.detail || 'Ошибка добавления бота');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (bot: Bot) => {
        try {
            // Optimistic update
            const newStatus = !bot.is_active;
            const updatedBot = { ...bot, is_active: newStatus };
            setBots(bots.map(b => b.id === bot.id ? updatedBot : b));

            if (newStatus) {
                await botsApi.start(bot.id);
                message.success(`${bot.name} запущен`);
            } else {
                await botsApi.stop(bot.id);
                message.success(`${bot.name} остановлен`);
            }
        } catch (error) {
            console.error(error);
            message.error('Ошибка изменения статуса');
            fetchBots(); // Revert on error
        }
    };

    const handleDelete = async (bot: Bot) => {
        try {
            await botsApi.delete(bot.id);
            message.success('Бот удален');
            setBots(bots.filter(b => b.id !== bot.id));
        } catch (error) {
            console.error(error);
            message.error('Ошибка удаления');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>Боты</Title>
                    <Text type="secondary">Управление вашими Telegram ботами</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    size="large"
                    className="btn-gradient"
                >
                    Добавить бота
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : bots.length === 0 ? (
                <Empty
                    description={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Нет ботов. Добавьте первого!</span>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            ) : (
                <Row gutter={[24, 24]}>
                    {bots.map(bot => (
                        <Col key={bot.id} xs={24} sm={12} md={12} lg={8} xl={6}>
                            <BotCard
                                bot={bot}
                                onToggleStatus={handleToggleStatus}
                                onDelete={handleDelete}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Добавить нового бота"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        name="name"
                        label="Название (для панели)"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Мой бот" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="token"
                        label="Токен бота (от BotFather)"
                        rules={[{ required: true, message: 'Введите токен' }]}
                    >
                        <Input.Password placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" size="large" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button onClick={() => setIsModalOpen(false)} size="large">Отмена</Button>
                            <Button type="primary" htmlType="submit" loading={actionLoading} size="large">
                                Добавить
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BotsPage;
