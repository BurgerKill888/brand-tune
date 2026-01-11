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
  Lightbulb,
  Zap
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

const navItems = [
  { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ideas' as AppView, label: 'Générateur', icon: Zap },
  { id: 'inspiration' as AppView, label: 'Inspiration', icon: Lightbulb },
  { id: 'watch' as AppView, label: 'Veille', icon: Compass },
  { id: 'calendar' as AppView, label: 'Calendrier', icon: Calendar },
  { id: 'posts' as AppView, label: 'Posts', icon: FileEdit },
  { id: 'metrics' as AppView, label: 'Métriques', icon: BarChart3 },
  { id: 'settings' as AppView, label: 'Paramètres', icon: Settings },
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
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const isDisabled = !hasProfile && item.id !== 'dashboard';
          
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.id)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-soft" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                isDisabled && "opacity-50 cursor-not-allowed",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
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
