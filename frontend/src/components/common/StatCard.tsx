import React from 'react';
import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: ReactNode;
  suffix?: string;
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, onClick, loading = false }) => {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ borderRadius: 12, cursor: onClick ? 'pointer' : 'default', background: '#1e293b', border: '1px solid #334155' }}
    >
      <Statistic title={title} value={value} prefix={prefix} suffix={suffix} loading={loading} />
    </Card>
  );
};

export default React.memo(StatCard);
