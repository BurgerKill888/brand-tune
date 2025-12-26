import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardView } from "@/components/views/DashboardView";
import { OnboardingView } from "@/components/views/OnboardingView";
import { WatchView } from "@/components/views/WatchView";
import { CalendarView } from "@/components/views/CalendarView";
import { PostsView } from "@/components/views/PostsView";
import { useAppStore } from "@/store/appStore";
import { AppView, BrandProfile, WatchItem, CalendarItem, Post } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const {
    currentView,
    setCurrentView,
    brandProfile,
    setBrandProfile,
    watchItems,
    addWatchItem,
    calendarItems,
    addCalendarItem,
    posts,
    addPost,
    updatePost,
  } = useAppStore();

  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleCompleteOnboarding = (profile: BrandProfile) => {
    setBrandProfile(profile);
    setShowOnboarding(false);
    setCurrentView('dashboard');
    toast({
      title: "Profil créé avec succès ! 🎉",
      description: "Votre stratégie éditoriale est prête.",
    });
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
            onAddWatchItem={addWatchItem}
          />
        ) : null;
      case 'calendar':
        return brandProfile ? (
          <CalendarView
            brandProfile={brandProfile}
            calendarItems={calendarItems}
            onAddCalendarItem={addCalendarItem}
          />
        ) : null;
      case 'posts':
        return brandProfile ? (
          <PostsView
            brandProfile={brandProfile}
            posts={posts}
            onAddPost={addPost}
            onUpdatePost={updatePost}
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
