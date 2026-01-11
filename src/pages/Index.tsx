import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardView } from "@/components/views/DashboardView";
import { OnboardingView } from "@/components/views/OnboardingView";
import { WatchView } from "@/components/views/WatchView";
import { CalendarView } from "@/components/views/CalendarView";
import { PostsView } from "@/components/views/PostsView";
import { MyPostsView } from "@/components/views/MyPostsView";
import { MetricsView } from "@/components/views/MetricsView";
import { SettingsView } from "@/components/views/SettingsView";
import { InspirationView } from "@/components/views/InspirationView";
import { IdeasView, PostIdea } from "@/components/views/IdeasView";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAppStore } from "@/store/appStore";
import { AppView, BrandProfile, Post } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBrandProfile } from "@/hooks/useBrandProfile";
import { useWatchItems } from "@/hooks/useWatchItems";
import { useCalendarItems } from "@/hooks/useCalendarItems";
import { usePosts } from "@/hooks/usePosts";

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const { currentView, setCurrentView, setPrefillPostData } = useAppStore();

  // Brand profile hook
  const { brandProfile, loading: profileLoading, saveBrandProfile } = useBrandProfile();
  
  // Data hooks - only fetch when we have a brand profile
  const { watchItems, saveWatchItems } = useWatchItems(brandProfile?.id);
  const { calendarItems, saveCalendarItems } = useCalendarItems(brandProfile?.id);
  const { posts, savePost, deletePost } = usePosts(brandProfile?.id);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);

  // Show auth form if not authenticated
  if (!authLoading && !user) {
    return <AuthForm />;
  }

  // Show loading state
  if (authLoading || profileLoading) {
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
      setCurrentView('inspiration'); // Navigate to inspiration after onboarding
      toast({
        title: "Profil créé avec succès ! 🎉",
        description: "Découvrez vos inspirations personnalisées.",
      });
    }
  };

  const handleNavigate = (view: AppView) => {
    if (!brandProfile && view !== 'dashboard' && view !== 'settings') {
      toast({
        title: "Configuration requise",
        description: "Veuillez d'abord configurer votre profil éditorial.",
        variant: "destructive",
      });
      return;
    }
    setCurrentView(view);
  };

  const handleUseIdea = (idea: PostIdea) => {
    setPrefillPostData({
      topic: idea.title,
      category: idea.category,
    });
    setCurrentView('posts');
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const handleAddPost = async (post: Post) => {
    await savePost(post);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  const handleToggleFavorite = (postId: string) => {
    setFavoritePostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleEditPost = (post: Post) => {
    setPrefillPostData({
      topic: post.content.slice(0, 100),
      category: post.tone as any,
    });
    setCurrentView('posts');
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
      case 'inspiration':
        return brandProfile ? (
          <InspirationView
            brandProfile={brandProfile}
            onNavigateToPost={() => handleNavigate('posts')}
          />
        ) : null;
      case 'ideas':
        return brandProfile ? (
          <IdeasView
            brandProfile={brandProfile}
            onUseIdea={handleUseIdea}
          />
        ) : null;
      case 'watch':
        return brandProfile ? (
          <WatchView
            brandProfile={brandProfile}
            watchItems={watchItems}
            onAddWatchItem={() => {}}
            onSaveItems={saveWatchItems}
          />
        ) : null;
      case 'calendar':
        return brandProfile ? (
          <CalendarView
            brandProfile={brandProfile}
            calendarItems={calendarItems}
            onAddCalendarItem={() => {}}
            onSaveItems={saveCalendarItems}
          />
        ) : null;
      case 'posts':
        return brandProfile ? (
          <PostsView
            brandProfile={brandProfile}
            posts={posts}
            onAddPost={handleAddPost}
            onUpdatePost={async (id, updates) => {
              const existingPost = posts.find(p => p.id === id);
              if (existingPost) {
                await savePost({ ...existingPost, ...updates });
              }
            }}
          />
        ) : null;
      case 'my-posts':
        return brandProfile ? (
          <MyPostsView
            posts={posts}
            onCreatePost={() => setCurrentView('posts')}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onToggleFavorite={handleToggleFavorite}
            favorites={favoritePostIds}
          />
        ) : null;
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
    >
      {renderView()}
    </MainLayout>
  );
};

export default Index;
