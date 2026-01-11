import { 
  LayoutDashboard, 
  Lightbulb,
  PenLine,
  FileText,
  Calendar,
  Newspaper,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Circle,
  Edit3,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppView } from "@/types";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  hasProfile: boolean;
  onSignOut?: () => void;
  ideasCount?: number;
  draftsCount?: number;
  scheduledCount?: number;
}

// Navigation groupée et simplifiée
const navGroups = [
  {
    label: "Général",
    items: [
      { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'ideas' as AppView, label: 'Mes idées', icon: Lightbulb, showBadge: true },
    ]
  },
  {
    label: "Création",
    items: [
      { id: 'posts' as AppView, label: 'Nouvelle réflexion', icon: PenLine, highlight: true },
      { id: 'free-post' as AppView, label: 'Nouveau post', icon: Edit3 },
      { id: 'my-posts' as AppView, label: 'Mes posts', icon: FileText, showDraftsBadge: true },
    ]
  },
  {
    label: "Planification",
    items: [
      { id: 'calendar' as AppView, label: 'Calendrier', icon: Calendar, showScheduledBadge: true },
      { id: 'watch' as AppView, label: 'Veille & Actus', icon: Newspaper },
    ]
  },
  {
    label: "Performance",
    items: [
      { id: 'analytics' as AppView, label: 'Analyse', icon: TrendingUp },
    ]
  },
  {
    label: "Compte",
    items: [
      { id: 'settings' as AppView, label: 'Mon profil', icon: User },
    ]
  },
];

export function Sidebar({ 
  currentView, 
  onNavigate, 
  hasProfile, 
  onSignOut,
  ideasCount = 0,
  draftsCount = 0,
  scheduledCount = 0
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display font-bold text-lg text-foreground">True Content</h1>
              <p className="text-xs text-muted-foreground">Contenu Authentique</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group Label */}
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {group.label}
              </p>
            )}
            
            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = currentView === item.id;
                const isDisabled = !hasProfile && item.id !== 'dashboard' && item.id !== 'ideas' && item.id !== 'settings';
                const showIdeasBadge = (item as any).showBadge && ideasCount > 0;
                const showDrafts = (item as any).showDraftsBadge && draftsCount > 0;
                const showScheduled = (item as any).showScheduledBadge && scheduledCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && onNavigate(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-white shadow-md" 
                        : (item as any).highlight
                          ? "text-primary hover:bg-primary/10"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      collapsed && "justify-center px-3"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      (item as any).highlight && !isActive && "text-primary"
                    )} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {showIdeasBadge && (
                          <Badge variant="secondary" className="h-5 px-2 text-xs bg-primary/10 text-primary">
                            {ideasCount}
                          </Badge>
                        )}
                        {showDrafts && (
                          <Badge variant="secondary" className="h-5 px-2 text-xs">
                            {draftsCount}
                          </Badge>
                        )}
                        {showScheduled && (
                          <Badge variant="secondary" className="h-5 px-2 text-xs bg-blue-100 text-blue-700">
                            {scheduledCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Dev Server Status */}
        {import.meta.env.DEV && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20",
            collapsed ? "justify-center" : "justify-start"
          )}>
            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
            {!collapsed && (
              <span className="text-xs text-green-600 font-medium">Dev Mode</span>
            )}
          </div>
        )}
        {onSignOut && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center px-3" : "justify-start"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="ml-2">Réduire</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
