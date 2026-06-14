// src/pages/admin/admin-post-editor-page.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router';

import {
  MarkdownRenderer,
  useAdminFiles,
  useAdminPosts,
  useAutoSave,
  useBlogCategories,
  useBlogTags,
  usePostEditor,
} from '@/features/blog';

import { toPaginationInput } from '@/entities/blog';

import { PostEditor } from './post-editor';

const USE_MOCK_FALLBACK = false;

export function AdminPostEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ readonly id: string }>();
  const isNew = !id;

  const { form, isDirty, lastSavedAt, markSaved, reset: resetEditor, ...editorSetters } = usePostEditor();
  const { save, load, clear } = useAutoSave({ enabled: true });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(!!id);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { create, loadById, mutationError, update } = useAdminPosts({
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
              isPinned: post.isPinned,
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
          isPinned: form.isPinned,
        });
        if (result) {
          clear();
          navigate(`/admin/posts/${result.id}`, { replace: true });
        } else if (mutationError) {
          void message.error(mutationError);
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
          isPinned: form.isPinned,
        });
        if (result) {
          clear();
          markSaved();
        } else if (mutationError) {
          void message.error(mutationError);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [isNew, id, form, create, update, clear, navigate, markSaved, mutationError]);

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
      onIsPinnedChange={editorSetters.setIsPinned}
      onTagsChange={editorSetters.setTags}
      onTitleChange={editorSetters.setTitle}
    />
  );
}
