// src/pages/admin/dashboard.tsx

import {
  CommentOutlined,
  FileOutlined,
  HeartOutlined,
  ReadOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Statistic, Typography } from 'antd';

import type { BlogDashboard } from '@/entities/blog';

const { Title } = Typography;

const LABEL_PAGE_TITLE = '仪表盘';
const LABEL_POSTS = '文章数';
const LABEL_COMMENTS = '评论数';
const LABEL_TAGS = '标签数';
const LABEL_VIEWS = '阅读量';
const LABEL_LIKES = '点赞数';

type DashboardPageProps = {
  readonly data: BlogDashboard;
  readonly tagCount: number;
};

export function DashboardPage({ data, tagCount }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="blog-typography-no-margin">
        <Title level={3}>
          {LABEL_PAGE_TITLE}
        </Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<FileOutlined />}
              title={LABEL_POSTS}
              value={data.totalPosts}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<CommentOutlined />}
              title={LABEL_COMMENTS}
              value={data.totalComments}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<TagsOutlined />}
              title={LABEL_TAGS}
              value={tagCount}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<ReadOutlined />}
              title={LABEL_VIEWS}
              value={data.totalViews}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<HeartOutlined />}
              title={LABEL_LIKES}
              value={data.totalLikes}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
