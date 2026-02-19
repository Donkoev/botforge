// frontend/src/pages/BroadcastPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, message, Progress, Card, Modal } from 'antd';
import { PlusOutlined, StopOutlined, PlayCircleOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
import BroadcastForm from '../components/BroadcastForm';
import { broadcastApi, Broadcast } from '../api/broadcast';
import { formatDate } from '../utils/helpers';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: 'Черновик', color: 'default' },
    sending: { label: 'Отправка', color: 'processing' },
    completed: { label: 'Завершён', color: 'success' },
    cancelled: { label: 'Отменён', color: 'error' },
};

const BroadcastPage: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchBroadcasts = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await broadcastApi.getAll();
            setBroadcasts(data.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки рассылок');
        } finally {
            setLoading(false);
        }
    }, []);

    const hasSending = broadcasts.some(b => b.status === 'sending');

    useEffect(() => {
        fetchBroadcasts();
    }, [fetchBroadcasts]);

    useEffect(() => {
        if (hasSending) {
            const interval = setInterval(fetchBroadcasts, 5000);
            return () => clearInterval(interval);
        }
    }, [hasSending, fetchBroadcasts]);

    const handleStart = async (id: number) => {
        try {
            await broadcastApi.start(id);
            message.success('Рассылка запущена');
            fetchBroadcasts();
        } catch (error) {
            message.error('Ошибка запуска');
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await broadcastApi.cancel(id);
            message.success('Рассылка остановлена');
            fetchBroadcasts();
        } catch (error) {
            message.error('Ошибка отмены');
        }
    };

    const openDetail = (record: Broadcast) => {
        setSelectedBroadcast(record);
        setDetailOpen(true);
    };

    const columns: ColumnsType<Broadcast> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60
        },
        {
            title: 'Название',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const s = statusMap[status] || { label: status, color: 'default' };
                return <Tag color={s.color}>{s.label}</Tag>;
            }
        },
        {
            title: 'Прогресс',
            key: 'progress',
            render: (_, record) => {
                if (record.total_users === 0) return '-';
                const percent = Math.round((record.sent_count + record.failed_count) / record.total_users * 100);
                return (
                    <div style={{ width: 150 }}>
                        <Progress percent={percent} size="small" status={record.status === 'cancelled' ? 'exception' : 'active'} />
                        <div style={{ fontSize: 11, color: '#888' }}>
                            {record.sent_count} sent / {record.failed_count} failed
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Дата создания',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (d) => formatDate(d)
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (
                <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetail(record)}
                    >
                        Детали
                    </Button>
                    {record.status === 'draft' && (
                        <Button
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleStart(record.id)}
                        >
                            Запустить
                        </Button>
                    )}
                    {record.status === 'sending' && (
                        <Button
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Остановить рассылку?',
                                    content: 'Отправка сообщений будет прервана. Продолжить?',
                                    okText: 'Стоп',
                                    cancelText: 'Отмена',
                                    okType: 'danger',
                                    className: 'glass-modal-confirm',
                                    centered: true,
                                    icon: <div style={{ color: '#ff4d4f', marginRight: 12, fontSize: 22 }}>⚠️</div>,
                                    maskClosable: true,
                                    onOk: () => handleCancel(record.id)
                                });
                            }}
                        >
                            Стоп
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    if (isCreating) {
        return (
            <BroadcastForm
                onSuccess={() => { setIsCreating(false); fetchBroadcasts(); }}
                onCancel={() => setIsCreating(false)}
            />
        );
    }

    const bc = selectedBroadcast;
    const percent = bc && bc.total_users > 0
        ? Math.round((bc.sent_count + bc.failed_count) / bc.total_users * 100)
        : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>Рассылки</Title>
                    <Typography.Text type="secondary">Управление массовыми рассылками</Typography.Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreating(true)}
                    size="large"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.3)'
                    }}
                >
                    Создать рассылку
                </Button>
            </div>

            <Card bordered={false} className="glass-card">
                <Table
                    columns={columns}
                    dataSource={broadcasts}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    onRow={(record) => ({
                        onClick: () => openDetail(record),
                        style: { cursor: 'pointer' }
                    })}
                />
            </Card>

            {/* Broadcast Detail Modal */}
            <Modal
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={560}
                centered
                className="broadcast-detail-modal"
                closable
                title={null}
            >
                {bc && (
                    <>
                        {/* ─── Header ─── */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            padding: '24px 48px 18px 28px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.3)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.5,
                                        marginBottom: 6,
                                    }}>
                                        Рассылка #{bc.id}
                                    </div>
                                    <div style={{
                                        fontSize: 20,
                                        fontWeight: 600,
                                        color: '#fff',
                                        fontFamily: "'Outfit', sans-serif",
                                        lineHeight: 1.3,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {bc.title}
                                    </div>
                                </div>
                                <Tag
                                    color={statusMap[bc.status]?.color || 'default'}
                                    style={{ margin: 0, borderRadius: 20, padding: '2px 14px', fontSize: 13, flexShrink: 0 }}
                                >
                                    {statusMap[bc.status]?.label || bc.status}
                                </Tag>
                            </div>
                        </div>

                        {/* ─── Body ─── */}
                        <div style={{ padding: '20px 28px 24px' }}>

                            {/* Message Text */}
                            <SectionLabel>Текст сообщения</SectionLabel>
                            <div style={{
                                padding: '14px 16px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.85)',
                                fontSize: 14,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: 180,
                                overflowY: 'auto',
                                marginBottom: 20,
                            }}>
                                {bc.text || <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Нет текста</span>}
                            </div>

                            {/* Buttons */}
                            {bc.buttons && bc.buttons.length > 0 && (
                                <>
                                    <SectionLabel>Кнопки</SectionLabel>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                                        {bc.buttons.map((btn: any, i: number) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '8px 12px',
                                                background: 'rgba(99,102,241,0.07)',
                                                borderRadius: 8,
                                                border: '1px solid rgba(99,102,241,0.12)',
                                            }}>
                                                <LinkOutlined style={{ color: '#8b5cf6', fontSize: 13 }} />
                                                <span style={{ flex: 1, color: '#fff', fontWeight: 500, fontSize: 13 }}>{btn.text}</span>
                                                <a href={btn.url} target="_blank" rel="noreferrer"
                                                    style={{ color: 'rgba(139,92,246,0.6)', fontSize: 12, textDecoration: 'none' }}>
                                                    {btn.url}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Stats */}
                            <SectionLabel>Статистика</SectionLabel>
                            {bc.total_users > 0 ? (
                                <div style={{ marginBottom: 20 }}>
                                    <Progress
                                        percent={percent}
                                        strokeColor={bc.status === 'cancelled' ? '#ff4d4f' : { from: '#6366f1', to: '#8b5cf6' }}
                                        trailColor="rgba(255,255,255,0.05)"
                                        status={bc.status === 'cancelled' ? 'exception' : bc.status === 'completed' ? 'success' : 'active'}
                                        style={{ marginBottom: 12 }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                        <StatCard value={bc.total_users} label="Всего" color="#fff" bg="rgba(255,255,255,0.03)" border="rgba(255,255,255,0.06)" />
                                        <StatCard value={bc.sent_count} label="Отправлено" color="#52c41a" bg="rgba(82,196,26,0.05)" border="rgba(82,196,26,0.12)" />
                                        <StatCard value={bc.failed_count} label="Ошибки" color="#ff4d4f" bg="rgba(255,77,79,0.05)" border="rgba(255,77,79,0.12)" />
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: 14,
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    textAlign: 'center',
                                    color: 'rgba(255,255,255,0.25)',
                                    fontSize: 13,
                                    marginBottom: 20,
                                }}>
                                    Рассылка ещё не запускалась
                                </div>
                            )}

                            {/* Dates */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: 8,
                                padding: '12px 14px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                                <DateItem label="Создана" value={formatDate(bc.created_at)} />
                                <DateItem label="Запущена" value={bc.started_at ? formatDate(bc.started_at) : null} />
                                <DateItem label="Завершена" value={bc.completed_at ? formatDate(bc.completed_at) : null} />
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

/* ─── Small helper components ─── */

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    }}>
        {children}
    </div>
);

const StatCard: React.FC<{ value: number; label: string; color: string; bg: string; border: string }> = ({ value, label, color, bg, border }) => (
    <div style={{
        padding: '10px 0',
        background: bg,
        borderRadius: 8,
        border: `1px solid ${border}`,
        textAlign: 'center',
    }}>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color }}>{value}</div>
        <div style={{ fontSize: 10, color: `${color}99`, marginTop: 2 }}>{label}</div>
    </div>
);

const DateItem: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
    <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: value ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)', fontWeight: 500 }}>
            {value || '—'}
        </div>
    </div>
);

export default BroadcastPage;

