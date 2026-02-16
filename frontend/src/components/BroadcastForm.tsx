// frontend/src/components/BroadcastForm.tsx
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Space, message, Card, Steps } from 'antd';
import { MinusCircleOutlined, PlusOutlined, SendOutlined, SaveOutlined } from '@ant-design/icons';
import { botsApi, Bot } from '../api/bots';
import { broadcastApi } from '../api/broadcast';

const { Option } = Select;

interface BroadcastFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const BroadcastForm: React.FC<BroadcastFormProps> = ({ onSuccess, onCancel }) => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchBots = async () => {
            try {
                const data = await botsApi.getAll();
                setBots(data);
            } catch (error) {
                message.error('Ошибка загрузки ботов');
            }
        };
        fetchBots();
    }, []);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const payload = {
                title: values.title,
                text: values.text,
                buttons: values.buttons || [],
                target_bots: values.target_bots,
                media_type: null // Not implemented yet
            };

            const broadcast = await broadcastApi.create(payload);

            if (values.action === 'send') {
                await broadcastApi.start(broadcast.id);
                message.success('Рассылка запущена!');
            } else {
                message.success('Черновик сохранен');
            }

            onSuccess();
        } catch (error: any) {
            console.error(error);
            message.error(error.response?.data?.detail || 'Ошибка создания рассылки');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Новая рассылка">
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ target_bots: [] }}
            >
                <Form.Item
                    name="title"
                    label="Название (внутреннее)"
                    rules={[{ required: true, message: 'Введите название' }]}
                >
                    <Input placeholder="Например: Новогодняя акция" />
                </Form.Item>

                <Form.Item
                    name="target_bots"
                    label="Боты для рассылки"
                    rules={[{ required: true, message: 'Выберите хотя бы одного бота' }]}
                >
                    <Select mode="multiple" placeholder="Выберите ботов">
                        {bots.map(bot => (
                            <Option key={bot.id} value={bot.id}>{bot.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="text"
                    label="Текст сообщения (HTML поддерживается)"
                    rules={[{ required: true, message: 'Введите текст' }]}
                >
                    <Input.TextArea rows={6} placeholder="Привет! У нас новости..." />
                </Form.Item>

                <Form.List name="buttons">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'text']}
                                        rules={[{ required: true, message: 'Текст' }]}
                                    >
                                        <Input placeholder="Текст кнопки" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'url']}
                                        rules={[{ required: true, message: 'URL' }]}
                                    >
                                        <Input placeholder="URL" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Добавить кнопку
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Form.Item>
                    <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Отмена</Button>
                        <Button
                            type="default"
                            icon={<SaveOutlined />}
                            onClick={() => form.setFieldValue('action', 'draft')}
                            htmlType="submit"
                            loading={loading}
                        >
                            Сохранить как черновик
                        </Button>
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={() => form.setFieldValue('action', 'send')}
                            htmlType="submit"
                            loading={loading}
                        >
                            Запустить рассылку
                        </Button>
                        {/* Hidden field to distinguish actions */}
                        <Form.Item name="action" hidden><Input /></Form.Item>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default BroadcastForm;
