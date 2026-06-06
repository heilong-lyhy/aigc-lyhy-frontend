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
  useAdminFiles,
  useAdminPosts,
  useAdminProfile,
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
  DashboardPage,
  FileManager,
  PostEditor,
  PostList,
  ProfileSettings,
} from '@/labs/blog-admin';
import { canAccessGame2048Lab, Game2048LabPage } from '@/labs/game-2048';
import { canAccessSandboxPlayground, SandboxPlaygroundPage } from '@/sandbox/playground';

/** 后端未就绪时使用 mock 数据兜底，待后端就绪后移除此标记 */
const USE_MOCK_FALLBACK = true;

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
      const ok = await remove(id);
      if (ok) {
        await refetch();
      }
    },
    [remove, refetch],
  );

  const handleTogglePublish = useCallback(
    async (id: string, status: BlogPostStatus) => {
      const ok = await update(id, { status });
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

  // Load existing post or draft when id changes
  useEffect(() => {
    if (id) {
      loadById(id)
        .then((post) => {
          if (post) {
            resetEditor({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              coverImage: post.coverImage ?? '',
              categoryId: post.categoryId,
              tags: post.tags,
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
      if (isNew) {
        const result = await create({
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage || null,
          categoryId: form.categoryId,
          tags: form.tags,
          status: form.status,
        });
        if (result) {
          clear();
          navigate(`/admin/posts/${result.id}`, { replace: true });
        }
      } else {
        const result = await update(id, {
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage || null,
          categoryId: form.categoryId,
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
      tags={tagsData}
      onBack={handleBack}
      onCategoryIdChange={editorSetters.setCategoryId}
      onContentChange={editorSetters.setContent}
      onCoverImageChange={editorSetters.setCoverImage}
      onExcerptChange={editorSetters.setExcerpt}
      onSave={handleSave}
      onSlugChange={editorSetters.setSlug}
      onStatusChange={editorSetters.setStatus}
      onTagsChange={editorSetters.setTags}
      onTitleChange={editorSetters.setTitle}
    />
  );
}

function AdminFileManagerPage() {
  const { isUploading, isDeleting, error, upload, remove } = useAdminFiles();

  // TODO(backend): 后端实现文件列表查询后替换为真实数据
  const files = [] as const;

  return (
    <FileManager
      error={error}
      files={files}
      isDeleting={isDeleting}
      isUploading={isUploading}
      onDelete={remove}
      onUpload={upload}
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
