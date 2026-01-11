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
  ThumbsUp,
  AlertCircle,
  Save,
  Linkedin,
  Clock,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Post, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLinkedIn } from "@/hooks/useLinkedIn";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { LinkedInPreview } from "@/components/posts/LinkedInPreview";
import { SchedulePostDialog } from "@/components/posts/SchedulePostDialog";

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

export function PostsView({ brandProfile, posts, onAddPost, onUpdatePost }: PostsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  const { scheduledPosts, schedulePost } = useScheduledPosts(brandProfile.id);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [selectedLength, setSelectedLength] = useState<Post['length']>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topic, setTopic] = useState("");
  const [includeCta, setIncludeCta] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-post', {
        body: {
          topic,
          length: selectedLength,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            values: brandProfile.values,
            forbiddenWords: brandProfile.forbiddenWords,
            targets: brandProfile.targets,
            businessObjectives: brandProfile.businessObjectives,
          },
          includeCta,
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      const newPost: Post = {
        id: crypto.randomUUID(),
        brandProfileId: brandProfile.id,
        content: data.content || '',
        variants: data.variants || [],
        suggestions: data.suggestions || [],
        readabilityScore: data.readabilityScore || 75,
        editorialJustification: data.editorialJustification || '',
        length: selectedLength,
        tone: brandProfile.tone,
        cta: includeCta ? "CTA inclus" : undefined,
        keywords: data.keywords || [],
        hashtags: data.hashtags || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCurrentPost(newPost);
      
      toast({
        title: "Post généré !",
        description: "Votre nouveau post est prêt. Cliquez sur 'Sauvegarder' pour l'enregistrer.",
      });
    } catch (err: unknown) {
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "Erreur lors de la génération";
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentPost) return;
    
    setIsSaving(true);
    try {
      await onAddPost(currentPost);
      toast({
        title: "Post sauvegardé",
        description: "Votre post a été enregistré dans la base de données.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le post.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!currentPost) return;
    await navigator.clipboard.writeText(currentPost.content);
    setCopied(true);
    toast({
      title: "Copié !",
      description: "Le post a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handlePublishToLinkedIn = async () => {
    if (!currentPost) return;
    
    if (!linkedin.isConnected) {
      linkedin.connect();
      return;
    }

    setIsPublishing(true);
    try {
      const result = await linkedin.publishPost(currentPost.content);
      if (result.success) {
        onUpdatePost(currentPost.id, { status: 'published' });
        setCurrentPost({ ...currentPost, status: 'published' });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedulePost = async (scheduledAt: Date) => {
    if (!currentPost) return;
    
    setIsScheduling(true);
    try {
      const success = await schedulePost(currentPost.content, scheduledAt, currentPost.id);
      if (success) {
        setShowScheduleDialog(false);
      }
    } finally {
      setIsScheduling(false);
    }
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
          IA Gemini
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
              <Switch checked={includeCta} onCheckedChange={setIncludeCta} />
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
                  Génération IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer le post
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
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
              {currentPost && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Éditer' : 'Prévisualiser'}
                  </Button>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!currentPost ? (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Entrez un sujet et cliquez sur "Générer"
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  L'IA créera un post optimisé selon votre charte éditoriale
                </p>
              </div>
            ) : (
              <>
                {/* Toggle between Edit and Preview */}
                {showPreview ? (
                  <div className="py-4">
                    <LinkedInPreview
                      content={currentPost.content}
                      authorName={brandProfile.companyName}
                      authorTitle={`${brandProfile.sector} · ${brandProfile.tone}`}
                    />
                  </div>
                ) : (
                  /* Post Content */
                  <div className="p-6 rounded-xl bg-secondary/30 border border-border">
                    <Textarea
                      value={currentPost.content}
                      onChange={(e) => setCurrentPost({ ...currentPost, content: e.target.value })}
                      className="min-h-[300px] resize-none bg-transparent border-none p-0 focus-visible:ring-0 text-foreground whitespace-pre-wrap"
                    />
                  </div>
                )}

                {/* LinkedIn Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handlePublishToLinkedIn}
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Linkedin className="w-4 h-4 mr-2" />
                    )}
                    {linkedin.isConnected ? 'Publier maintenant' : 'Connecter LinkedIn'}
                  </Button>
                  {linkedin.isConnected && (
                    <Button
                      variant="outline"
                      onClick={() => setShowScheduleDialog(true)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Programmer
                    </Button>
                  )}
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
                {currentPost.suggestions.length > 0 && (
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
                )}

                {/* Editorial Justification */}
                {currentPost.editorialJustification && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
                      Justification éditoriale
                    </p>
                    <p className="text-sm text-foreground">
                      {currentPost.editorialJustification}
                    </p>
                  </div>
                )}

                {/* Variants */}
                {currentPost.variants.length > 0 && (
                  <div className="space-y-3">
                    <Label>Variantes alternatives</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {currentPost.variants.map((variant, i) => (
                        <button
                          key={i}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
                          onClick={() => setCurrentPost({ ...currentPost, content: variant })}
                        >
                          <p className="text-sm text-muted-foreground group-hover:text-foreground">
                            {variant}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Posts */}
      {posts.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Posts sauvegardés ({posts.length})</CardTitle>
            <CardDescription>Vos posts générés précédemment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 6).map((post) => (
                <div 
                  key={post.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => setCurrentPost(post)}
                >
                  <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {post.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.content.length} car.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <SchedulePostDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSchedule={handleSchedulePost}
        isLoading={isScheduling}
      />
    </div>
  );
}
