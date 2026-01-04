import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardView } from "@/components/views/DashboardView";
import { OnboardingView } from "@/components/views/OnboardingView";
import { WatchView } from "@/components/views/WatchView";
import { CalendarView } from "@/components/views/CalendarView";
import { PostsView } from "@/components/views/PostsView";
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
  const { currentView, setCurrentView } = useAppStore();

  // Brand profile hook
  const { brandProfile, loading: profileLoading, saveBrandProfile } = useBrandProfile();
  
  // Data hooks - only fetch when we have a brand profile
  const { watchItems, saveWatchItems } = useWatchItems(brandProfile?.id);
  const { calendarItems, saveCalendarItems } = useCalendarItems(brandProfile?.id);
  const { posts, savePost } = usePosts(brandProfile?.id);

  const [showOnboarding, setShowOnboarding] = useState(false);

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
      setCurrentView('dashboard');
      toast({
        title: "Profil créé avec succès ! 🎉",
        description: "Votre stratégie éditoriale est prête.",
      });
    }
  };

  const handleNavigate = (view: AppView) => {
    if (!brandProfile && view !== 'dashboard') {
      toast({
        title: "Configuration requise",
        description: "Veuillez d'abord configurer votre profil éditorial.",
        variant: "destructive",
      });
      return;
    }
    setCurrentView(view);
  };

  const handleAddPost = async (post: Post) => {
    await savePost(post);
  };

  const handleUpdatePost = async (id: string, updates: Partial<Post>) => {
    const existingPost = posts.find(p => p.id === id);
    if (existingPost) {
      await savePost({ ...existingPost, ...updates });
    }
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
            onUpdatePost={handleUpdatePost}
          />
        ) : null;
      case 'settings':
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Paramètres
            </h2>
            <p className="text-muted-foreground">
              Page en cours de développement
            </p>
          </div>
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
    >
      {renderView()}
    </MainLayout>
  );
};

export default Index;
