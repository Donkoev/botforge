// frontend/src/pages/BroadcastPage.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, message, Progress, Card, Modal } from 'antd';
import { PlusOutlined, StopOutlined, PlayCircleOutlined } from '@ant-design/icons';
import BroadcastForm from '../components/BroadcastForm';
import { broadcastApi, Broadcast } from '../api/broadcast';
import { formatDate } from '../utils/helpers';
import { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const BroadcastPage: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchBroadcasts = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await broadcastApi.getAll();
            // Sort by id desc (newest first)
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
                let color = 'default';
                if (status === 'sending') color = 'processing';
                if (status === 'completed') color = 'success';
                if (status === 'cancelled') color = 'error';
                const statusMap: Record<string, string> = {
                    draft: 'Черновик',
                    sending: 'Отправка',
                    completed: 'Завершен',
                    cancelled: 'Отменен'
                };
                return <Tag color={color}>{statusMap[status] || status.toUpperCase()}</Tag>;
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
                />
            </Card>
        </div>
    );
};

export default BroadcastPage;
