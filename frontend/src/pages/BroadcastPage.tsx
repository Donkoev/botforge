// frontend/src/pages/BroadcastPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, message, Progress, Card, Modal, Descriptions, Divider } from 'antd';
import { PlusOutlined, StopOutlined, PlayCircleOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
import BroadcastForm from '../components/BroadcastForm';
import { broadcastApi, Broadcast } from '../api/broadcast';
import { formatDate } from '../utils/helpers';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

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
                width={640}
                centered
                className="glass-modal-confirm"
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18 }}>📨</span>
                        <span>Детали рассылки</span>
                    </div>
                }
            >
                {bc && (
                    <div>
                        <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Название" span={2}>
                                <Text strong>{bc.title}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Статус">
                                <Tag color={statusMap[bc.status]?.color || 'default'}>
                                    {statusMap[bc.status]?.label || bc.status}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID">#{bc.id}</Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Message text */}
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Текст сообщения
                            </Text>
                            <div style={{
                                marginTop: 8,
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.08)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontSize: 14,
                                lineHeight: 1.6,
                                maxHeight: 200,
                                overflowY: 'auto',
                            }}>
                                {bc.text || <Text type="secondary" italic>Нет текста</Text>}
                            </div>
                        </div>

                        {/* Buttons */}
                        {bc.buttons && bc.buttons.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Кнопки
                                </Text>
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {bc.buttons.map((btn: any, i: number) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 12px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            borderRadius: 6,
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                        }}>
                                            <LinkOutlined style={{ color: '#8b5cf6' }} />
                                            <Text strong style={{ flex: 1 }}>{btn.text}</Text>
                                            <Text type="secondary" copyable style={{ fontSize: 12 }}>{btn.url}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Statistics */}
                        <div style={{ marginBottom: 16 }}>
                            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Статистика
                            </Text>
                            <div style={{ marginTop: 8 }}>
                                {bc.total_users > 0 ? (
                                    <>
                                        <Progress
                                            percent={Math.round((bc.sent_count + bc.failed_count) / bc.total_users * 100)}
                                            status={bc.status === 'cancelled' ? 'exception' : bc.status === 'completed' ? 'success' : 'active'}
                                            style={{ marginBottom: 8 }}
                                        />
                                        <Space size="large">
                                            <Text>
                                                👥 Всего: <Text strong>{bc.total_users}</Text>
                                            </Text>
                                            <Text>
                                                ✅ Отправлено: <Text strong style={{ color: '#52c41a' }}>{bc.sent_count}</Text>
                                            </Text>
                                            <Text>
                                                ❌ Ошибки: <Text strong style={{ color: '#ff4d4f' }}>{bc.failed_count}</Text>
                                            </Text>
                                        </Space>
                                    </>
                                ) : (
                                    <Text type="secondary">Нет данных</Text>
                                )}
                            </div>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Dates */}
                        <Descriptions column={3} size="small">
                            <Descriptions.Item label="Создана">{formatDate(bc.created_at)}</Descriptions.Item>
                            <Descriptions.Item label="Запущена">{bc.started_at ? formatDate(bc.started_at) : '—'}</Descriptions.Item>
                            <Descriptions.Item label="Завершена">{bc.completed_at ? formatDate(bc.completed_at) : '—'}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BroadcastPage;

