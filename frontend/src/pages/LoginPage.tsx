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
            background: '#000' // Dark background
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2}>BotForge</Title>
                    <Typography.Text type="secondary">Вход в панель управления</Typography.Text>
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
                        <Input prefix={<UserOutlined />} placeholder="Username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Введите пароль!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
