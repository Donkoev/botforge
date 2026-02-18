// frontend/src/pages/BotsPage.tsx
import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Typography, Modal, Form, Input, message, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import BotCard from '../components/BotCard';
import { botsApi, Bot } from '../api/bots';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

const { Title, Text } = Typography;

// Sortable wrapper for BotCard
interface SortableBotCardProps {
    bot: Bot;
    onToggleStatus: (bot: Bot) => void;
    onDelete: (bot: Bot) => void;
}

const SortableBotCard: React.FC<SortableBotCardProps> = ({ bot, onToggleStatus, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: bot.id,
        transition: {
            duration: 450,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
        scale: isSortableDragging ? '0.97' : '1',
        filter: isSortableDragging ? 'brightness(0.7)' : 'none',
        height: '100%',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <BotCard
                bot={bot}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                dragHandleProps={listeners}
            />
        </div>
    );
};

const BotsPage: React.FC = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [actionLoading, setActionLoading] = useState(false);
    const [activeBot, setActiveBot] = useState<Bot | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

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
            fetchBots();
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

    const handleDragStart = (event: DragStartEvent) => {
        const bot = bots.find(b => b.id === event.active.id);
        setActiveBot(bot || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveBot(null);
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = bots.findIndex(b => b.id === active.id);
            const newIndex = bots.findIndex(b => b.id === over.id);

            const newBots = [...bots];
            const [moved] = newBots.splice(oldIndex, 1);
            newBots.splice(newIndex, 0, moved);

            setBots(newBots);

            // Persist new order
            const reorderData = newBots.map((b, i) => ({ id: b.id, display_order: i }));
            try {
                await botsApi.reorder(reorderData);
            } catch (error) {
                console.error('Failed to save order', error);
                message.error('Ошибка сохранения порядка');
                fetchBots();
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                >
                    <SortableContext items={bots.map(b => b.id)} strategy={rectSortingStrategy}>
                        <Row gutter={[24, 24]}>
                            {bots.map((bot, index) => (
                                <Col key={bot.id} xs={24} sm={24} md={12} lg={12} xl={8}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        style={{ height: '100%' }}
                                    >
                                        <SortableBotCard
                                            bot={bot}
                                            onToggleStatus={handleToggleStatus}
                                            onDelete={handleDeleteClick}
                                        />
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </SortableContext>

                    <DragOverlay adjustScale={false} dropAnimation={{
                        duration: 400,
                        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    }}>
                        {activeBot ? (
                            <div style={{
                                transform: 'rotate(1.5deg) scale(1.04)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 30px rgba(99, 102, 241, 0.15)',
                                borderRadius: 12,
                                opacity: 1,
                                backdropFilter: 'blur(12px)',
                            }}>
                                <BotCard
                                    bot={activeBot}
                                    onToggleStatus={() => { }}
                                    onDelete={() => { }}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
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

