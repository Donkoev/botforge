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
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                    background: 'rgba(255, 255, 255, 0.1)',
                    margin: 16,
                    borderRadius: 6
                }}>
                    {collapsed ? 'BF' : 'BotForge'}
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
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Dropdown menu={userMenu}>
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar icon={<UserIcon />} />
                            <span>Admin</span>
                        </div>
                    </Dropdown>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: 8,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
