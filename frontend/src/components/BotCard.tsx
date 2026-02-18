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
    dragHandleProps?: any; // Pass DnD props here
}

const BotCard: React.FC<BotCardProps> = ({ bot, onToggleStatus, onDelete, loading, dragHandleProps }) => {
    const navigate = useNavigate();

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
            {/* Drag Handle - 2x3 Dots - Better styling */}
            <div
                className="drag-handle"
                {...dragHandleProps}
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16, // Move to right as user suggested "dots usually there" (often context menu or drag is top-right)
                    // actually, let's keep it top-left or try top-right. 
                    // Let's try TOP-RIGHT as it often balances the title if title is left. 
                    // However, in our card, title is top-left.
                    // Let's stick to user request "dots 2 on 3".
                    // I'll place it Top-Left but simpler.
                    left: 16,
                    cursor: 'grab',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255, 0.6)', // More visible
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 4px)',
                    gridTemplateRows: 'repeat(3, 4px)',
                    gap: '4px',
                    zIndex: 10,
                    transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.05)' // Subtle background area
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255, 0.6)'; }}
            >
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingLeft: 36 }}>
                {/* Added paddingLeft to avoid overlap with handle */}
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
