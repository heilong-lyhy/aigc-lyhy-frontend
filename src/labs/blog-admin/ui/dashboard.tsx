// src/labs/blog-admin/ui/dashboard.tsx

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

type DashboardPageProps = {
  readonly data: BlogDashboard;
  readonly tagCount: number;
};

export function DashboardPage({ data, tagCount }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <Title level={3} style={{ margin: 0 }}>
        仪表盘
      </Title>

      <Row gutter={[16, 16]}>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<FileOutlined />}
              title="文章数"
              value={data.totalPosts}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<CommentOutlined />}
              title="评论数"
              value={data.totalComments}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<TagsOutlined />}
              title="标签数"
              value={tagCount}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<ReadOutlined />}
              title="阅读量"
              value={data.totalViews}
            />
          </Card>
        </Col>
        <Col sm={12} xs={24}>
          <Card>
            <Statistic
              prefix={<HeartOutlined />}
              title="点赞数"
              value={data.totalLikes}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
