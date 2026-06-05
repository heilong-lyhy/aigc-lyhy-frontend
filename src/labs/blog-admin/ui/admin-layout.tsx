// src/labs/blog-admin/ui/admin-layout.tsx

import {
  DashboardOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';

const { Content, Header, Sider } = Layout;

type AdminNavItem = {
  readonly icon: React.ReactNode;
  readonly key: string;
  readonly label: string;
  readonly path: string;
};

// Only include items whose routes are registered in src/app/router/index.tsx.
// Add items here when sub-routes (posts, categories, etc.) are implemented.
const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { icon: <DashboardOutlined />, key: 'dashboard', label: '仪表盘', path: '/admin' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = ADMIN_NAV_ITEMS.find((item) => location.pathname === item.path)?.key ?? 'dashboard';

  return (
    <div className="min-h-screen">
      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth={0}
          theme="light"
        >
          <div className="flex h-16 items-center justify-center border-b border-border">
            <span className="text-lg font-semibold">Blog Admin</span>
          </div>
          <Menu
            items={ADMIN_NAV_ITEMS.map((item) => ({
              icon: item.icon,
              key: item.key,
              label: item.label,
            }))}
            mode="inline"
            onClick={({ key }) => {
              const item = ADMIN_NAV_ITEMS.find((nav) => nav.key === key);
              if (item) {
                navigate(item.path);
              }
            }}
            selectedKeys={[selectedKey]}
          />
        </Sider>
        <Layout>
          <Header style={{ background: 'transparent', padding: 0 }}>
            <div className="flex h-full items-center border-b border-border bg-bg-container px-6">
              <span className="text-text-secondary text-sm">管理端</span>
            </div>
          </Header>
          <Content>
            <div className="bg-bg-layout p-6">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
