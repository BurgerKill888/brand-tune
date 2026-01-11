import { useState, forwardRef } from "react";
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
  Trash2,
  LogOut,
  Mail,
  Globe,
  Clock,
  Linkedin,
  CheckCircle,
  XCircle
} from "lucide-react";
import { BrandProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLinkedIn } from "@/hooks/useLinkedIn";

interface SettingsViewProps {
  brandProfile: BrandProfile | null;
  onSignOut: () => void;
  userEmail?: string;
}

export function SettingsView({ brandProfile, onSignOut, userEmail }: SettingsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    postReminders: true,
    weeklyReport: false,
    trendAlerts: true,
  });

  const linkedinRedirectUrl = `${window.location.origin}/linkedin-callback`;

  const handleCopyLinkedInRedirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(linkedinRedirectUrl);
      toast({
        title: "Copié",
        description: "L’URL de redirection LinkedIn a été copiée.",
      });
    } catch {
      toast({
        title: "Impossible de copier",
        description: "Copie manuelle requise (votre navigateur bloque la copie).",
        variant: "destructive",
      });
    }
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
    a.download = `contentai-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Vos données ont été exportées avec succès.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle>Profil Utilisateur</CardTitle>
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
              <p className="text-sm text-muted-foreground">Membre depuis janvier 2026</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid gap-4">
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
          <CardDescription>Publiez directement sur LinkedIn depuis l'application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedin.loading ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Vérification de la connexion...</span>
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
              <p className="text-sm text-muted-foreground">
                ✅ Vous pouvez publier vos posts directement sur LinkedIn depuis la page "Posts"
              </p>
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
                  Connecter LinkedIn
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="text-muted-foreground">Redirect URL à enregistrer dans LinkedIn :</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <code className="text-foreground break-all">{linkedinRedirectUrl}</code>
                  <Button variant="outline" size="sm" onClick={handleCopyLinkedInRedirectUrl}>
                    Copier
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Profile Summary */}
      {brandProfile && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>Profil de Marque</CardTitle>
            </div>
            <CardDescription>Résumé de votre stratégie éditoriale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entreprise</p>
                <p className="font-medium">{brandProfile.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Secteur</p>
                <p className="font-medium">{brandProfile.sector}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ton</p>
                <Badge variant="secondary">{brandProfile.tone}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fréquence</p>
                <Badge variant="outline">{brandProfile.publishingFrequency}</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Valeurs</p>
              <div className="flex flex-wrap gap-2">
                {brandProfile.values.map((value, i) => (
                  <Badge key={i} variant="secondary">{value}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Cibles</p>
              <div className="flex flex-wrap gap-2">
                {brandProfile.targets.map((target, i) => (
                  <Badge key={i} variant="outline">{target}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configurez vos alertes et rappels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            label="Digest hebdomadaire par email"
            description="Recevez un résumé de vos performances chaque semaine"
            checked={notifications.emailDigest}
            onChange={(checked) => setNotifications(n => ({ ...n, emailDigest: checked }))}
          />
          <Separator />
          <NotificationToggle
            label="Rappels de publication"
            description="Soyez alerté quand un post est prévu"
            checked={notifications.postReminders}
            onChange={(checked) => setNotifications(n => ({ ...n, postReminders: checked }))}
          />
          <Separator />
          <NotificationToggle
            label="Alertes tendances"
            description="Recevez des notifications sur les sujets tendance"
            checked={notifications.trendAlerts}
            onChange={(checked) => setNotifications(n => ({ ...n, trendAlerts: checked }))}
          />
          <Separator />
          <NotificationToggle
            label="Rapport mensuel"
            description="Rapport détaillé de vos métriques chaque mois"
            checked={notifications.weeklyReport}
            onChange={(checked) => setNotifications(n => ({ ...n, weeklyReport: checked }))}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Données & Confidentialité</CardTitle>
          </div>
          <CardDescription>Gérez vos données personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Exporter mes données</p>
              <p className="text-sm text-muted-foreground">Téléchargez une copie de toutes vos données</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Supprimer mon compte</p>
              <p className="text-sm text-muted-foreground">Supprimez définitivement votre compte et vos données</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>Fuseau horaire</CardTitle>
          </div>
          <CardDescription>Pour les rappels et la planification</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground font-medium">Europe/Paris (UTC+1)</p>
          <p className="text-sm text-muted-foreground mt-1">
            Détecté automatiquement depuis votre navigateur
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Déconnexion</p>
              <p className="text-sm text-muted-foreground">Vous serez déconnecté de votre compte</p>
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
