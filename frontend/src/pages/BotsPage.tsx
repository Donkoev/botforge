// frontend/src/pages/BotsPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Typography, Modal, Form, Input, message, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import BotCard from '../components/BotCard';
import { botsApi, Bot } from '../api/bots';

const { Title, Text } = Typography;

const BotsPage: React.FC = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBots = async () => {
        try {
            setLoading(true);
            const data = await botsApi.getAll();
            setBots(data);
        } catch (error) {
            console.error(error);
            message.error('Ошибка загрузки ботов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBots();
    }, []);

    const handleCreate = async (values: any) => {
        try {
            setActionLoading(true);
            await botsApi.create(values);
            message.success('Бот добавлен');
            setIsModalOpen(false);
            form.resetFields();
            fetchBots();
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.detail || 'Ошибка добавления бота');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (bot: Bot) => {
        try {
            // Optimistic update
            const newStatus = !bot.is_active;
            const updatedBot = { ...bot, is_active: newStatus };
            setBots(bots.map(b => b.id === bot.id ? updatedBot : b));

            if (newStatus) {
                await botsApi.start(bot.id);
                message.success(`${bot.name} запущен`);
            } else {
                await botsApi.stop(bot.id);
                message.success(`${bot.name} остановлен`);
            }
        } catch (error) {
            console.error(error);
            message.error('Ошибка изменения статуса');
            fetchBots(); // Revert on error
        }
    };

    const handleDelete = async (bot: Bot) => {
        try {
            await botsApi.delete(bot.id);
            message.success('Бот удален');
            setBots(bots.filter(b => b.id !== bot.id));
        } catch (error) {
            console.error(error);
            message.error('Ошибка удаления');
        }
    };

    const [draggedItem, setDraggedItem] = useState<number | null>(null);

    // State for Custom Drag Ghost
    const [draggedBot, setDraggedBot] = useState<Bot | null>(null);
    const ghostRef = React.useRef<HTMLDivElement>(null);
    const [ghostSize, setGhostSize] = useState({ width: 0, height: 0 });

    const onDragStart = (e: React.DragEvent, index: number) => {
        const target = e.target as HTMLElement;
        const handle = target.closest('.drag-handle');

        if (!handle) {
            e.preventDefault();
            return;
        }

        setDraggedItem(index);
        setDraggedBot(bots[index]);
        e.dataTransfer.effectAllowed = 'move';

        // Hide default drag image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        // Capture size
        const cardCol = target.closest('.ant-col');
        if (cardCol) {
            const rect = cardCol.getBoundingClientRect();
            setGhostSize({ width: rect.width, height: rect.height });
            // Initial position sets
            if (ghostRef.current) {
                ghostRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
                ghostRef.current.style.opacity = '1';
            }
        }
    };

    const onDrag = (e: React.DragEvent) => {
        // Update ghost position
        if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid end coordinates
        if (ghostRef.current) {
            // Center the ghost on cursor or offset? 
            // Usually cursor on handle. Let's act like cursor is top-left of transparency, 
            // but for better visual let's offset slightly so mouse is inside the card.
            // But strict following is simpler.
            // Let's rely on e.clientX/Y.
            // Note: We might want some offset so we can see the drop target?
            // "pointer-events: none" on ghost solves drop target blocking.
            ghostRef.current.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 10}px)`;
        }
    };

    const onDragEnd = () => {
        setDraggedItem(null);
        setDraggedBot(null);
        if (ghostRef.current) {
            ghostRef.current.style.opacity = '0';
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        onDragEnd();

        // Save new order to backend
        // Note: 'bots' state is already updated live during drag
        const reorderData = bots.map((b, i) => ({ id: b.id, display_order: i }));
        try {
            await botsApi.reorder(reorderData);
        } catch (error) {
            console.error('Failed to save order', error);
            message.error('Ошибка сохранения порядка');
        }
    };

    const handleDeleteClick = (bot: Bot) => {
        Modal.confirm({
            title: 'Удалить бота?',
            content: `Вы уверены, что хотите удалить ${bot.name}? Это действие необратимо.`,
            okText: 'Удалить',
            cancelText: 'Отмена',
            okType: 'danger',
            className: 'glass-modal-confirm',
            centered: true,
            icon: <div style={{ color: '#ff4d4f', marginRight: 12, fontSize: 22 }}>⚠️</div>,
            maskClosable: true,
            onOk: () => handleDelete(bot),
            cancelButtonProps: { size: 'large' },
            okButtonProps: { size: 'large' }
        });
    };

    // Debounce ref to prevent rapid swapping
    const lastSwapTime = React.useRef(0);

    return (
        <div>
            {/* Custom Drag Ghost */}
            <div
                ref={ghostRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: ghostSize.width,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: 0,
                    transition: 'opacity 0.1s',
                    transformOrigin: 'top left'
                }}
            >
                {draggedBot && (
                    <div style={{ transform: 'rotate(2deg) scale(1.02)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <BotCard
                            bot={draggedBot}
                            onToggleStatus={() => { }}
                            onDelete={() => { }}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                {/* Header ... */}
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>Боты</Title>
                    <Text type="secondary">Управление вашими Telegram ботами</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    size="large"
                    className="btn-gradient"
                >
                    Добавить бота
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : bots.length === 0 ? (
                <Empty
                    description={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Нет ботов. Добавьте первого!</span>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            ) : (
                <Row gutter={[24, 24]}>
                    {bots.map((bot, index) => (
                        <Col
                            key={bot.id}
                            xs={24} sm={24} md={12} lg={12} xl={8}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragEnter={() => {
                                // Debounce check
                                const now = Date.now();
                                if (now - lastSwapTime.current < 250) return; // Wait 250ms between swaps

                                if (draggedItem !== null && draggedItem !== index) {
                                    lastSwapTime.current = now;
                                    const newBots = [...bots];
                                    const [movedItem] = newBots.splice(draggedItem, 1);
                                    newBots.splice(index, 0, movedItem);
                                    setBots(newBots);
                                    setDraggedItem(index);
                                }
                            }}
                        >
                            <motion.div
                                layout
                                layoutId={String(bot.id)}
                                transition={{ type: "spring", stiffness: 150, damping: 20, mass: 1 }}
                                style={{
                                    height: '100%',
                                    opacity: draggedItem === index ? 0 : 1,
                                    // Important: disable pointer events on the placeholder to prevent visual glitching / self-interaction
                                    pointerEvents: draggedItem === index ? 'none' : 'auto'
                                }}
                            >
                                <BotCard
                                    bot={bot}
                                    onToggleStatus={handleToggleStatus}
                                    onDelete={handleDeleteClick}
                                    dragHandleProps={{
                                        draggable: true,
                                        onDragStart: (e: React.DragEvent) => onDragStart(e, index),
                                        onDrag: onDrag,
                                        onDragEnd: onDragEnd
                                    }}
                                />
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title="Добавить нового бота"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreate}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        name="name"
                        label="Название (для панели)"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Мой бот" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="token"
                        label="Токен бота (от BotFather)"
                        rules={[{ required: true, message: 'Введите токен' }]}
                    >
                        <Input.Password placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" size="large" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <Button onClick={() => setIsModalOpen(false)} size="large">Отмена</Button>
                            <Button type="primary" htmlType="submit" loading={actionLoading} size="large">
                                Добавить
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BotsPage;
