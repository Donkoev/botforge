// frontend/src/components/BotCard.tsx
import React from 'react';
import { Card, Button, Tag, Typography, Space, Tooltip, Popconfirm } from 'antd';
import {
    RobotOutlined,
    SettingOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Bot } from '../api/bots';

const { Text } = Typography;

interface BotCardProps {
    bot: Bot;
    onToggleStatus: (bot: Bot) => void;
    onDelete: (bot: Bot) => void;
    loading?: boolean;
}

const BotCard: React.FC<BotCardProps> = ({ bot, onToggleStatus, onDelete, loading }) => {
    const navigate = useNavigate();

    return (
        <Card
            actions={[
                <Tooltip title={bot.is_active ? "Остановить" : "Запустить"}>
                    <Button
                        type="text"
                        icon={bot.is_active ? <PauseCircleOutlined style={{ color: '#faad14' }} /> : <PlayCircleOutlined style={{ color: '#52c41a' }} />}
                        onClick={() => onToggleStatus(bot)}
                        loading={loading}
                    />
                </Tooltip>,
                <Tooltip title="Настройки">
                    <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => navigate(`/bots/${bot.id}`)}
                    />
                </Tooltip>,
                <Popconfirm
                    title="Удалить бота?"
                    description="Это действие нельзя отменить."
                    onConfirm={() => onDelete(bot)}
                    okText="Да"
                    cancelText="Нет"
                >
                    <Button type="text" icon={<DeleteOutlined />} danger />
                </Popconfirm>
            ]}
        >
            <Card.Meta
                avatar={<RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={
                    <Space>
                        {bot.name}
                        <Tag color={bot.is_active ? 'success' : 'default'}>
                            {bot.is_active ? 'Active' : 'Stopped'}
                        </Tag>
                    </Space>
                }
                description={
                    <div>
                        <Text type="secondary">@{bot.bot_username}</Text>
                    </div>
                }
            />
        </Card>
    );
};

export default BotCard;
