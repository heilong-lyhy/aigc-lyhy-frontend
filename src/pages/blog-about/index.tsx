// src/pages/blog-about/index.tsx

import { Avatar, Card, Typography } from 'antd';

import { BlogLayout } from '@/widgets/blog-shell';
import { ErrorState, LoadingSkeleton, useBlogProfile } from '@/features/blog';

import { PageHeader } from '@/shared/ui';

const { Text, Title, Paragraph } = Typography;

const PAGE_TITLE = '关于';
const PAGE_DESCRIPTION = '了解更多关于博主的信息';
const USE_MOCK_FALLBACK = false;
const SOCIAL_LINKS_TITLE = '社交链接';
const NO_SOCIAL_LINKS = '暂无社交链接';

export function BlogAboutPage() {
  const {
    data: profile,
    isLoading,
    error,
  } = useBlogProfile({
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
                <Avatar size={96} src={profile.avatarUrl}>
                  {profile.nickname.charAt(0) || 'U'}
                </Avatar>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <div className="blog-typography-no-margin">
                    <Title level={3}>{profile.nickname}</Title>
                  </div>
                  <Paragraph type="secondary">{profile.bio}</Paragraph>
                </div>
              </div>
            </Card>

            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <Card title={SOCIAL_LINKS_TITLE}>
                <ul className="list-none p-0">
                  {Object.entries(profile.socialLinks).map(([platform, url]) => (
                    <li key={platform} className="mb-2">
                      <a
                        className="text-text hover:text-primary"
                        href={url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Text strong>{platform}</Text>
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {(!profile.socialLinks || Object.keys(profile.socialLinks).length === 0) && (
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
