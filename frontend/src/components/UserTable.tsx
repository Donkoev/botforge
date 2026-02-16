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
}

const UserTable: React.FC<UserTableProps> = ({ users, loading, pagination, onChange }) => {
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
            render: (code) => code ? <Tag>{code.toUpperCase()}</Tag> : '-'
        },
        {
            title: 'Источник',
            dataIndex: 'source_bot_id',
            key: 'source_bot_id',
            // In real app, we might want to map ID to Bot Name here or fetch bot details
            render: (id) => <Tag color="blue">Bot #{id}</Tag>,
        },
        {
            title: 'Статус',
            dataIndex: 'is_blocked',
            key: 'is_blocked',
            render: (blocked) => blocked ? <Tag color="error">Blocked</Tag> : <Tag color="success">Active</Tag>
        },
        {
            title: 'Первый визит',
            dataIndex: 'first_seen_at',
            key: 'first_seen_at',
            render: (d) => formatDate(d),
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
