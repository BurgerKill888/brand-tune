
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_profiles table
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  targets TEXT[] DEFAULT '{}',
  business_objectives TEXT[] DEFAULT '{}',
  tone TEXT NOT NULL DEFAULT 'expert',
  values TEXT[] DEFAULT '{}',
  forbidden_words TEXT[] DEFAULT '{}',
  example_posts TEXT[] DEFAULT '{}',
  publishing_frequency TEXT NOT NULL DEFAULT 'weekly',
  kpis TEXT[] DEFAULT '{}',
  editorial_charter JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_items table
CREATE TABLE public.calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  theme TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'educational',
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  calendar_item_id UUID REFERENCES public.calendar_items(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  variants TEXT[] DEFAULT '{}',
  suggestions TEXT[] DEFAULT '{}',
  readability_score INTEGER DEFAULT 0,
  editorial_justification TEXT,
  length TEXT DEFAULT 'medium',
  tone TEXT,
  cta TEXT,
  keywords TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watch_items table
CREATE TABLE public.watch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_profile_id UUID REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  angle TEXT,
  relevance TEXT DEFAULT 'medium',
  objective TEXT,
  alert TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Brand profiles policies
CREATE POLICY "Users can view their own brand profiles" ON public.brand_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own brand profiles" ON public.brand_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand profiles" ON public.brand_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand profiles" ON public.brand_profiles FOR DELETE USING (auth.uid() = user_id);

-- Calendar items policies
CREATE POLICY "Users can view their own calendar items" ON public.calendar_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar items" ON public.calendar_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar items" ON public.calendar_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar items" ON public.calendar_items FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can view their own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Watch items policies
CREATE POLICY "Users can view their own watch items" ON public.watch_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watch items" ON public.watch_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own watch items" ON public.watch_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watch items" ON public.watch_items FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON public.brand_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_items_updated_at BEFORE UPDATE ON public.calendar_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
