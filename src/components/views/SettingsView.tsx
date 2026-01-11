import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  Trash2,
  LogOut,
  Mail,
  Globe,
  Clock,
  Linkedin,
  CheckCircle,
  XCircle,
  Building2,
  Target,
  Users,
  MessageSquare,
  Heart,
  Edit3,
  Save,
  X,
  Plus,
  Sparkles,
  RefreshCw,
  AlertCircle
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

const TONE_OPTIONS = [
  { value: 'expert', label: 'Expert', description: 'Professionnel et autoritaire' },
  { value: 'friendly', label: 'Amical', description: 'Accessible et chaleureux' },
  { value: 'storytelling', label: 'Storytelling', description: 'Narratif et engageant' },
  { value: 'punchline', label: 'Punchline', description: 'Percutant et mémorable' },
  { value: 'mixed', label: 'Mixte', description: 'Adapté au contexte' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Quotidien', description: '1 post/jour' },
  { value: '3-per-week', label: '3x/semaine', description: 'Lun, Mer, Ven' },
  { value: '2-per-week', label: '2x/semaine', description: 'Mar, Jeu' },
  { value: 'weekly', label: 'Hebdomadaire', description: '1 post/semaine' },
];

export function SettingsView({ brandProfile, onSignOut, userEmail, onSaveBrandProfile }: SettingsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for brand profile editing
  const [formData, setFormData] = useState({
    companyName: '',
    sector: '',
    targets: [] as string[],
    businessObjectives: [] as string[],
    tone: 'expert' as BrandProfile['tone'],
    values: [] as string[],
    forbiddenWords: [] as string[],
    publishingFrequency: '3-per-week' as BrandProfile['publishingFrequency'],
  });

  // Temporary input states for adding items
  const [newTarget, setNewTarget] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newForbiddenWord, setNewForbiddenWord] = useState('');

  const [notifications, setNotifications] = useState({
    emailDigest: true,
    postReminders: true,
    weeklyReport: false,
    trendAlerts: true,
  });

  // Initialize form data when brand profile changes
  useEffect(() => {
    if (brandProfile) {
      setFormData({
        companyName: brandProfile.companyName || '',
        sector: brandProfile.sector || '',
        targets: brandProfile.targets || [],
        businessObjectives: brandProfile.businessObjectives || [],
        tone: brandProfile.tone || 'expert',
        values: brandProfile.values || [],
        forbiddenWords: brandProfile.forbiddenWords || [],
        publishingFrequency: brandProfile.publishingFrequency || '3-per-week',
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

  const handleSaveProfile = async () => {
    if (!brandProfile || !onSaveBrandProfile) return;

    setIsSaving(true);
    try {
      const updatedProfile: BrandProfile = {
        ...brandProfile,
        companyName: formData.companyName,
        sector: formData.sector,
        targets: formData.targets,
        businessObjectives: formData.businessObjectives,
        tone: formData.tone,
        values: formData.values,
        forbiddenWords: formData.forbiddenWords,
        publishingFrequency: formData.publishingFrequency,
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
      setFormData({
        companyName: brandProfile.companyName || '',
        sector: brandProfile.sector || '',
        targets: brandProfile.targets || [],
        businessObjectives: brandProfile.businessObjectives || [],
        tone: brandProfile.tone || 'expert',
        values: brandProfile.values || [],
        forbiddenWords: brandProfile.forbiddenWords || [],
        publishingFrequency: brandProfile.publishingFrequency || '3-per-week',
      });
    }
    setIsEditing(false);
  };

  const addToArray = (key: keyof typeof formData, value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      const arr = formData[key] as string[];
      if (!arr.includes(value.trim())) {
        setFormData({ ...formData, [key]: [...arr, value.trim()] });
      }
      setter('');
    }
  };

  const removeFromArray = (key: keyof typeof formData, value: string) => {
    const arr = formData[key] as string[];
    setFormData({ ...formData, [key]: arr.filter(v => v !== value) });
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
    a.download = `brandtune-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Vos données ont été exportées.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte et votre profil de marque
        </p>
      </div>

      {/* Brand Profile Section - Editable */}
      {brandProfile && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
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
            <CardDescription>
              {isEditing ? "Modifiez les informations de votre entreprise" : "Votre stratégie éditoriale"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              /* EDIT MODE */
              <>
                {/* Company Name & Sector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Nom de l'entreprise
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Votre entreprise"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Secteur d'activité
                    </Label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      placeholder="Ex: Tech, Marketing, Finance..."
                    />
                  </div>
                </div>

                <Separator />

                {/* Targets */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Cibles / Audience
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      placeholder="Ex: Directeurs Marketing, CEOs..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('targets', newTarget, setNewTarget))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addToArray('targets', newTarget, setNewTarget)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.targets.map((target, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {target}
                        <button onClick={() => removeFromArray('targets', target)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Business Objectives */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Objectifs business
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Ex: Générer des leads, Notoriété..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('businessObjectives', newObjective, setNewObjective))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addToArray('businessObjectives', newObjective, setNewObjective)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.businessObjectives.map((obj, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {obj}
                        <button onClick={() => removeFromArray('businessObjectives', obj)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Tone & Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Ton de communication
                    </Label>
                    <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v as BrandProfile['tone'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div>
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-muted-foreground ml-2">- {opt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fréquence de publication
                    </Label>
                    <Select value={formData.publishingFrequency} onValueChange={(v) => setFormData({ ...formData, publishingFrequency: v as BrandProfile['publishingFrequency'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div>
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-muted-foreground ml-2">- {opt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Values */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Valeurs de marque
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Ex: Innovation, Transparence, Excellence..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('values', newValue, setNewValue))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addToArray('values', newValue, setNewValue)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.values.map((value, i) => (
                      <Badge key={i} variant="outline" className="gap-1 pr-1 bg-primary/5">
                        {value}
                        <button onClick={() => removeFromArray('values', value)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Forbidden Words */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Mots / expressions à éviter
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newForbiddenWord}
                      onChange={(e) => setNewForbiddenWord(e.target.value)}
                      placeholder="Ex: Révolutionnaire, Leader, Disruptif..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('forbiddenWords', newForbiddenWord, setNewForbiddenWord))}
                    />
                    <Button type="button" variant="secondary" onClick={() => addToArray('forbiddenWords', newForbiddenWord, setNewForbiddenWord)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.forbiddenWords.map((word, i) => (
                      <Badge key={i} variant="destructive" className="gap-1 pr-1 bg-destructive/10 text-destructive">
                        {word}
                        <button onClick={() => removeFromArray('forbiddenWords', word)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* VIEW MODE */
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Entreprise</p>
                    <p className="font-semibold text-foreground">{brandProfile.companyName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Secteur</p>
                    <p className="font-semibold text-foreground">{brandProfile.sector}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Ton</p>
                    <Badge variant="secondary">{TONE_OPTIONS.find(t => t.value === brandProfile.tone)?.label || brandProfile.tone}</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-1">Fréquence</p>
                    <Badge variant="outline">{FREQUENCY_OPTIONS.find(f => f.value === brandProfile.publishingFrequency)?.label || brandProfile.publishingFrequency}</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Cibles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.targets.length > 0 ? (
                        brandProfile.targets.map((target, i) => (
                          <Badge key={i} variant="secondary">{target}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Non définies</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Objectifs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.businessObjectives.length > 0 ? (
                        brandProfile.businessObjectives.map((obj, i) => (
                          <Badge key={i} variant="secondary">{obj}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Non définis</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Valeurs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.values.length > 0 ? (
                        brandProfile.values.map((value, i) => (
                          <Badge key={i} variant="outline" className="bg-primary/5">{value}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Non définies</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Mots à éviter
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandProfile.forbiddenWords.length > 0 ? (
                        brandProfile.forbiddenWords.map((word, i) => (
                          <Badge key={i} variant="destructive" className="bg-destructive/10 text-destructive">{word}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Aucun</span>
                      )}
                    </div>
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-2xl font-bold text-primary-foreground">
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
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
