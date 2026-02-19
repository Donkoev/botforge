// frontend/src/components/BotCard.tsx
import React, { useState } from 'react';
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
    dragHandleProps?: any; // Pass DnD props here
}

const BotCard: React.FC<BotCardProps> = ({ bot, onToggleStatus, onDelete, loading, dragHandleProps }) => {
    const navigate = useNavigate();
    const [avatarError, setAvatarError] = useState(false);

    return (
        <Card
            className="glass-card generic-transition"
            bordered={false}
            bodyStyle={{ padding: 24, position: 'relative' }} // Standard padding
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
            {/* Drag Handle - Minimalist 2x3 Dots */}
            <div
                className="drag-handle"
                {...dragHandleProps}
                style={{
                    position: 'absolute',
                    top: 20, // Align with content
                    left: 12,
                    cursor: 'grab',
                    padding: '6px',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255, 0.3)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 4px)',
                    gridTemplateRows: 'repeat(3, 4px)',
                    gap: '3px',
                    zIndex: 10,
                    transition: 'all 0.2s',
                    // No background by default
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255, 0.9)'; e.currentTarget.style.background = 'rgba(255,255,255, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255, 0.3)'; e.currentTarget.style.background = 'transparent'; }}
            >
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingLeft: 28 }}>
                {/* Reduced paddingLeft slightly */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: avatarError ? 'rgba(24, 144, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                    }}>
                        {avatarError ? (
                            <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        ) : (
                            <img
                                src={`/api/bots/${bot.id}/avatar`}
                                alt={bot.name}
                                onError={() => setAvatarError(true)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        )}
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
                        <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                            @{bot.bot_username}
                        </Text>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default BotCard;

