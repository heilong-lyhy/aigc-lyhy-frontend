// src/pages/blog-about/index.tsx

import { Avatar, Card, Typography } from 'antd';

import { ErrorState, LoadingSkeleton, useBlogProfile } from '@/features/blog';

import { PageHeader } from '@/shared/ui/page-header';

import { BlogLayout } from './blog-layout';

const { Text, Title, Paragraph } = Typography;

const PAGE_TITLE = '关于';
const PAGE_DESCRIPTION = '了解更多关于博主的信息';
/** 后端未就绪时使用 mock 数据兜底，待后端就绪后移除此标记 */
const USE_MOCK_FALLBACK = true;
const SOCIAL_LINKS_TITLE = '社交链接';
const NO_SOCIAL_LINKS = '暂无社交链接';

export function BlogAboutPage() {
  const { data: profile, isLoading, error } = useBlogProfile({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  return (
    <BlogLayout profile={profile}>
      <div className="page-stack">
        <PageHeader description={PAGE_DESCRIPTION} title={PAGE_TITLE} />

        {isLoading && <LoadingSkeleton />}

        {error && <ErrorState error={error} />}

        {profile && !isLoading && (
          <div className="flex flex-col gap-6">
            <Card>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <Avatar size={96} src={profile.avatar}>
                  {profile.nickname.charAt(0) || 'U'}
                </Avatar>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <Title level={3} style={{ margin: 0 }}>
                    {profile.nickname}
                  </Title>
                  <Paragraph type="secondary">{profile.bio}</Paragraph>
                </div>
              </div>
            </Card>

            {profile.socialLinks.length > 0 && (
              <Card title={SOCIAL_LINKS_TITLE}>
                <ul className="list-none p-0">
                  {profile.socialLinks.map((link) => (
                    <li key={link.platform} className="mb-2">
                      <a
                        className="text-text hover:text-primary"
                        href={link.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Text strong>{link.platform}</Text>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {profile.socialLinks.length === 0 && (
              <Card title={SOCIAL_LINKS_TITLE}>
                <Text type="secondary">{NO_SOCIAL_LINKS}</Text>
              </Card>
            )}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}
