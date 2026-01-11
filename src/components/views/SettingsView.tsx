import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  LogOut,
  Mail,
  Linkedin,
  CheckCircle,
  XCircle,
  Building2,
  Edit3,
  Save,
  X,
  RefreshCw,
  Compass,
  Users,
  Calendar,
  Target,
  Sparkles
} from "lucide-react";
import { BrandProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLinkedIn } from "@/hooks/useLinkedIn";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  brandProfile: BrandProfile | null;
  onSignOut: () => void;
  userEmail?: string;
  onSaveBrandProfile?: (profile: BrandProfile) => Promise<{ error: any }>;
}

// Mêmes options que l'onboarding
const ROLE_OPTIONS = [
  { value: 'founder', label: '🚀 Fondateur / CEO' },
  { value: 'director', label: '👔 Dirigeant' },
  { value: 'manager', label: '📊 Manager' },
  { value: 'expert', label: '🎯 Expert / Consultant' },
  { value: 'freelance', label: '💻 Freelance' },
  { value: 'employee', label: '🧑‍💼 Salarié' },
];

const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: '2-10', label: '2-10 personnes' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '200+', label: '200+' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'less-1', label: 'Moins d\'1 an' },
  { value: '1-3', label: '1 à 3 ans' },
  { value: '3-10', label: '3 à 10 ans' },
  { value: '10+', label: 'Plus de 10 ans' },
];

const JOURNEY_OPTIONS = [
  { value: 'passion', label: '❤️ Une passion' },
  { value: 'reconversion', label: '🔄 Une reconversion' },
  { value: 'opportunity', label: '🎲 Une opportunité' },
  { value: 'heritage', label: '👨‍👩‍👧 Un héritage familial' },
  { value: 'necessity', label: '💪 Une nécessité' },
  { value: 'curiosity', label: '🔍 La curiosité' },
];

const MOTIVATION_OPTIONS = [
  { value: 'help', label: '🤝 Aider les autres' },
  { value: 'innovate', label: '💡 Innover' },
  { value: 'transmit', label: '📚 Transmettre' },
  { value: 'create', label: '🎨 Créer' },
  { value: 'solve', label: '🧩 Résoudre des problèmes' },
  { value: 'connect', label: '🌐 Connecter les gens' },
];

const AUDIENCE_OPTIONS = [
  { value: 'entrepreneurs', label: '🚀 Entrepreneurs' },
  { value: 'executives', label: '👔 Dirigeants' },
  { value: 'hr', label: '🧑‍💼 RH' },
  { value: 'sales', label: '📈 Commerciaux' },
  { value: 'marketers', label: '📣 Marketeurs' },
  { value: 'developers', label: '💻 Tech / Devs' },
  { value: 'students', label: '🎓 Étudiants' },
  { value: 'general', label: '🌍 Grand public' },
];

const GOAL_OPTIONS = [
  { value: 'visibility', label: '👁️ Me faire connaître' },
  { value: 'leads', label: '🎯 Générer des leads' },
  { value: 'recruit', label: '🤝 Recruter' },
  { value: 'expertise', label: '📚 Partager mon expertise' },
  { value: 'community', label: '💬 Créer une communauté' },
  { value: 'personal-brand', label: '✨ Développer ma marque personnelle' },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: '1x / semaine' },
  { value: '2-per-week', label: '2x / semaine' },
  { value: '3-per-week', label: '3x / semaine' },
  { value: 'daily', label: 'Quotidien' },
];

