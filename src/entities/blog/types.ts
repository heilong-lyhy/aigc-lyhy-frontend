// src/entities/blog/types.ts

export type BlogPostStatus = 'draft' | 'published' | 'archived';

/** 博客文章（列表项，与后端 BlogPostObjectType 对齐） */
export interface BlogPost {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string | null;
  readonly coverImage: string | null;
  readonly status: BlogPostStatus;
  readonly categoryId: number | null;
  readonly categoryName: string | null;
  readonly isPinned: boolean;
  readonly viewCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly publishedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 上一篇/下一篇文章导航摘要 */
export interface PostNavigationItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
}

/** 博客文章详情（与后端 BlogPostDetailObjectType 对齐，比列表多 content/tags/renderedContent） */
export interface BlogPostDetail extends BlogPost {
  readonly content: string;
  readonly renderedContent: string | null;
  readonly tags: readonly BlogTag[];
  readonly prevPost?: PostNavigationItem;
  readonly nextPost?: PostNavigationItem;
}

/** 博客分类（与后端 BlogCategoryObjectType 对齐） */
export interface BlogCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly parentId: number | null;
  readonly sortOrder: number;
  readonly postCount: number;
  readonly children: readonly BlogCategory[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博客标签（与后端 BlogTagObjectType 对齐） */
export interface BlogTag {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BlogCommentStatus = 'pending' | 'approved' | 'rejected';

/** 博客评论（与后端 BlogCommentObjectType 对齐） */
export interface BlogComment {
  readonly id: string;
  readonly postId: number;
  readonly parentId: number | null;
  readonly replyToId: number | null;
  readonly authorName: string;
  readonly authorAvatar: string | null;
  readonly content: string;
  readonly status: BlogCommentStatus;
  readonly isAdminReply?: boolean;
  readonly nestingLevel: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博客点赞（与后端 toggleBlogPostLike 返回对齐） */
export interface BlogLike {
  readonly liked: boolean;
}

/** 博客文件（与后端 BlogFileObjectType 对齐） */
export interface BlogFile {
  readonly id: string;
  readonly originalName: string;
  readonly storedName: string;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly storagePath: string;
  readonly fileType: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博主信息（与后端 BlogProfileObjectType 对齐） */
export interface BlogProfile {
  readonly id: string;
  readonly nickname: string;
  readonly bio: string | null;
  readonly avatarUrl: string | null;
  readonly socialLinks: Record<string, string> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 博客仪表盘统计（与后端 BlogDashboardObjectType 对齐） */
export interface BlogDashboard {
  readonly totalPosts: number;
  readonly publishedPosts: number;
  readonly draftPosts: number;
  readonly totalCategories: number;
  readonly totalTags: number;
  readonly totalComments: number;
  readonly pendingComments: number;
  readonly totalLikes: number;
  readonly totalViews: number;
}

/** 文章编辑器表单状态 */
export interface PostEditorForm {
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly content: string;
  readonly coverImage: string;
  readonly categoryId: string;
  readonly tags: readonly string[];
  readonly status: BlogPostStatus;
}
