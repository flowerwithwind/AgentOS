import React from 'react';
import { Spin, Empty, Result, Button } from 'antd';

interface PageStatusProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

const PageStatus: React.FC<PageStatusProps> = ({ loading, error, empty, emptyText = '暂无数据', onRetry, children }) => {
  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>;
  if (error) return <Result status="error" title="加载失败" subTitle={error} extra={onRetry && <Button onClick={onRetry}>重试</Button>} />;
  if (empty) return <Empty description={emptyText} style={{ padding: 40 }} />;
  return <>{children}</>;
};

export default PageStatus;
