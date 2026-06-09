// src/app/router/index.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createBrowserRouter,
  isRouteErrorResponse,
  redirect,
  RouterProvider,
  useRouteError,
} from 'react-router';
import { useNavigate, useParams } from 'react-router';

import { AppLayout } from '@/app/layout';
import { AdminGuard } from '@/app/lib';

import AccountPage from '@/pages/account';
import AuthPage from '@/pages/auth';
import { BlogAboutPage } from '@/pages/blog-about';
import { BlogArchivePage } from '@/pages/blog-archive';
import { BlogHomePage } from '@/pages/blog-home';
import { BlogPostPage } from '@/pages/blog-post';
import { BlogSearchPage } from '@/pages/blog-search';
import { ErrorPreviewPage } from '@/pages/error-preview';
import { HomePage } from '@/pages/home';
import { ProjectStructurePage } from '@/pages/project-structure';
import { changePassword } from '@/features/auth';
import {
  MarkdownRenderer,
  useAdminComments,
  useAdminFiles,
  useAdminPosts,
  useAdminProfile,
  useAdminTags,
  useAutoSave,
  useBlogCategories,
  useBlogDashboard,
  useBlogTags,
  usePostEditor,
} from '@/features/blog';
import { Error403, Error404, Error500, ErrorRouteCrash } from '@/features/error-feedback';

import type { BlogPostStatus, PaginationInput } from '@/entities/blog';
import { toPaginationInput } from '@/entities/blog';

import { getAppEnv } from '@/shared/env';

import {
  AdminLayout,
  canAccessBlogAdminLab,
  CommentManager,
  DashboardPage,
  FileManager,
  PostEditor,
  PostList,
  ProfileSettings,
  TagManager,
} from '@/labs/blog-admin';
import { canAccessGame2048Lab, Game2048LabPage } from '@/labs/game-2048';
import { canAccessSandboxPlayground, SandboxPlaygroundPage } from '@/sandbox/playground';

const USE_MOCK_FALLBACK = false;

