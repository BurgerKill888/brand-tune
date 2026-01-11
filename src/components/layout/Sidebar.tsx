import { 
  LayoutDashboard, 
  Compass, 
  Calendar, 
  FileEdit, 
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LogOut,
  Zap,
  FolderOpen,
  Circle,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppView } from "@/types";
import { useState } from "react";

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  hasProfile: boolean;
  onSignOut?: () => void;
}

// Grouped navigation items
const navGroups = [
  {
    label: "Général",
    items: [
      { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: "Création",
    items: [
      { id: 'ideas' as AppView, label: 'Générateur d\'idées', icon: Zap },
      { id: 'posts' as AppView, label: 'Éditeur de posts', icon: FileEdit },
      { id: 'studio' as AppView, label: 'Studio', icon: Camera },
      { id: 'my-posts' as AppView, label: 'Mes posts', icon: FolderOpen },
    ]
  },
  {
    label: "Planification",
    items: [
      { id: 'watch' as AppView, label: 'Veille', icon: Compass },
      { id: 'calendar' as AppView, label: 'Calendrier', icon: Calendar },
    ]
  },
  {
    label: "Analyse",
    items: [
      { id: 'metrics' as AppView, label: 'Métriques', icon: BarChart3 },
    ]
  },
  {
    label: "Compte",
    items: [
      { id: 'settings' as AppView, label: 'Paramètres', icon: Settings },
    ]
  },
];

export function Sidebar({ currentView, onNavigate, hasProfile, onSignOut }: SidebarProps) {
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-glow">
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
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
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
                const isDisabled = !hasProfile && item.id !== 'dashboard' && item.id !== 'ideas' && item.id !== 'studio';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && onNavigate(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-soft" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      collapsed && "justify-center px-3"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
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
              <span className="text-xs text-green-600 font-medium">Serveur actif</span>
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
