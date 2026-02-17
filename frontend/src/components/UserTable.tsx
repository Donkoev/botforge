// frontend/src/components/UserTable.tsx
import React from 'react';
import { Table, Tag } from 'antd';
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
    bots: import('../api/bots').Bot[];
}

const UserTable: React.FC<UserTableProps> = ({ users, loading, pagination, onChange, bots }) => {
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
            title: 'Источник',
            dataIndex: 'source_bot_id',
            key: 'source_bot_id',
            render: (id) => {
                const botName = bots.find(b => b.id === id)?.name || `Bot #${id}`;
                return <Tag color="processing" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: 'none' }}>{botName}</Tag>;
            },
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
