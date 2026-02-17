// frontend/src/components/Layout.tsx
import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Avatar, Dropdown } from 'antd';
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
    const {
        token: { colorBgContainer },
    } = theme.useToken();
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
                label: 'Выйти',
                icon: <LogoutOutlined />,
                onClick: handleLogout,
            },
        ],
    };

    return (
    return (
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                className="glass-panel"
                style={{
                    margin: 12,
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(30, 30, 35, 0.6)'
                }}
            >
                <div style={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 16
                }}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RobotOutlined style={{ fontSize: 18 }} />
                    </div>
                    {!collapsed && <span style={{ background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BotForge</span>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ background: 'transparent', border: 'none' }}
                />
            </Sider>
            <Layout style={{ background: 'transparent' }}>
                <Header style={{
                    padding: '0 24px',
                    background: 'rgba(30, 30, 35, 0.6)',
                    backdropFilter: 'blur(12px)',
                    margin: '12px 12px 0 0',
                    borderRadius: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 48,
                            height: 48,
                            color: '#fff'
                        }}
                    />
                    <Dropdown menu={userMenu} placement="bottomRight">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '4px 12px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Avatar icon={<UserIcon />} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                            <span style={{ color: 'white', fontWeight: 500 }}>Admin</span>
                        </div>
                    </Dropdown>
                </Header>
                <Content
                    style={{
                        margin: '12px 12px 12px 0',
                        padding: 0,
                        minHeight: 280,
                        background: 'transparent',
                        borderRadius: 16,
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
