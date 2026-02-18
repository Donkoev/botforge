import React from 'react';
import { Table, Tag, Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { BotUser } from '../api/users';
import { formatDate } from '../utils/helpers';
import { ColumnsType } from 'antd/es/table';

interface UserTableProps {
    users: BotUser[];
    loading: boolean;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    onChange: (pagination: any) => void;
    // bots: import('../api/bots').Bot[]; // Removed as sources are now strings in user object
    onDelete?: (id: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, loading, pagination, onChange, onDelete }) => {
    const columns: ColumnsType<BotUser> = [
        {
            title: 'ID',
            dataIndex: 'telegram_id',
            key: 'telegram_id',
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (u) => u ? <a href={`https://t.me/${u}`} target="_blank" rel="noreferrer">@{u}</a> : '-',
        },
        {
            title: 'Имя',
            key: 'name',
            render: (_, record) => `${record.first_name || ''} ${record.last_name || ''}`.trim() || '-',
        },
        {
            title: 'Язык',
            dataIndex: 'language_code',
            key: 'language_code',
            render: (code) => code ? <Tag color="default" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}>{code.toUpperCase()}</Tag> : '-'
        },
        {
            title: 'Источники',
            dataIndex: 'sources',
            key: 'sources',
            render: (sources: string[]) => (
                <>
                    {sources && sources.map((botName, index) => (
                        <Tag key={index} color="processing" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none', marginRight: 4 }}>
                            {botName}
                        </Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Статус',
            dataIndex: 'is_blocked',
            key: 'is_blocked',
            render: (blocked) => blocked ? <Tag color="error">Заблокирован</Tag> : <Tag color="success">Активен</Tag>
        },
        {
            title: 'Первый визит',
            dataIndex: 'first_seen_at',
            key: 'first_seen_at',
            render: (d) => <span style={{ color: 'rgba(255,255,255,0.6)' }}>{formatDate(d)}</span>,
        },
        {
            title: 'Последний визит',
            dataIndex: 'last_seen_at',
            key: 'last_seen_at',
            render: (d) => formatDate(d),
            sorter: (a, b) => new Date(a.last_seen_at).getTime() - new Date(b.last_seen_at).getTime(),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                        Modal.confirm({
                            title: 'Удалить пользователя?',
                            content: `Вы уверены, что хотите удалить пользователя ${record.first_name || record.username || record.telegram_id}?`,
                            okText: 'Удалить',
                            cancelText: 'Отмена',
                            okType: 'danger',
                            className: 'glass-modal-confirm',
                            centered: true,
                            icon: <div style={{ color: '#ff4d4f', marginRight: 12, fontSize: 22 }}>⚠️</div>,
                            maskClosable: true,
                            onOk: () => onDelete && onDelete(record.id),
                            cancelButtonProps: { size: 'large' },
                            okButtonProps: { size: 'large' }
                        });
                    }}
                />
            ),
        }
    ];

    return (
        <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={{
                ...pagination,
                showSizeChanger: true,
            }}
            loading={loading}
            onChange={onChange}
            scroll={{ x: 800 }}
        />
    );
};

export default UserTable;