// Composant Pill réutilisable
function Pill({ 
  label, 
  selected, 
  onClick,
  size = 'default',
  disabled = false
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
  size?: 'default' | 'small';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border-2 transition-all duration-200 font-medium",
        size === 'small' ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        selected
          ? "border-primary bg-primary text-white shadow-md"
          : "border-border bg-white hover:border-primary/50 hover:bg-primary/5 text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}

export function SettingsView({ brandProfile, onSignOut, userEmail, onSaveBrandProfile }: SettingsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state pour l'édition du profil
  const [formData, setFormData] = useState({
    firstName: '',
    role: '',
    companyName: '',
    sector: '',
    teamSize: '',
    experience: '',
    journey: '',
    motivations: [] as string[],
    audiences: [] as string[],
    goals: [] as string[],
    targetFrequency: '',
  });

  const [notifications, setNotifications] = useState({
    emailDigest: true,
    postReminders: true,
    weeklyReport: false,
    trendAlerts: true,
  });

  // Initialiser les données du formulaire
  useEffect(() => {
    if (brandProfile) {
      // Convertir les valeurs textuelles en codes si nécessaire
      const motivationCodes = brandProfile.values?.map(v => {
        const found = MOTIVATION_OPTIONS.find(o => o.label.includes(v));
        return found?.value || v;
      }) || [];

      const audienceCodes = brandProfile.targets?.map(t => {
        const found = AUDIENCE_OPTIONS.find(o => o.label.includes(t));
        return found?.value || t;
      }) || [];

      const goalCodes = brandProfile.businessObjectives?.map(g => {
        const found = GOAL_OPTIONS.find(o => o.label.includes(g));
        return found?.value || g;
      }) || [];

      setFormData({
        firstName: brandProfile.firstName || brandProfile.companyName || '',
        role: brandProfile.role || '',
        companyName: brandProfile.companyName || '',
        sector: brandProfile.sector || '',
        teamSize: brandProfile.teamSize || '',
        experience: brandProfile.experience || '',
        journey: brandProfile.journey || '',
        motivations: motivationCodes,
        audiences: audienceCodes,
        goals: goalCodes,
        targetFrequency: brandProfile.publishingFrequency || '',
      });
    }
  }, [brandProfile]);

  const linkedinRedirectUrl = `${window.location.origin}/linkedin-callback`;

  const handleCopyLinkedInRedirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(linkedinRedirectUrl);
      toast({
        title: "Copié",
        description: "L'URL de redirection LinkedIn a été copiée.",
      });
    } catch {
      toast({
        title: "Impossible de copier",
        description: "Copie manuelle requise.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setFormData(prev => {
      const current = prev[field as keyof typeof prev] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!brandProfile || !onSaveBrandProfile) return;

    setIsSaving(true);
    try {
      // Convertir les codes en labels
      const motivationLabels = formData.motivations.map(m => 
        MOTIVATION_OPTIONS.find(o => o.value === m)?.label.replace(/^[^\s]+\s/, '') || m
      );

      const targetLabels = formData.audiences.map(a => 
        AUDIENCE_OPTIONS.find(o => o.value === a)?.label.replace(/^[^\s]+\s/, '') || a
      );

      const goalLabels = formData.goals.map(g => 
        GOAL_OPTIONS.find(o => o.value === g)?.label.replace(/^[^\s]+\s/, '') || g
      );

      const updatedProfile: BrandProfile = {
        ...brandProfile,
        firstName: formData.firstName,
        role: formData.role,
        companyName: formData.companyName || formData.firstName,
        sector: formData.sector,
        teamSize: formData.teamSize,
        experience: formData.experience,
        journey: formData.journey,
        values: motivationLabels,
        targets: targetLabels,
        businessObjectives: goalLabels,
        publishingFrequency: formData.targetFrequency as BrandProfile['publishingFrequency'],
        updatedAt: new Date(),
      };

      const { error } = await onSaveBrandProfile(updatedProfile);
      
      if (!error) {
        setIsEditing(false);
        toast({
          title: "Profil mis à jour ✅",
          description: "Vos modifications ont été enregistrées.",
        });
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (brandProfile) {
      // Reset to original values
      const motivationCodes = brandProfile.values?.map(v => {
        const found = MOTIVATION_OPTIONS.find(o => o.label.includes(v));
        return found?.value || v;
      }) || [];

      const audienceCodes = brandProfile.targets?.map(t => {
        const found = AUDIENCE_OPTIONS.find(o => o.label.includes(t));
        return found?.value || t;
      }) || [];

      const goalCodes = brandProfile.businessObjectives?.map(g => {
        const found = GOAL_OPTIONS.find(o => o.label.includes(g));
        return found?.value || g;
      }) || [];

      setFormData({
        firstName: brandProfile.firstName || brandProfile.companyName || '',
        role: brandProfile.role || '',
        companyName: brandProfile.companyName || '',
        sector: brandProfile.sector || '',
        teamSize: brandProfile.teamSize || '',
        experience: brandProfile.experience || '',
        journey: brandProfile.journey || '',
        motivations: motivationCodes,
        audiences: audienceCodes,
        goals: goalCodes,
        targetFrequency: brandProfile.publishingFrequency || '',
      });
    }
    setIsEditing(false);
  };

  const handleExportData = () => {
    if (!brandProfile) {
      toast({
        title: "Aucun profil à exporter",
        description: "Créez d'abord un profil de marque.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      brandProfile,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truecontent-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Vos données ont été exportées.",
    });
  };

  // Helper pour afficher les labels
  const getLabel = (options: {value: string; label: string}[], value: string) => {
    return options.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Mon Profil
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre profil et personnalisez votre expérience
        </p>
      </div>

      {/* Brand Profile Section */}
      {brandProfile && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>Profil de Marque</CardTitle>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isEditing ? (
              /* MODE ÉDITION */
              <>
                {/* Section 1: Vous */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Vous
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Votre prénom</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Votre prénom"
                      className="max-w-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Votre rôle</Label>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.role === option.value}
                          onClick={() => updateField('role', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 2: Entreprise */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Entreprise
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de l'entreprise</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="Mon Entreprise"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secteur d'activité</Label>
                      <Input
                        value={formData.sector}
                        onChange={(e) => updateField('sector', e.target.value)}
                        placeholder="Ex: Marketing digital, Tech..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Taille de l'équipe</Label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_SIZE_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.teamSize === option.value}
                          onClick={() => updateField('teamSize', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 3: Parcours */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4" /> Votre parcours
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Expérience dans le domaine</Label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.experience === option.value}
                          onClick={() => updateField('experience', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ce qui vous a mené ici</Label>
                    <div className="flex flex-wrap gap-2">
                      {JOURNEY_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.journey === option.value}
                          onClick={() => updateField('journey', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ce qui vous anime (plusieurs choix)</Label>
                    <div className="flex flex-wrap gap-2">
                      {MOTIVATION_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.motivations.includes(option.value)}
                          onClick={() => toggleArrayField('motivations', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 4: Audience */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" /> Votre audience
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>À qui voulez-vous parler ? (plusieurs choix)</Label>
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCE_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.audiences.includes(option.value)}
                          onClick={() => toggleArrayField('audiences', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vos objectifs LinkedIn (plusieurs choix)</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.goals.includes(option.value)}
                          onClick={() => toggleArrayField('goals', option.value)}
                          size="small"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section 5: Rythme */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Rythme de publication
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Fréquence cible</Label>
                    <div className="flex flex-wrap gap-2">
                      {FREQUENCY_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={formData.targetFrequency === option.value}
                          onClick={() => updateField('targetFrequency', option.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* MODE LECTURE */
              <>
                {/* Info principale */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {brandProfile.firstName?.charAt(0) || brandProfile.companyName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {brandProfile.firstName || brandProfile.companyName}
                    </h3>
                    <p className="text-muted-foreground">
                      {getLabel(ROLE_OPTIONS, brandProfile.role || '')} • {brandProfile.sector}
                    </p>
                    {brandProfile.companyName && brandProfile.firstName && (
                      <p className="text-sm text-muted-foreground">{brandProfile.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Grille d'infos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Équipe</p>
                    <p className="font-medium text-foreground text-sm">
                      {getLabel(TEAM_SIZE_OPTIONS, brandProfile.teamSize || '')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Expérience</p>
                    <p className="font-medium text-foreground text-sm">
                      {getLabel(EXPERIENCE_OPTIONS, brandProfile.experience || '')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Parcours</p>
                    <p className="font-medium text-foreground text-sm">
                      {getLabel(JOURNEY_OPTIONS, brandProfile.journey || '')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Fréquence</p>
                    <p className="font-medium text-foreground text-sm">
                      {getLabel(FREQUENCY_OPTIONS, brandProfile.publishingFrequency || '')}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Ce qui vous anime */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Ce qui vous anime
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.values?.length > 0 ? (
                      brandProfile.values.map((value, i) => (
                        <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                          {value}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Non défini</span>
                    )}
                  </div>
                </div>

                {/* Audience */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" /> Votre audience cible
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.targets?.length > 0 ? (
                      brandProfile.targets.map((target, i) => (
                        <Badge key={i} variant="secondary">{target}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Non définie</span>
                    )}
                  </div>
                </div>

                {/* Objectifs */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Vos objectifs LinkedIn
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {brandProfile.businessObjectives?.length > 0 ? (
                      brandProfile.businessObjectives.map((obj, i) => (
                        <Badge key={i} variant="outline" className="bg-secondary/50">{obj}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Non définis</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Profile State */}
      {!brandProfile && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucun profil de marque</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre profil depuis le Dashboard pour commencer
            </p>
          </CardContent>
        </Card>
      )}

      {/* Profile Section */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle>Compte Utilisateur</CardTitle>
          </div>
          <CardDescription>Informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-white">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-foreground">{userEmail || 'Utilisateur'}</p>
              <p className="text-sm text-muted-foreground">Compte actif</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input 
              id="email" 
              value={userEmail || ''} 
              disabled 
              className="mt-1.5 bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Connection */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-primary" />
            <CardTitle>Connexion LinkedIn</CardTitle>
          </div>
          <CardDescription>Publiez directement sur LinkedIn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedin.loading ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Vérification...</span>
            </div>
          ) : linkedin.isConnected && linkedin.profile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={linkedin.profile.picture} />
                    <AvatarFallback className="bg-primary text-white">
                      {linkedin.profile.name?.charAt(0) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{linkedin.profile.name}</p>
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{linkedin.profile.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => linkedin.disconnect()}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Déconnecter
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                <div>
                  <p className="font-medium text-foreground">LinkedIn non connecté</p>
                  <p className="text-sm text-muted-foreground">
                    Connectez votre compte pour publier directement
                  </p>
                </div>
                <Button onClick={() => linkedin.connect()}>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connecter
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">Redirect URL pour LinkedIn :</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <code className="text-foreground break-all text-xs">{linkedinRedirectUrl}</code>
                  <Button variant="outline" size="sm" onClick={handleCopyLinkedInRedirectUrl}>
                    Copier
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configurez vos alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            label="Rappels de publication"
            description="Alertes pour les posts planifiés"
            checked={notifications.postReminders}
            onChange={(checked) => setNotifications(n => ({ ...n, postReminders: checked }))}
          />
          <Separator />
          <NotificationToggle
            label="Alertes tendances"
            description="Sujets tendance dans votre secteur"
            checked={notifications.trendAlerts}
            onChange={(checked) => setNotifications(n => ({ ...n, trendAlerts: checked }))}
          />
          <Separator />
          <NotificationToggle
            label="Digest hebdomadaire"
            description="Résumé de vos performances"
            checked={notifications.emailDigest}
            onChange={(checked) => setNotifications(n => ({ ...n, emailDigest: checked }))}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Données</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Exporter mes données</p>
              <p className="text-sm text-muted-foreground">Téléchargez une copie de vos données</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Déconnexion</p>
              <p className="text-sm text-muted-foreground">Se déconnecter de l'application</p>
            </div>
            <Button variant="destructive" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type NotificationToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const NotificationToggle = forwardRef<HTMLDivElement, NotificationToggleProps>(
  ({ label, description, checked, onChange }, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    );
  }
);

NotificationToggle.displayName = 'NotificationToggle';
