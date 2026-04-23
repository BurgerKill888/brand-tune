import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardView } from "@/components/views/DashboardView";
import { OnboardingView } from "@/components/views/OnboardingView";
import { WatchView } from "@/components/views/WatchView";
import { CalendarView } from "@/components/views/CalendarView";
import { PostsView } from "@/components/views/PostsView";
import { MyPostsView } from "@/components/views/MyPostsView";
import { MetricsView } from "@/components/views/MetricsView";
import { SettingsView } from "@/components/views/SettingsView";
import { IdeasView } from "@/components/views/IdeasView";
import { FreePostView } from "@/components/views/FreePostView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { useAppStore } from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { AppView, BrandProfile, Post } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { useWatchItems } from "@/hooks/useWatchItems";
import { useCalendarItems } from "@/hooks/useCalendarItems";
import { usePosts } from "@/hooks/usePosts";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { currentView, setCurrentView, setPrefillPostData } = useAppStore();

  // Brand profile hook
  const { brandProfile, loading: profileLoading, saveBrandProfile } = useBrandProfile();
  
  // Data hooks - only fetch when we have a brand profile
  const { watchItems, saveWatchItems } = useWatchItems(brandProfile?.id);
  const { calendarItems, saveCalendarItems } = useCalendarItems(brandProfile?.id);
  const { posts, savePost, updatePost, deletePost } = usePosts(brandProfile?.id);
  const { scheduledPosts } = useScheduledPosts(brandProfile?.id);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [ideasCount, setIdeasCount] = useState(0);
  const [draftsCount, setDraftsCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Count ideas, drafts and scheduled for sidebar badges
  useEffect(() => {
    try {
      const savedIdeas = localStorage.getItem('captured_ideas');
      if (savedIdeas) {
        setIdeasCount(JSON.parse(savedIdeas).length);
      }
    } catch (e) {}
    
    // Count drafts from posts
    const drafts = posts.filter(p => p.status === 'draft');
    setDraftsCount(drafts.length);
    
    // Count scheduled posts
    const scheduled = scheduledPosts.filter(p => p.status === 'scheduled');
    setScheduledCount(scheduled.length);
  }, [posts, scheduledPosts]);

  // Auto sign-in anonymously if no user
  useEffect(() => {
    if (!authLoading && !user) {
      supabase.auth.signInAnonymously();
    }
  }, [authLoading, user]);

  // Show loading state
  if (authLoading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleCompleteOnboarding = async (profile: BrandProfile) => {
    const { error } = await saveBrandProfile(profile);
    if (!error) {
      setShowOnboarding(false);
      setCurrentView('dashboard');
      toast({
        title: "Profil créé avec succès ! 🎉",
        description: "Bienvenue sur True Content. Commencez par partager une réflexion.",
      });
    }
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const handleSavePost = async (post: Partial<Post>) => {
    if (!brandProfile) return { error: new Error("No profile") };
    
    const fullPost: Post = {
      id: post.id || crypto.randomUUID(),
      brandProfileId: brandProfile.id,
      content: post.content || "",
      variants: post.variants || [],
      suggestions: post.suggestions || [],
      readabilityScore: post.readabilityScore || 0,
      editorialJustification: post.editorialJustification || "",
      length: post.length || 'medium',
      tone: post.tone || brandProfile.tone,
      cta: post.cta,
      keywords: post.keywords || [],
      hashtags: post.hashtags || [],
      status: post.status || 'draft',
      type: (post as any).type,
      metadata: (post as any).metadata,
      createdAt: post.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    return savePost(fullPost);
  };

  const handleUpdatePost = async (id: string, updates: Partial<Post>) => {
    const existingPost = posts.find(p => p.id === id);
    if (existingPost && updatePost) {
      return updatePost(id, updates);
    }
    return { error: new Error("Post not found") };
  };

  const handleDeletePost = async (id: string) => {
    return deletePost(id);
  };

  const handleToggleFavorite = (postId: string) => {
    setFavoritePostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleEditPost = (post: Post) => {
    setPrefillPostData({
      topic: post.content.slice(0, 200),
      category: post.tone as any,
    });
    setCurrentView('posts');
  };

  // Profil de secours si aucun n'est configuré, pour permettre l'usage immédiat
  const effectiveProfile: BrandProfile = brandProfile || {
    id: 'default',
    userId: user?.id || 'anon',
    companyName: 'Mon profil',
    sector: 'général',
    targets: [],
    businessObjectives: [],
    tone: 'mixed',
    values: [],
    forbiddenWords: [],
    examplePosts: [],
    publishingFrequency: 'weekly',
    kpis: [],
    editorialCharter: {
      audience: '',
      positioning: '',
      tone: '',
      doList: [],
      dontList: [],
      kpis: [],
      writingStyle: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const renderView = () => {
    if (showOnboarding) {
      return <OnboardingView onComplete={handleCompleteOnboarding} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            brandProfile={brandProfile}
            watchItems={watchItems}
            calendarItems={calendarItems}
            posts={posts}
            onStartOnboarding={handleStartOnboarding}
            onNavigate={handleNavigate}
          />
        );
      case 'ideas':
        return (
          <IdeasView
            brandProfile={brandProfile}
            onNavigate={handleNavigate}
          />
        );
      case 'watch':
        return (
          <WatchView
            brandProfile={effectiveProfile}
            items={watchItems}
            onSaveItems={saveWatchItems}
            onNavigate={(view) => setCurrentView(view)}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            brandProfile={effectiveProfile}
            calendarItems={calendarItems}
            onAddCalendarItem={() => {}}
            onSaveItems={saveCalendarItems}
          />
        );
      case 'posts':
        return (
          <PostsView
            brandProfile={effectiveProfile}
            posts={posts}
            onSavePost={handleSavePost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onPublishPost={async () => {}}
            onNavigateToCalendar={() => setCurrentView('calendar')}
          />
        );
      case 'free-post':
        return (
          <FreePostView
            brandProfile={effectiveProfile}
            onSavePost={handleSavePost}
          />
        );
      case 'my-posts':
        return (
          <MyPostsView
            posts={posts}
            onCreatePost={() => setCurrentView('posts')}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onUpdatePost={handleUpdatePost}
            onToggleFavorite={handleToggleFavorite}
            favorites={favoritePostIds}
            brandProfileId={effectiveProfile.id}
            authorName={effectiveProfile.companyName}
            authorTitle={`Expert ${effectiveProfile.sector}`}
          />
        );
      case 'metrics':
        return (
          <MetricsView
            posts={posts}
            calendarItems={calendarItems}
          />
        );
      case 'settings':
        return (
          <SettingsView
            brandProfile={brandProfile}
            onSignOut={handleSignOut}
            userEmail={user?.email}
            onSaveBrandProfile={saveBrandProfile}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            brandProfile={brandProfile}
            postsCount={posts.length}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      hasProfile={!!brandProfile}
      onSignOut={handleSignOut}
      ideasCount={ideasCount}
      draftsCount={draftsCount}
      scheduledCount={scheduledCount}
    >
      {renderView()}
    </MainLayout>
  );
};

export default Index;
