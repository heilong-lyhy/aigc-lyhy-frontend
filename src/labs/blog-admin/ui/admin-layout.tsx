// src/labs/blog-admin/ui/admin-layout.tsx

import {
  CommentOutlined,
  DashboardOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
  LinkOutlined,
  SettingOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';

const { Content, Header, Sider } = Layout;

const LABEL_ADMIN = '管理端';
const LABEL_DASHBOARD = '仪表盘';
const LABEL_POSTS = '文章管理';
const LABEL_COMMENTS = '评论管理';
const LABEL_FILES = '文件管理';
const LABEL_TAGS = '标签管理';
const LABEL_FRIEND_LINKS = '友链管理';
const LABEL_TRASH = '回收站';
const LABEL_PROFILE = '个人设置';
const LABEL_BRAND = 'Blog Admin';

type AdminNavItem = {
  readonly icon: React.ReactNode;
  readonly key: string;
  readonly label: string;
  readonly path: string;
};

// Only include items whose routes are registered in src/app/router/index.tsx.
// Add items here when sub-routes (categories, tags, etc.) are implemented.
const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { icon: <DashboardOutlined />, key: 'dashboard', label: LABEL_DASHBOARD, path: '/admin' },
  { icon: <FileOutlined />, key: 'posts', label: LABEL_POSTS, path: '/admin/posts' },
  { icon: <DeleteOutlined />, key: 'trash', label: LABEL_TRASH, path: '/admin/trash' },
  { icon: <TagsOutlined />, key: 'tags', label: LABEL_TAGS, path: '/admin/tags' },
  { icon: <LinkOutlined />, key: 'friend-links', label: LABEL_FRIEND_LINKS, path: '/admin/friend-links' },
  { icon: <CommentOutlined />, key: 'comments', label: LABEL_COMMENTS, path: '/admin/comments' },
  { icon: <FolderOutlined />, key: 'files', label: LABEL_FILES, path: '/admin/files' },
  { icon: <SettingOutlined />, key: 'profile', label: LABEL_PROFILE, path: '/admin/profile' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = ADMIN_NAV_ITEMS.find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))?.key ?? 'dashboard';

  return (
    <div className="min-h-screen">
      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth={0}
          theme="light"
        >
          <div className="flex h-16 items-center justify-center border-b border-border">
            <span className="text-lg font-semibold">{LABEL_BRAND}</span>
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
          <Header className="blog-header-no-padding">
            <div className="flex h-full items-center border-b border-border bg-bg-container px-6">
              <span className="text-text-secondary text-sm">{LABEL_ADMIN}</span>
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
