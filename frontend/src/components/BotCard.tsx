// frontend/src/components/BotCard.tsx
import React from 'react';
import { Card, Button, Tag, Typography, Tooltip } from 'antd';
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
            className="glass-card"
            bordered={false}
            actions={[
                <Tooltip title={bot.is_active ? "Остановить" : "Запустить"}>
                    <Button
                        type="text"
                        className="bot-action-btn"
                        icon={bot.is_active ? <PauseCircleOutlined style={{ fontSize: 18, color: '#ff4d4f' }} /> : <PlayCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />}
                        onClick={() => onToggleStatus(bot)}
                        loading={loading}
                    />
                </Tooltip>,
                <Tooltip title="Настройки">
                    <Button
                        type="text"
                        className="bot-action-btn"
                        icon={<SettingOutlined style={{ fontSize: 18 }} />}
                        onClick={() => navigate(`/bots/${bot.id}`)}
                    />
                </Tooltip>,
                <Tooltip title="Удалить">
                    <Button
                        type="text"
                        className="bot-action-btn"
                        icon={<DeleteOutlined style={{ fontSize: 18 }} />}
                        onClick={() => onDelete(bot)}
                        danger
                    />
                </Tooltip>
            ]}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        background: 'rgba(24, 144, 255, 0.1)',
                        padding: 12,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 600, wordBreak: 'break-word', lineHeight: '1.4', paddingRight: 8, whiteSpace: 'normal' }}>
                                {bot.name}
                            </span>
                            <Tag color={bot.is_active ? 'success' : 'default'} style={{ margin: 0, flexShrink: 0 }}>
                                {bot.is_active ? 'Активен' : 'Остановлен'}
                            </Tag>
                        </div>
                        <Text type="secondary" copyable={{ text: bot.token }} style={{ fontSize: 13, display: 'block' }}>
                            @{bot.bot_username}
                        </Text>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default BotCard;
