// src/app/router/index.tsx

import {
  createBrowserRouter,
  isRouteErrorResponse,
  redirect,
  RouterProvider,
  useRouteError,
} from 'react-router';

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
import { useBlogDashboard, useBlogTags } from '@/features/blog';
import { Error403, Error404, Error500, ErrorRouteCrash } from '@/features/error-feedback';

import { getAppEnv } from '@/shared/env';

import { AdminLayout, canAccessBlogAdminLab, DashboardPage } from '@/labs/blog-admin';
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
