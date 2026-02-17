// frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const data = await authApi.login(values.username, values.password);
            login(data.access_token);
            message.success('Добро пожаловать!');
            navigate('/');
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.detail || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundImage: `
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.3) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.3) 0px, transparent 50%),
                linear-gradient(to bottom right, #0f0f13, #1a1a20)
            `,
            backgroundAttachment: 'fixed'
        }}>
            <Card
                className="glass-card"
                bordered={false}
                style={{
                    width: 420,
                    padding: 24,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    background: 'rgba(30, 30, 35, 0.6)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                    }}>
                        <Typography.Text style={{ fontSize: 32, color: 'white' }}>🤖</Typography.Text>
                    </div>
                    <Title level={2} style={{ marginBottom: 8 }}>BotForge</Title>
                    <Typography.Text type="secondary" style={{ fontSize: 16 }}>Вход в панель управления</Typography.Text>
                </div>

                <Form
                    name="login"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Введите имя пользователя!' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                            placeholder="Username"
                            style={{ height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Введите пароль!' }]}
                        style={{ marginBottom: 32 }}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.4)' }} />}
                            placeholder="Password"
                            style={{ height: 48 }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            style={{
                                height: 48,
                                fontSize: 16,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
