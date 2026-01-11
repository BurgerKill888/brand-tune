-- Table pour stocker les sujets de veille enregistrés
CREATE TABLE IF NOT EXISTS watch_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Informations du sujet
  name VARCHAR(255) NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  
  -- Programmation de veille automatique
  is_scheduled BOOLEAN DEFAULT false,
  schedule_time TIME, -- Heure de veille programmée (ex: 08:00)
  schedule_days TEXT[] DEFAULT '{}', -- Jours de la semaine ['monday', 'tuesday', ...]
  last_run_at TIMESTAMPTZ,
  
  -- Paramètres de veille
  relevance_filter VARCHAR(50) DEFAULT 'all', -- 'all', 'high', 'medium', 'low'
  objective_filter VARCHAR(50) DEFAULT 'all', -- 'all', 'reach', 'credibility', 'lead', 'engagement'
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_watch_topics_user_id ON watch_topics(user_id);
CREATE INDEX idx_watch_topics_brand_profile_id ON watch_topics(brand_profile_id);
CREATE INDEX idx_watch_topics_is_scheduled ON watch_topics(is_scheduled) WHERE is_scheduled = true;

-- RLS Policies
ALTER TABLE watch_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch topics"
  ON watch_topics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch topics"
  ON watch_topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch topics"
  ON watch_topics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch topics"
  ON watch_topics FOR DELETE
  USING (auth.uid() = user_id);

-- Table pour l'historique des veilles (résultats)
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_topic_id UUID REFERENCES watch_topics(id) ON DELETE SET NULL,
  brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
  
  -- Informations de la recherche
  query TEXT NOT NULL,
  
  -- Résultats
  items JSONB NOT NULL DEFAULT '[]',
  citations TEXT[] DEFAULT '{}',
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour l'historique
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_watch_history_watch_topic_id ON watch_history(watch_topic_id);
CREATE INDEX idx_watch_history_created_at ON watch_history(created_at DESC);

-- RLS Policies pour l'historique
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch history"
  ON watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history"
  ON watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history"
  ON watch_history FOR DELETE
  USING (auth.uid() = user_id);

