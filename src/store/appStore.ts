import { create } from 'zustand';
import { AppView, BrandProfile, WatchItem, CalendarItem, Post } from '@/types';

interface AppState {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  brandProfile: BrandProfile | null;
  setBrandProfile: (profile: BrandProfile) => void;
  
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  
  watchItems: WatchItem[];
  setWatchItems: (items: WatchItem[]) => void;
  addWatchItem: (item: WatchItem) => void;
  
  calendarItems: CalendarItem[];
  setCalendarItems: (items: CalendarItem[]) => void;
  addCalendarItem: (item: CalendarItem) => void;
  
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  
  brandProfile: null,
  setBrandProfile: (profile) => set({ brandProfile: profile }),
  
  onboardingStep: 1,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  
  watchItems: [],
  setWatchItems: (items) => set({ watchItems: items }),
  addWatchItem: (item) => set((state) => ({ watchItems: [...state.watchItems, item] })),
  
  calendarItems: [],
  setCalendarItems: (items) => set({ calendarItems: items }),
  addCalendarItem: (item) => set((state) => ({ calendarItems: [...state.calendarItems, item] })),
  
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  updatePost: (id, updates) => set((state) => ({
    posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),
}));
