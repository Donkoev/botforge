// frontend/src/pages/BotSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Input, Switch, Card, message, Typography, Spin, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { botsApi, Bot } from '../api/bots';
import MessageEditor from '../components/MessageEditor';

const { Title } = Typography;

const BotSettingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // string
    const navigate = useNavigate();
    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();

    const fetchBot = React.useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await botsApi.getAll(); // Ideally getOne endpoint, but we reused logic
            const found = data.find(b => b.id === Number(id));
            if (found) {
                setBot(found);
                form.setFieldsValue({
                    name: found.name,
                    is_active: Boolean(found.is_active)
                });
            } else {
                message.error('Бот не найден');
                navigate('/bots');
            }
        } catch (error) {
            console.error(error);
            message.error('Ошибка при загрузке');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, form]);

    useEffect(() => {
        fetchBot();
    }, [fetchBot]);

    const handleSaveSettings = async (values: any) => {
        if (!bot) return;
        try {
            // 1. Update general settings (name)
            if (values.name !== bot.name) {
                await botsApi.update(bot.id, { name: values.name });
            }

            // 2. Handle status change specifically via start/stop endpoints
            if (values.is_active !== bot.is_active) {
                if (values.is_active) {
                    await botsApi.start(bot.id);
                } else {
                    await botsApi.stop(bot.id);
                }
            }

            message.success('Настройки сохранены');
            fetchBot(); // Refresh to get latest state
        } catch (error) {
            console.error(error);
            message.error('Ошибка сохранения');
        }
    };

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
    if (!bot) return null;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/bots')}
                    style={{ marginBottom: 16, paddingLeft: 0, color: 'rgba(255,255,255,0.7)' }}
                >
                    Назад к списку
                </Button>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>Настройки: {bot.name}</Title>
                    <Typography.Text type="secondary">Управление параметрами бота</Typography.Text>
                </div>
            </div>

            <Card className="glass-card" bordered={false} style={{ marginBottom: 24, padding: 8 }}>
                <Title level={4} style={{ marginBottom: 24, paddingLeft: 8 }}>Основное</Title>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveSettings}
                >
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <Form.Item name="name" label="Имя бота" rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <div style={{ marginBottom: 8, display: 'block' }}>Статус бота</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40 }}>
                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                    <Switch />
                                </Form.Item>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{bot.is_active ? 'Активен' : 'Остановлен'}</span>
                            </div>
                        </Col>
                    </Row>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            Сохранить изменения
                        </Button>
                    </div>
                </Form>
            </Card>

            <MessageEditor botId={bot.id} />
        </div>
    );
};

export default BotSettingsPage;
