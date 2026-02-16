// frontend/src/pages/BotSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@ant-design/pro-layout'; // Optional, or build custom
import { Button, Form, Input, Switch, Card, message, Typography, Breadcrumb, Spin } from 'antd';
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

    const fetchBot = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await botsApi.getAll(); // Ideally getOne endpoint, but we reused logic
            const found = data.find(b => b.id === Number(id));
            if (found) {
                setBot(found);
                form.setFieldsValue({
                    name: found.name,
                    is_active: found.is_active
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
    };

    useEffect(() => {
        fetchBot();
    }, [id]);

    const handleSaveSettings = async (values: any) => {
        if (!bot) return;
        try {
            await botsApi.update(bot.id, values);
            message.success('Настройки сохранены');
            fetchBot(); // Refresh
        } catch (error) {
            message.error('Ошибка сохранения');
        }
    };

    if (loading) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;
    if (!bot) return null;

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/bots')}>
                    Назад к списку
                </Button>
            </div>

            <Title level={2}>Настройки: {bot.name}</Title>

            <Card title="Основное" bordered={false} style={{ marginBottom: 24 }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveSettings}
                >
                    <Form.Item name="name" label="Имя бота" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="is_active" label="Активен" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Сохранить основное</Button>
                </Form>
            </Card>

            <MessageEditor botId={bot.id} />
        </div>
    );
};

export default BotSettingsPage;
