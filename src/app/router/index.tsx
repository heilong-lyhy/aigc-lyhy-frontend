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
import {
  AdminCategoryManagerPage,
  AdminCommentManagerPage,
  AdminDashboardPage,
  AdminFileManagerPage,
  AdminFriendLinkManagerPage,
  AdminLayout,
  AdminPostEditorPage,
  AdminPostListPage,
  AdminPostTrashPage,
  AdminProfileSettingsPage,
  AdminTagManagerPage,
} from '@/pages/admin';
import AuthPage from '@/pages/auth';
import { BlogAboutPage } from '@/pages/blog-about';
import { BlogArchivePage } from '@/pages/blog-archive';
import { BlogFriendsPage } from '@/pages/blog-friends';
import { BlogHomePage } from '@/pages/blog-home';
import { BlogPostPage } from '@/pages/blog-post';
import { BlogSearchPage } from '@/pages/blog-search';
import { ErrorPreviewPage } from '@/pages/error-preview';
import { HomePage } from '@/pages/home';
import { ProjectStructurePage } from '@/pages/project-structure';
import { Error403, Error404, Error500, ErrorRouteCrash } from '@/features/error-feedback';

import { getAppEnv } from '@/shared/env';

import { canAccessGame2048Lab, Game2048LabPage } from '@/labs/game-2048';
import { canAccessSandboxPlayground, SandboxPlaygroundPage } from '@/sandbox/playground';

// ── 路由错误边界 ──

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

// ── Lab / Sandbox 访问控制 ──

function game2048LabLoader() {
  if (!canAccessGame2048Lab(getAppEnv())) {
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

// ── 路由表 ──

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
        element: <BlogFriendsPage />,
        path: 'blog/friends',
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
            element: <AdminCategoryManagerPage />,
            path: 'categories',
          },
          {
            element: <AdminTagManagerPage />,
            path: 'tags',
          },
          {
            element: <AdminFriendLinkManagerPage />,
            path: 'friend-links',
          },
          {
            element: <AdminPostTrashPage />,
            path: 'trash',
          },
          {
            element: <AdminCommentManagerPage />,
            path: 'comments',
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
