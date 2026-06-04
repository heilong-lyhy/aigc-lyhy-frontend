// src/entities/blog/types.ts

export type BlogPostStatus = 'draft' | 'published' | 'archived';

/** 博客文章 */
export interface BlogPost {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly content: string;
  readonly coverImage: string | null;
  readonly categoryId: string;
  /** 标签 ID 列表，与 BlogTag.id 对应 */
  readonly tags: readonly string[];
  readonly authorId: string;
  readonly status: BlogPostStatus;
  readonly isPinned: boolean;
  readonly viewCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博客分类 */
export interface BlogCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly parentId: string | null;
  readonly sortOrder: number;
  readonly postCount: number;
  readonly createdAt: string;
}

/** 博客标签 */
export interface BlogTag {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
  readonly createdAt: string;
}

export type BlogCommentStatus = 'pending' | 'approved' | 'rejected';

/** 博客评论 */
export interface BlogComment {
  readonly id: string;
  readonly postId: string;
  readonly authorName: string;
  readonly authorEmail: string;
  readonly authorAvatar: string | null;
  readonly content: string;
  readonly status: BlogCommentStatus;
  readonly parentId: string | null;
  readonly replyToId: string | null;
  readonly nestingLevel: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BlogLikeTargetType = 'post' | 'comment';

/** 博客点赞 */
export interface BlogLike {
  readonly id: string;
  readonly targetType: BlogLikeTargetType;
  readonly targetId: string;
  readonly userId: string | null;
  readonly fingerprint: string | null;
  readonly createdAt: string;
}

/** 博客文件 */
export interface BlogFile {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
  readonly createdAt: string;
}

/** 社交链接 */
export interface BlogSocialLink {
  readonly platform: string;
  readonly url: string;
  /** 平台图标标识符，UI 组件按 platform 映射渲染 */
  readonly icon: string | null;
}

/** 博主信息 */
export interface BlogProfile {
  readonly id: string;
  readonly nickname: string;
  readonly avatar: string | null;
  readonly bio: string;
  readonly socialLinks: readonly BlogSocialLink[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博客仪表盘统计 */
export interface BlogDashboard {
  readonly totalPosts: number;
  readonly totalComments: number;
  readonly totalLikes: number;
  readonly totalViews: number;
  readonly recentPosts: readonly BlogPost[];
  readonly recentComments: readonly BlogComment[];
}
