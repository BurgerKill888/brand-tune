// Types for the LinkedIn Content Strategy Platform

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  sector: string;
  targets: string[];
  businessObjectives: string[];
  tone: 'expert' | 'friendly' | 'storytelling' | 'punchline' | 'mixed';
  values: string[];
  forbiddenWords: string[];
  examplePosts: string[];
  publishingFrequency: 'daily' | '3-per-week' | '2-per-week' | 'weekly';
  kpis: string[];
  editorialCharter: EditorialCharter;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorialCharter {
  audience: string;
  positioning: string;
  tone: string;
  doList: string[];
  dontList: string[];
  kpis: string[];
  writingStyle: string;
}

export interface WatchItem {
  id: string;
  brandProfileId: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  angle: string;
  relevance: 'high' | 'medium' | 'low';
  objective: 'reach' | 'credibility' | 'lead' | 'engagement';
  alert?: string;
  createdAt: Date;
}

export interface CalendarItem {
  id: string;
  brandProfileId: string;
  date: Date;
  theme: string;
  type: 'educational' | 'storytelling' | 'promotional' | 'engagement' | 'news';
  objective: string;
  status: 'draft' | 'scheduled' | 'published';
  postId?: string;
}

export interface Post {
  id: string;
  brandProfileId: string;
  calendarItemId?: string;
  content: string;
  variants: string[];
  suggestions: string[];
  readabilityScore: number;
  editorialJustification: string;
  length: 'short' | 'medium' | 'long';
  tone: string;
  cta?: string;
  keywords: string[];
  hashtags: string[];
  status: 'draft' | 'ready' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export type AppView = 'dashboard' | 'onboarding' | 'watch' | 'calendar' | 'posts' | 'my-posts' | 'metrics' | 'settings' | 'inspiration' | 'ideas';

export interface SavedInspiration {
  id: string;
  userId: string;
  brandProfileId?: string;
  type: 'theme' | 'account' | 'news' | 'content_idea';
  title: string;
  description?: string;
  source?: string;
  url?: string;
  metadata?: Record<string, any>;
  isPinned: boolean;
  createdAt: Date;
}

export interface DailyTheme {
  id: string;
  title: string;
  description: string;
  angle: string;
  hashtags: string[];
  relevance: string;
}

export interface LinkedInAccount {
  name: string;
  role: string;
  reason: string;
  topics: string[];
}

export interface InspirationData {
  themes: DailyTheme[];
  accounts: LinkedInAccount[];
  news: Array<{
    title: string;
    summary: string;
    source: string;
    angle: string;
  }>;
}