function AdminDashboardPage() {
  const { data, isLoading, error } = useBlogDashboard({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });
  const { data: tags, isLoading: isTagsLoading } = useBlogTags({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  if (isLoading || isTagsLoading) {
    return null;
  }

  if (error || !data) {
    return null;
  }

  return <DashboardPage data={data} tagCount={tags.length} />;
}

const DEFAULT_PAGE_SIZE = 10;

function AdminPostListPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationInput>(
    toPaginationInput(1, DEFAULT_PAGE_SIZE),
  );
  const [filterStatus, setFilterStatus] = useState<BlogPostStatus | undefined>();
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();

  const { data, isLoading, refetch, remove, update } = useAdminPosts({
    pagination,
    status: filterStatus,
    autoLoad: true,
  });

  const { data: categories = [] } = useBlogCategories({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const handleEdit = useCallback(
    (id: string) => {
      navigate(id === 'new' ? '/admin/posts/new' : `/admin/posts/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await remove(Number(id));
      if (ok) {
        await refetch();
      }
    },
    [remove, refetch],
  );

  const handleTogglePublish = useCallback(
    async (id: string, status: BlogPostStatus) => {
      const ok = await update({ id: Number(id), status });
      if (ok) {
        await refetch();
      }
    },
    [update, refetch],
  );

  return (
    <PostList
      categories={categories}
      data={data}
      filterCategoryId={filterCategoryId}
      filterStatus={filterStatus}
      isLoading={isLoading}
      pagination={pagination}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onFilterCategoryChange={setFilterCategoryId}
      onFilterStatusChange={setFilterStatus}
      onPaginationChange={setPagination}
      onTogglePublish={handleTogglePublish}
    />
  );
}

function AdminPostEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ readonly id: string }>();
  const isNew = !id;

  const { form, isDirty, lastSavedAt, markSaved, reset: resetEditor, ...editorSetters } = usePostEditor();
  const { save, load, clear } = useAutoSave({ enabled: true });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(!!id);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { create, loadById, update } = useAdminPosts({
    pagination: toPaginationInput(1, 1),
    autoLoad: false,
  });

  const { data: categories = [] } = useBlogCategories({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { data: tagsData = [] } = useBlogTags({
    autoLoad: true,
    useMockFallback: USE_MOCK_FALLBACK,
  });

  const { upload: uploadFile } = useAdminFiles({ autoLoad: false });

  // Load existing post or draft when id changes
  useEffect(() => {
    if (id) {
      loadById(Number(id))
        .then((post) => {
          if (post) {
            resetEditor({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt ?? '',
              content: post.content,
              coverImage: post.coverImage ?? '',
              categoryId: post.categoryId != null ? String(post.categoryId) : '',
              tags: post.tags.map((t) => t.id),
              status: post.status,
            });
          }
        })
        .finally(() => setIsLoadingPost(false));
    } else {
      resetEditor();
      const draft = load();
      if (draft) {
        resetEditor({
          title: draft.title,
          content: draft.content,
          categoryId: draft.categoryId ?? '',
          tags: draft.tags,
        }, draft.savedAt);
      }
    }
  }, [id, loadById, load, resetEditor]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveTimerRef.current !== null) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      save({
        title: form.title,
        content: form.content,
        categoryId: form.categoryId || null,
        tags: form.tags,
      });
      markSaved();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current !== null) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form.title, form.content, form.categoryId, form.tags, isDirty, save, markSaved]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const categoryId = form.categoryId ? Number(form.categoryId) : undefined;
      if (isNew) {
        const result = await create({
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage || null,
          categoryId,
          tags: form.tags,
          status: form.status,
        });
        if (result) {
          clear();
          navigate(`/admin/posts/${result.id}`, { replace: true });
        }
      } else {
        const result = await update({
          id: Number(id),
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage || null,
          categoryId,
          tags: form.tags,
          status: form.status,
        });
        if (result) {
          clear();
          resetEditor();
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [isNew, id, form, create, update, clear, navigate, resetEditor]);

  const handleBack = useCallback(() => {
    navigate('/admin/posts');
  }, [navigate]);

  return (
    <PostEditor
      categories={categories}
      form={form}
      isDirty={isDirty}
      isLoading={isLoadingPost}
      isSaving={isSaving}
      lastSavedAt={lastSavedAt}
      markdownRenderer={MarkdownRenderer}
      tags={tagsData}
      onBack={handleBack}
      onCategoryIdChange={editorSetters.setCategoryId}
      onContentChange={editorSetters.setContent}
      onCoverImageChange={editorSetters.setCoverImage}
      onCoverImageUpload={async (file) => {
        const result = await uploadFile(file);
        return result?.storagePath ?? '';
      }}
      onExcerptChange={editorSetters.setExcerpt}
      onSave={handleSave}
      onSlugChange={editorSetters.setSlug}
      onStatusChange={editorSetters.setStatus}
      onTagsChange={editorSetters.setTags}
      onTitleChange={editorSetters.setTitle}
    />
  );
}

function AdminCommentManagerPage() {
  const [commentPagination, setCommentPagination] = useState<PaginationInput>({ page: 1, pageSize: 10 });

  const { data, isLoading, refetch, updateStatus, remove } = useAdminComments({
    pagination: commentPagination,
    autoLoad: true,
  });

  const handleApprove = useCallback((id: string) => {
    void updateStatus(Number(id), 'approved').then(() => void refetch());
  }, [updateStatus, refetch]);

  const handleReject = useCallback((id: string) => {
    void updateStatus(Number(id), 'rejected').then(() => void refetch());
  }, [updateStatus, refetch]);

  // 当前 BlogCommentStatus 无 'spam' 状态，标记垃圾暂映射为 rejected
  const handleMarkSpam = handleReject;

  const handleDelete = useCallback((id: string) => {
    void remove(Number(id));
  }, [remove]);

  const handleBatchApprove = useCallback((ids: readonly string[]) => {
    void Promise.all(ids.map((id) => updateStatus(Number(id), 'approved'))).then(() => void refetch());
  }, [updateStatus, refetch]);

  const handleBatchReject = useCallback((ids: readonly string[]) => {
    void Promise.all(ids.map((id) => updateStatus(Number(id), 'rejected'))).then(() => void refetch());
  }, [updateStatus, refetch]);

  return (
    <CommentManager
      data={data}
      isLoading={isLoading}
      pagination={commentPagination}
      onPaginationChange={setCommentPagination}
      onApprove={handleApprove}
      onReject={handleReject}
      onMarkSpam={handleMarkSpam}
      onDelete={handleDelete}
      onBatchApprove={handleBatchApprove}
      onBatchReject={handleBatchReject}
    />
  );
}

function AdminFileManagerPage() {
  const { files, isLoadingFiles, isUploading, isDeleting, error, upload, remove, refetchFiles } = useAdminFiles();

  const fileList = files?.items ?? [];

  return (
    <FileManager
      error={error}
      files={fileList}
      isDeleting={isDeleting}
      isLoading={isLoadingFiles}
      isUploading={isUploading}
      onDelete={(id) => remove(Number(id))}
      onRefetch={() => void refetchFiles()}
      onUpload={upload}
    />
  );
}

function AdminTagManagerPage() {
  const [tagPagination, setTagPagination] = useState<PaginationInput>(toPaginationInput(1, DEFAULT_PAGE_SIZE));
  const { data, isLoading, create, update, remove } = useAdminTags({ autoLoad: true });

  const tagData = data.length > 0
    ? { items: data, total: data.length, current: tagPagination.page, pageSize: tagPagination.pageSize }
    : null;

  const handleCreate = useCallback(
    (input: { readonly name: string; readonly slug: string }) => {
      void create(input);
    },
    [create],
  );

  const handleUpdate = useCallback(
    (id: string, input: { readonly name: string; readonly slug: string }) => {
      void update({ id: Number(id), ...input });
    },
    [update],
  );

  const handleDelete = useCallback(
    (id: string) => {
      void remove(Number(id));
    },
    [remove],
  );

  return (
    <TagManager
      data={tagData}
      isLoading={isLoading}
      pagination={tagPagination}
      onPaginationChange={setTagPagination}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

function AdminProfileSettingsPage() {
  const { data, isLoading, mutationError, load, update } = useAdminProfile();

  useEffect(() => {
    void load();
  }, [load]);

  const handleChangePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        const result = await changePassword(currentPassword, newPassword);
        return { ok: result.success, message: result.message ?? undefined };
      } catch {
        return { ok: false, message: '密码修改失败' };
      }
    },
    [],
  );

  return (
    <ProfileSettings
      isLoading={isLoading}
      mutationError={mutationError}
      profile={data}
      onChangePassword={handleChangePassword}
      onUpdateProfile={update}
    />
  );
}

function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) {
      return <Error403 />;
    }

    if (error.status === 404) {
      return <Error404 />;
    }

    if (error.status >= 500) {
      return <Error500 />;
    }
  }

  return <ErrorRouteCrash />;
}

function RouteErrorBoundary() {
  return (
    <AppLayout>
      <RouteErrorPage />
    </AppLayout>
  );
}

function game2048LabLoader() {
  if (!canAccessGame2048Lab(getAppEnv())) {
    throw redirect('/');
  }

  return null;
}

function blogAdminLoader() {
  if (!canAccessBlogAdminLab(getAppEnv())) {
    throw redirect('/');
  }

  return null;
}

function sandboxPlaygroundLoader() {
  if (!canAccessSandboxPlayground(getAppEnv())) {
    throw redirect('/');
  }

  return null;
}

const router = createBrowserRouter([
  {
    children: [
      {
        element: <HomePage />,
        index: true,
      },
      {
        element: <AuthPage />,
        path: 'auth',
      },
      {
        element: <BlogHomePage />,
        path: 'blog',
      },
      // Static paths must be registered before dynamic params (e.g. blog/:slug)
      // to avoid being swallowed by the wildcard segment
      {
        element: <BlogSearchPage />,
        path: 'blog/search',
      },
      {
        element: <BlogArchivePage />,
        path: 'blog/archive',
      },
      {
        element: <BlogAboutPage />,
        path: 'blog/about',
      },
      {
        element: <BlogPostPage />,
        path: 'blog/:slug',
      },
      {
        element: <AccountPage />,
        path: 'account',
      },
      {
        element: <ProjectStructurePage />,
        path: 'project-structure',
      },
      {
        element: <ErrorPreviewPage />,
        path: 'error-preview',
      },
      {
        element: <Game2048LabPage />,
        loader: game2048LabLoader,
        path: 'labs/game-2048',
      },
      {
        children: [
          {
            element: <AdminDashboardPage />,
            index: true,
          },
          {
            element: <AdminPostListPage />,
            path: 'posts',
          },
          {
            element: <AdminPostEditorPage />,
            path: 'posts/new',
          },
          {
            element: <AdminPostEditorPage />,
            path: 'posts/:id',
          },
          {
            element: <AdminFileManagerPage />,
            path: 'files',
          },
          {
            element: <AdminTagManagerPage />,
            path: 'tags',
          },
          {
            element: <AdminCommentManagerPage />,
            path: 'comments',
          },
          {
            element: <AdminProfileSettingsPage />,
            path: 'profile',
          },
        ],
        element: (
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        ),
        loader: blogAdminLoader,
        path: 'admin',
      },
      {
        element: <SandboxPlaygroundPage />,
        loader: sandboxPlaygroundLoader,
        path: 'sandbox/playground',
      },
      {
        element: <Error404 />,
        path: '*',
      },
    ],
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    path: '/',
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
