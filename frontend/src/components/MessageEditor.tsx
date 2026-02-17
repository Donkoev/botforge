// frontend/src/components/MessageEditor.tsx
import React, { useEffect, useState } from 'react';
import { Tabs, Form, Input, Button, Card, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { botsApi, MessageTemplate } from '../api/bots';

interface MessageEditorProps {
    botId: number;
}

const MessageEditor: React.FC<MessageEditorProps> = ({ botId }) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [activeLang, setActiveLang] = useState('ru');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // New language state
    const [newLangMode, setNewLangMode] = useState(false);
    const [newLangCode, setNewLangCode] = useState('');

    const fetchTemplates = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await botsApi.getTemplates(botId);
            setTemplates(data);

            // If active lang not in templates (and templates not empty), switch to first
            if (data.length > 0 && !data.find(t => t.language_code === activeLang)) {
                setActiveLang(data[0].language_code);
            }
        } catch (error) {
            message.error('Ошибка загрузки шаблонов');
        } finally {
            setLoading(false);
        }
    }, [botId, activeLang]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Update form when active lang changes
    useEffect(() => {
        const tmpl = templates.find(t => t.language_code === activeLang);
        if (tmpl) {
            form.setFieldsValue({
                text: tmpl.text,
                buttons: tmpl.buttons
            });
        } else {
            form.resetFields();
        }
    }, [activeLang, templates, form]);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const tmpl = templates.find(t => t.language_code === activeLang);

            const payload = {
                language_code: activeLang,
                text: values.text,
                buttons: values.buttons || []
            };

            if (tmpl) {
                // Update
                await botsApi.updateTemplate(botId, tmpl.id, payload);
                message.success('Шаблон обновлен');
            } else {
                // Create
                await botsApi.createTemplate(botId, payload);
                message.success('Шаблон создан');
            }
            await fetchTemplates();
        } catch (error: any) {
            console.error(error);
            message.error('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async () => {
        const tmpl = templates.find(t => t.language_code === activeLang);
        if (!tmpl) return;

        try {
            await botsApi.deleteTemplate(botId, tmpl.id);
            message.success('Шаблон удален');
            fetchTemplates();
        } catch (error) {
            message.error('Ошибка удаления');
        }
    };

    const handleAddLang = () => {
        if (!newLangCode) return;
        if (templates.find(t => t.language_code === newLangCode)) {
            message.warning('Такой язык уже есть');
            return;
        }
        setActiveLang(newLangCode);
        setNewLangMode(false);
        setNewLangCode('');
        form.resetFields();
    }

    const tabItems = templates.map(t => ({
        key: t.language_code,
        label: t.language_code.toUpperCase(),
    }));

    // If current active lang is not saved yet (newly added), add it to tabs visually
    if (!templates.find(t => t.language_code === activeLang) && !newLangMode) {
        tabItems.push({
            key: activeLang,
            label: `${activeLang.toUpperCase()} (New)`
        });
    }

    return (
        <Card title="Приветственное сообщение" bordered={false} className="glass-card">
            <Space style={{ marginBottom: 16 }}>
                {newLangMode ? (
                    <Space.Compact>
                        <Input
                            style={{ width: 100 }}
                            placeholder="code (en)"
                            value={newLangCode}
                            onChange={e => setNewLangCode(e.target.value)}
                        />
                        <Button type="primary" onClick={handleAddLang}>OK</Button>
                        <Button onClick={() => setNewLangMode(false)}>X</Button>
                    </Space.Compact>
                ) : (
                    <Button icon={<PlusOutlined />} onClick={() => setNewLangMode(true)}>
                        Добавить язык
                    </Button>
                )}
            </Space>

            <Tabs
                activeKey={activeLang}
                onChange={setActiveLang}
                type="card"
                items={tabItems}
            />

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="text"
                    label="Текст сообщения (поддержка HTML)"
                    rules={[{ required: true, message: 'Введите текст' }]}
                >
                    <Input.TextArea rows={6} />
                </Form.Item>

                <Form.List name="buttons">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'text']}
                                        rules={[{ required: true, message: 'Текст кнопки' }]}
                                    >
                                        <Input placeholder="Текст кнопки" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'url']}
                                        rules={[{ required: true, message: 'URL' }]}
                                    >
                                        <Input placeholder="https://..." />
                                    </Form.Item>
                                    <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
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

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {templates.find(t => t.language_code === activeLang) && (
                        <Popconfirm title="Удалить этот перевод?" onConfirm={handleDeleteTemplate}>
                            <Button danger>Удалить перевод</Button>
                        </Popconfirm>
                    )}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Сохранить
                        </Button>
                    </div>
                </div>
            </Form>
        </Card>
    );
};

export default MessageEditor;
