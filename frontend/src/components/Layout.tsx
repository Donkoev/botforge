// frontend/src/components/Layout.tsx
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
    DashboardOutlined,
    RobotOutlined,
    UserOutlined,
    SendOutlined,
    BarChartOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined as UserIcon
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Дашборд',
        },
        {
            key: '/bots',
            icon: <RobotOutlined />,
            label: 'Боты',
        },
        {
            key: '/users',
            icon: <UserOutlined />,
            label: 'Пользователи',
        },
        {
            key: '/broadcasts',
            icon: <SendOutlined />,
            label: 'Рассылки',
        },
        {
            key: '/stats',
            icon: <BarChartOutlined />,
            label: 'Статистика',
        },
    ];

    const handleMenuClick = (e: any) => {
        navigate(e.key);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userMenu = {
        items: [
            {
                key: 'logout',
                label: <span style={{ fontFamily: "'Outfit', sans-serif" }}>Выйти</span>,
                icon: <LogoutOutlined />,
                onClick: handleLogout,
                style: {
                    color: '#ff4d4f', // Red for logout
                    fontFamily: "'Outfit', sans-serif"
                }
            },
        ],
        style: {
            backgroundColor: 'rgba(30, 30, 35, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 4
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                className="glass-panel"
                style={{
                    margin: 12,
                    borderRadius: 16,
                    border: 'none',
                }}
            >
                <div style={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 16,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                        <RobotOutlined style={{ fontSize: 20, color: 'white' }} />
                    </div>
                    {!collapsed && (
                        <span style={{
                            background: 'linear-gradient(to right, #fff, #a5b4fc)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: 20,
                            fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif"
                        }}>
                            BotForge
                        </span>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Layout>
                <Header style={{
                    padding: '0 24px',
                    height: 80,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '18px',
                            width: 44,
                            height: 44,
                            color: '#fff',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 12,
                        }}
                    />
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <div className="glass-card" style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '6px 16px',
                            borderRadius: 30,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(30, 30, 35, 0.4)'
                        }}>
                            <Avatar
                                icon={<UserIcon />}
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            />
                            <span style={{ color: 'white', fontWeight: 500, fontFamily: "'Outfit', sans-serif" }}>Администратор</span>
                        </div>
                    </Dropdown>
                </Header>
                <Content
                    style={{
                        margin: '0 24px 24px 24px',
                        padding: 0,
                        minHeight: 280,
                        overflow: 'initial'
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
