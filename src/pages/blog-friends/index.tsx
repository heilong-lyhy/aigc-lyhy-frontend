// src/pages/blog-friends/index.tsx

import { Avatar, Card, Empty, Typography } from 'antd';

import {
  BlogLayout,
  ErrorState,
  LoadingSkeleton,
  useBlogFriendLinks,
  useBlogProfile,
} from '@/features/blog';

import type { BlogFriendLink } from '@/entities/blog';

import { PageHeader } from '@/shared/ui';

const { Text } = Typography;

const PAGE_TITLE = '友情链接';
const PAGE_DESCRIPTION = '我的朋友们';
const NO_FRIEND_LINKS = '暂无友链';

type FriendLinkCardProps = {
  readonly link: BlogFriendLink;
};

function FriendLinkCard({ link }: FriendLinkCardProps) {
  return (
    <a
      className="block transition-shadow hover:shadow-md"
      href={link.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Card hoverable size="small">
        <div className="flex items-center gap-3">
          <Avatar shape="square" size={40} src={link.avatar}>
            {link.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <Text strong ellipsis>
              {link.name}
            </Text>
            {link.description && (
              <Text className="text-xs" type="secondary">
                {link.description}
              </Text>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
}

export function BlogFriendsPage() {
  const { data: profile } = useBlogProfile({ autoLoad: true });
  const { data: links, isLoading, error } = useBlogFriendLinks({ autoLoad: true });

  return (
    <BlogLayout profile={profile}>
      <div className="page-stack">
        <PageHeader description={PAGE_DESCRIPTION} title={PAGE_TITLE} />

        {isLoading && <LoadingSkeleton />}

        {error && <ErrorState error={error} />}

        {!isLoading && !error && links.length === 0 && <Empty description={NO_FRIEND_LINKS} />}

        {!isLoading && !error && links.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <FriendLinkCard key={link.id} link={link} />
            ))}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}
