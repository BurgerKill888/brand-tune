import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandProfile, EditorialCharter } from '@/types';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useBrandProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBrandProfile();
    } else {
      setBrandProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchBrandProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profile: BrandProfile = {
          id: data.id,
          userId: data.user_id,
          companyName: data.company_name,
          sector: data.sector,
          targets: data.targets || [],
          businessObjectives: data.business_objectives || [],
          tone: data.tone as BrandProfile['tone'],
          values: data.values || [],
          forbiddenWords: data.forbidden_words || [],
          examplePosts: data.example_posts || [],
          publishingFrequency: data.publishing_frequency as BrandProfile['publishingFrequency'],
          kpis: data.kpis || [],
          editorialCharter: (data.editorial_charter as unknown as EditorialCharter) || {
            audience: '',
            positioning: '',
            tone: '',
            doList: [],
            dontList: [],
            kpis: [],
            writingStyle: '',
          },
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setBrandProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching brand profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBrandProfile = async (profile: BrandProfile) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .upsert({
          id: profile.id,
          user_id: user.id,
          company_name: profile.companyName,
          sector: profile.sector,
          targets: profile.targets as string[],
          business_objectives: profile.businessObjectives as string[],
          tone: profile.tone,
          values: profile.values as string[],
          forbidden_words: profile.forbiddenWords as string[],
          example_posts: profile.examplePosts as string[],
          publishing_frequency: profile.publishingFrequency,
          kpis: profile.kpis as string[],
          editorial_charter: profile.editorialCharter as unknown as Record<string, unknown>,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setBrandProfile(profile);
      toast({
        title: "Profil sauvegardé",
        description: "Votre charte éditoriale a été enregistrée.",
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error saving brand profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
      return { error };
    }
  };

  return {
    brandProfile,
    loading,
    saveBrandProfile,
    refreshBrandProfile: fetchBrandProfile,
  };
}
