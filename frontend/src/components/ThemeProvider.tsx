import { ConfigProvider, theme } from 'antd';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { rootFontSizePx } from '../scale/fluidRoot';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Drive Ant Design base fontSize from the same fluid viewport scale as CSS html font-size.
 * Layout density tokens (controlHeight, borderRadius) track that base so the shell scales overall.
 */
const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fontSize = useMemo(() => Math.round(rootFontSizePx(viewportWidth)), [viewportWidth]);
  // Ant Design default controlHeight ~32 at fontSize 14 → scale proportionally
  const controlHeight = useMemo(() => Math.round((fontSize / 14) * 32), [fontSize]);
  const borderRadius = useMemo(() => Math.max(6, Math.round((fontSize / 14) * 8)), [fontSize]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          colorBgContainer: '#1e293b',
          colorBgElevated: '#1e293b',
          colorBgLayout: '#0f172a',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          colorTextTertiary: '#64748b',
          colorBorder: '#334155',
          borderRadius,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize,
          controlHeight,
          sizeUnit: Math.max(3, Math.round((fontSize / 14) * 4)),
          sizeStep: 4,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;
