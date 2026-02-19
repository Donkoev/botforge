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
                <Space>
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

            {/* Detail Modal */}
            <Modal
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={600}
                centered
                className="glass-modal-confirm"
                closable
                title={null}
            >
                {bc && (
                    <div style={{ margin: '-24px -24px 0', padding: 0 }}>
                        {/* Header */}
                        <div style={{
                            padding: '28px 28px 20px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 500 }}>
                                        Рассылка #{bc.id}
                                    </div>
                                    <div style={{
                                        fontSize: 20,
                                        fontWeight: 600,
                                        fontFamily: "'Outfit', sans-serif",
                                        color: '#fff',
                                        lineHeight: 1.3,
                                    }}>
                                        {bc.title}
                                    </div>
                                </div>
                                <Tag
                                    color={statusMap[bc.status]?.color || 'default'}
                                    style={{ margin: 0, fontSize: 13, padding: '2px 12px', borderRadius: 20 }}
                                >
                                    {statusMap[bc.status]?.label || bc.status}
                                </Tag>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px 28px 28px' }}>

                            {/* Message text */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontWeight: 500 }}>
                                    Текст сообщения
                                </div>
                                <div style={{
                                    padding: '14px 18px',
                                    background: 'rgba(0,0,0,0.25)',
                                    borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: 14,
                                    lineHeight: 1.7,
                                    color: 'rgba(255,255,255,0.85)',
                                    maxHeight: 180,
                                    overflowY: 'auto',
                                }}>
                                    {bc.text || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Нет текста</span>}
                                </div>
                            </div>

                            {/* Buttons */}
                            {bc.buttons && bc.buttons.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontWeight: 500 }}>
                                        Кнопки
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {bc.buttons.map((btn: any, i: number) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '10px 14px',
                                                background: 'rgba(99, 102, 241, 0.08)',
                                                borderRadius: 10,
                                                border: '1px solid rgba(99, 102, 241, 0.15)',
                                                transition: 'all 0.2s ease',
                                            }}>
                                                <LinkOutlined style={{ color: '#8b5cf6', fontSize: 14 }} />
                                                <span style={{ flex: 1, fontWeight: 500, color: '#fff', fontSize: 13 }}>{btn.text}</span>
                                                <a
                                                    href={btn.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: 12, color: 'rgba(139, 92, 246, 0.7)', textDecoration: 'none' }}
                                                >
                                                    {btn.url}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Statistics */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontWeight: 500 }}>
                                    Статистика
                                </div>
                                {bc.total_users > 0 ? (
                                    <>
                                        <Progress
                                            percent={Math.round((bc.sent_count + bc.failed_count) / bc.total_users * 100)}
                                            status={bc.status === 'cancelled' ? 'exception' : bc.status === 'completed' ? 'success' : 'active'}
                                            strokeColor={bc.status === 'cancelled' ? '#ff4d4f' : { from: '#6366f1', to: '#8b5cf6' }}
                                            trailColor="rgba(255,255,255,0.06)"
                                            style={{ marginBottom: 14 }}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                            {/* Total */}
                                            <div style={{
                                                padding: '12px 14px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 10,
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#fff' }}>
                                                    {bc.total_users}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Всего</div>
                                            </div>
                                            {/* Sent */}
                                            <div style={{
                                                padding: '12px 14px',
                                                background: 'rgba(82, 196, 26, 0.06)',
                                                borderRadius: 10,
                                                border: '1px solid rgba(82, 196, 26, 0.15)',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#52c41a' }}>
                                                    {bc.sent_count}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'rgba(82, 196, 26, 0.6)', marginTop: 2 }}>Отправлено</div>
                                            </div>
                                            {/* Failed */}
                                            <div style={{
                                                padding: '12px 14px',
                                                background: 'rgba(255, 77, 79, 0.06)',
                                                borderRadius: 10,
                                                border: '1px solid rgba(255, 77, 79, 0.15)',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: '#ff4d4f' }}>
                                                    {bc.failed_count}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'rgba(255, 77, 79, 0.6)', marginTop: 2 }}>Ошибки</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        textAlign: 'center',
                                        color: 'rgba(255,255,255,0.3)',
                                        fontSize: 13,
                                    }}>
                                        Рассылка ещё не запускалась
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: 10,
                                padding: '14px 16px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Создана</div>
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{formatDate(bc.created_at)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Запущена</div>
                                    <div style={{ fontSize: 13, color: bc.started_at ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
                                        {bc.started_at ? formatDate(bc.started_at) : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Завершена</div>
                                    <div style={{ fontSize: 13, color: bc.completed_at ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
                                        {bc.completed_at ? formatDate(bc.completed_at) : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BroadcastPage;

