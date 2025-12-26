import { useState } from "react";
import { 
  Sparkles, 
  Copy, 
  RefreshCw,
  Check,
  Sliders,
  Hash,
  Type,
  MessageSquare,
  Target,
  Zap,
  ThumbsUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Post, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PostsViewProps {
  brandProfile: BrandProfile;
  posts: Post[];
  onAddPost: (post: Post) => void;
  onUpdatePost: (id: string, updates: Partial<Post>) => void;
}

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Court', description: '< 500 caractères' },
  { value: 'medium', label: 'Moyen', description: '500-1200 car.' },
  { value: 'long', label: 'Long', description: '> 1200 car.' },
] as const;

const MOCK_POST: Post = {
  id: '1',
  brandProfileId: '1',
  content: `🚀 L'IA ne remplace pas les créatifs, elle les augmente.

Après 6 mois à utiliser l'IA dans notre workflow :

→ Temps de recherche : -60%
→ Première version : 3x plus rapide
→ Qualité finale : identique (voire meilleure)

Le secret ? L'IA gère le "grunt work", nous on se concentre sur la stratégie et l'émotion.

Ceux qui résistent perdent du temps.
Ceux qui adoptent gagnent un avantage compétitif.

Vous utilisez l'IA dans votre création de contenu ?

#ContentMarketing #IA #Productivité`,
  variants: [
    `💡 Le mythe du "tout automatisé" par l'IA...`,
    `Confession : j'étais sceptique sur l'IA pour le contenu...`,
  ],
  suggestions: [
    "Ajouter une question ouverte en fin de post",
    "Raccourcir le premier paragraphe pour un meilleur hook",
  ],
  readabilityScore: 87,
  editorialJustification: "Ce post aligne expertise technique et ton accessible. Le format liste améliore la lisibilité mobile.",
  length: 'medium',
  tone: 'expert',
  cta: "Question ouverte pour engagement",
  keywords: ['IA', 'productivité', 'content'],
  hashtags: ['ContentMarketing', 'IA', 'Productivité'],
  status: 'ready',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function PostsView({ brandProfile, posts, onAddPost, onUpdatePost }: PostsViewProps) {
  const { toast } = useToast();
  const [currentPost, setCurrentPost] = useState<Post>(MOCK_POST);
  const [selectedLength, setSelectedLength] = useState<Post['length']>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topic, setTopic] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    toast({
      title: "Post généré !",
      description: "Votre nouveau post est prêt à être optimisé.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentPost.content);
    setCopied(true);
    toast({
      title: "Copié !",
      description: "Le post a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    toast({
      title: "Post régénéré",
      description: "Une nouvelle version a été créée.",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Générateur de Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez du contenu optimisé pour {brandProfile.companyName}
          </p>
        </div>
        <Badge variant="info" className="px-3 py-1">
          <Zap className="w-3 h-3 mr-1" />
          IA activée
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Paramètres
            </CardTitle>
            <CardDescription>
              Configurez votre post
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label>Sujet / Thème</Label>
              <Textarea
                placeholder="Ex: Les tendances IA en 2025, Mon parcours d'entrepreneur..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Length Selection */}
            <div className="space-y-3">
              <Label>Longueur</Label>
              <div className="grid grid-cols-3 gap-2">
                {LENGTH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedLength(option.value)}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-all duration-200",
                      selectedLength === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Badge */}
            <div className="space-y-2">
              <Label>Ton (depuis votre profil)</Label>
              <Badge variant="info" className="capitalize">{brandProfile.tone}</Badge>
            </div>

            {/* CTA Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Inclure un CTA</span>
              </div>
              <Badge variant="success">Activé</Badge>
            </div>

            {/* Generate Button */}
            <Button 
              variant="premium" 
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer le post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Post Preview */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Aperçu du post
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                  Régénérer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Post Content */}
            <div className="p-6 rounded-xl bg-secondary/30 border border-border">
              <Textarea
                value={currentPost.content}
                onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                className="min-h-[300px] resize-none bg-transparent border-none p-0 focus-visible:ring-0 text-foreground whitespace-pre-wrap"
              />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-teal-600" />
                  <span className="text-xs text-teal-600 font-medium">Score lisibilité</span>
                </div>
                <p className="text-2xl font-display font-bold text-teal-700">
                  {currentPost.readabilityScore}/100
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">Caractères</span>
                </div>
                <p className="text-2xl font-display font-bold text-primary">
                  {currentPost.content.length}
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Hashtags</span>
                </div>
                <p className="text-2xl font-display font-bold text-amber-700">
                  {currentPost.hashtags.length}
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
              <Label>Suggestions d'amélioration</Label>
              {currentPost.suggestions.map((suggestion, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </div>
              ))}
            </div>

            {/* Editorial Justification */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
                Justification éditoriale
              </p>
              <p className="text-sm text-foreground">
                {currentPost.editorialJustification}
              </p>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <Label>Variantes alternatives</Label>
              <div className="grid grid-cols-1 gap-3">
                {currentPost.variants.map((variant, i) => (
                  <button
                    key={i}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
                  >
                    <p className="text-sm text-muted-foreground group-hover:text-foreground">
                      {variant}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
