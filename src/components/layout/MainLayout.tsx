import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { AppView } from "@/types";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  hasProfile: boolean;
  onSignOut?: () => void;
}

export function MainLayout({ children, currentView, onNavigate, hasProfile, onSignOut }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        currentView={currentView} 
        onNavigate={onNavigate} 
        hasProfile={hasProfile}
        onSignOut={onSignOut}
      />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "ml-64" // Sidebar width
      )}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
