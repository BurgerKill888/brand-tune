-- Table pour les inspirations sauvegardées (favoris)
CREATE TABLE public.saved_inspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('theme', 'account', 'news', 'content_idea')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_saved_inspirations_user ON public.saved_inspirations(user_id);
CREATE INDEX idx_saved_inspirations_type ON public.saved_inspirations(type);
CREATE INDEX idx_saved_inspirations_pinned ON public.saved_inspirations(is_pinned) WHERE is_pinned = true;

-- Enable RLS
ALTER TABLE public.saved_inspirations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own inspirations" 
ON public.saved_inspirations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inspirations" 
ON public.saved_inspirations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspirations" 
ON public.saved_inspirations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspirations" 
ON public.saved_inspirations 
FOR DELETE 
USING (auth.uid() = user_id);