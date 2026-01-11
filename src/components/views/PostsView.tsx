import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  RefreshCw,
  Check,
  Hash,
  Type,
  ThumbsUp,
  AlertCircle,
  Save,
  Linkedin,
  Clock,
  Eye,
  Zap,
  Trash2,
  Pencil,
  Send,
  Settings2,
  Lightbulb,
  MessageSquare,
  ChevronRight,
  BookOpen,
  Target,
  Smile,
  Users,
  Globe,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Post, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLinkedIn } from "@/hooks/useLinkedIn";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { LinkedInPreview } from "@/components/posts/LinkedInPreview";
import { SchedulePostDialog } from "@/components/posts/SchedulePostDialog";
import { useAppStore } from "@/store/appStore";

interface PostsViewProps {
  brandProfile: BrandProfile;
  posts: Post[];
  onAddPost: (post: Post) => void;
  onUpdatePost: (id: string, updates: Partial<Post>) => void;
}

const POST_TYPES = [
  { value: 'instructif', label: 'Instructif', icon: BookOpen, description: 'Éduquer et informer' },
  { value: 'inspirant', label: 'Inspirant', icon: Lightbulb, description: 'Motiver et élever' },
  { value: 'promotionnel', label: 'Promotionnel', icon: Target, description: 'Convertir subtilement' },
  { value: 'storytelling', label: 'Storytelling', icon: MessageSquare, description: 'Raconter une histoire' },
  { value: 'engagement', label: 'Engagement', icon: Users, description: 'Générer des interactions' },
];

const POST_CATEGORIES = [
  { value: 'explication', label: 'Explication / Analyse' },
  { value: 'conseil', label: 'Conseil pratique' },
  { value: 'tendance', label: 'Tendance du moment' },
  { value: 'cas-etude', label: "Cas d'étude" },
  { value: 'annonce', label: 'Annonce' },
];

const EMOJI_OPTIONS = [
  { value: 'adapte', label: 'Adapté', description: '3-5 emojis stratégiques' },
  { value: 'beaucoup', label: 'Beaucoup', description: '6-10 emojis expressifs' },
  { value: 'peu', label: 'Peu', description: 'Maximum 2 emojis' },
  { value: 'aucun', label: 'Aucun', description: 'Style sobre' },
];

const REGISTRE_OPTIONS = [
  { value: 'tutoiement', label: 'Tu', description: 'Proche et direct' },
  { value: 'vouvoiement', label: 'Vous', description: 'Professionnel' },
];

const LANGUE_OPTIONS = [
  { value: 'francais', label: '🇫🇷 Français' },
  { value: 'anglais', label: '🇬🇧 English' },
];

const LENGTH_OPTIONS = [
  { value: 'short', label: 'Court', description: '300-500 car.' },
  { value: 'medium', label: 'Moyen', description: '600-1200 car.' },
  { value: 'long', label: 'Long', description: '1300-2500 car.' },
];

export function PostsView({ brandProfile, posts, onAddPost, onUpdatePost }: PostsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  const { schedulePost } = useScheduledPosts(brandProfile.id);
  const { prefillPostData, setPrefillPostData } = useAppStore();
  
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Form state
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("instructif");
  const [postCategory, setPostCategory] = useState("explication");
  const [emojiStyle, setEmojiStyle] = useState("adapte");
  const [registre, setRegistre] = useState("vouvoiement");
  const [langue, setLangue] = useState("francais");
  const [length, setLength] = useState("medium");

  // Handle prefill data from IdeasView
  useEffect(() => {
    if (prefillPostData) {
      setTopic(prefillPostData.topic);
      
      const categoryMap: Record<string, string> = {
        // From IdeasView categories
        "Bonnes pratiques": "conseil",
        "Explication / analyse": "explication",
        "Liste de conseils/règles/etc": "conseil",
        "Conseil percutant": "conseil",
        "Tendance du moment": "tendance",
        "Retour d'expérience": "cas-etude",
        "Actualité": "tendance",
        "Innovation": "tendance",
        // From Dashboard quick ideas
        "Storytelling": "cas-etude",
        "Analyse": "explication",
        "Éducatif": "explication",
        // Direct matches
        "tendance": "tendance",
        "conseil": "conseil",
        "explication": "explication",
        "cas-etude": "cas-etude",
        "annonce": "annonce",
      };
      
      if (prefillPostData.category) {
        const mappedCategory = categoryMap[prefillPostData.category];
        if (mappedCategory) {
          setPostCategory(mappedCategory);
        }
      }
      
      setPrefillPostData(null);
      
      toast({
        title: "Idée chargée ✨",
        description: "Configurez les paramètres puis cliquez sur Générer.",
      });
    }
  }, [prefillPostData, setPrefillPostData, toast]);

  // Sync edited content when switching to edit mode
  useEffect(() => {
    if (currentPost && isEditing) {
      setEditedContent(currentPost.content);
    }
  }, [isEditing, currentPost]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Sujet requis",
        description: "Entrez un sujet pour générer votre post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setSaved(false);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-post', {
        body: {
          topic,
          length,
          postType,
          postCategory,
          emojiStyle,
          registre,
          langue,
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            values: brandProfile.values,
            forbiddenWords: brandProfile.forbiddenWords,
            targets: brandProfile.targets,
            businessObjectives: brandProfile.businessObjectives,
          },
          includeCta: true,
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
        length: length as 'short' | 'medium' | 'long',
        tone: brandProfile.tone,
        cta: "CTA inclus",
        keywords: data.keywords || [],
        hashtags: data.hashtags || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCurrentPost(newPost);
      setIsEditing(false);
      
      toast({
        title: "Post généré ! 🎉",
        description: "Prévisualisez, modifiez puis sauvegardez ou publiez.",
      });
    } catch (err: unknown) {
      console.error("Generation error:", err);
      const message = err instanceof Error ? err.message : "Erreur lors de la génération";
      setError(message);
      toast({
        title: "Erreur de génération",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    if (currentPost && editedContent !== currentPost.content) {
      setCurrentPost({
        ...currentPost,
        content: editedContent,
        updatedAt: new Date(),
      });
      toast({
        title: "Modifications appliquées",
        description: "N'oubliez pas de sauvegarder pour conserver vos changements.",
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(currentPost?.content || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!currentPost) return;
    
    setIsSaving(true);
    try {
      await onAddPost(currentPost);
      setSaved(true);
      toast({
        title: "Post sauvegardé ✅",
        description: "Retrouvez-le dans 'Mes posts'.",
      });
    } catch {
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
      title: "Copié ! 📋",
      description: "Collez-le directement sur LinkedIn.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishToLinkedIn = async () => {
    if (!currentPost) return;
    
    if (!linkedin.isConnected) {
      toast({
        title: "LinkedIn non connecté",
        description: "Connectez votre compte dans les paramètres.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const result = await linkedin.publishPost(currentPost.content);
      if (result.success) {
        onUpdatePost(currentPost.id, { status: 'published' });
        setCurrentPost({ ...currentPost, status: 'published' });
        toast({
          title: "Publié sur LinkedIn ! 🚀",
          description: "Votre post est maintenant visible.",
        });
      }
    } catch {
      toast({
        title: "Erreur de publication",
        description: "Impossible de publier sur LinkedIn.",
        variant: "destructive",
      });
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
        toast({
          title: "Post programmé ! 📅",
          description: `Publication prévue le ${scheduledAt.toLocaleDateString('fr-FR')} à ${scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleNewPost = () => {
    setCurrentPost(null);
    setTopic("");
    setIsEditing(false);
    setSaved(false);
    setError(null);
  };

  const selectedPostType = POST_TYPES.find(t => t.value === postType);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Éditeur de Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Créez du contenu LinkedIn optimisé avec l'IA
          </p>
        </div>
        <div className="flex items-center gap-3">
          {linkedin.isConnected ? (
            <Badge variant="success" className="px-3 py-1.5">
              <Linkedin className="w-3.5 h-3.5 mr-1.5" />
              LinkedIn connecté
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1.5 text-muted-foreground">
              <Linkedin className="w-3.5 h-3.5 mr-1.5" />
              Non connecté
            </Badge>
          )}
          <Badge variant="info" className="px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Claude AI
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Panel - Configuration (2/5) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Step 1: Subject */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                Sujet du post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="De quoi voulez-vous parler ?&#10;&#10;Ex: Les 5 erreurs à éviter quand on débute sur LinkedIn..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px] resize-none pr-10 text-sm"
                />
                {topic && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setTopic("")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Soyez précis pour un meilleur résultat
              </p>
            </CardContent>
          </Card>

          {/* Step 2: Post Type */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                Type de post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {POST_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = postType === type.value;
                  return (
                    <Tooltip key={type.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setPostType(type.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{type.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              {selectedPostType && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  {selectedPostType.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Parameters */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Category & Length */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Catégorie
                  </Label>
                  <Select value={postCategory} onValueChange={setPostCategory}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    Longueur
                  </Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({opt.description})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Emoji & Register */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Smile className="w-3 h-3" />
                    Emojis
                  </Label>
                  <Select value={emojiStyle} onValueChange={setEmojiStyle}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJI_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Registre
                  </Label>
                  <div className="flex gap-2">
                    {REGISTRE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setRegistre(opt.value)}
                        className={cn(
                          "flex-1 h-9 rounded-md text-sm font-medium transition-all",
                          registre === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Language */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Langue
                </Label>
                <div className="flex gap-2">
                  {LANGUE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLangue(opt.value)}
                      className={cn(
                        "flex-1 h-9 rounded-md text-sm font-medium transition-all",
                        langue === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Profile Summary */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  Profil de marque appliqué
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">{brandProfile.companyName}</Badge>
                  <Badge variant="outline" className="text-xs">{brandProfile.tone}</Badge>
                  <Badge variant="outline" className="text-xs">{brandProfile.sector}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Erreur</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            variant="premium" 
            className="w-full h-12 text-base font-semibold"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Générer le post
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Preview & Actions (3/5) */}
        <div className="xl:col-span-3">
          <Card className="border-border/50 h-full">
            <CardContent className="p-6 h-full">
              {!currentPost ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-12 h-12 text-primary/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Prêt à créer
                  </h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Configurez les paramètres à gauche, entrez votre sujet, puis cliquez sur "Générer le post"
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {POST_TYPES.find(t => t.value === postType)?.label}
                    </Badge>
                    <Badge variant="secondary">
                      {POST_CATEGORIES.find(c => c.value === postCategory)?.label}
                    </Badge>
                    <Badge variant="secondary">
                      {LENGTH_OPTIONS.find(l => l.value === length)?.label}
                    </Badge>
                  </div>
                </div>
              ) : (
                /* Post Generated */
                <div className="space-y-6">
                  {/* Header with status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {saved ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Sauvegardé
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Non sauvegardé
                        </Badge>
                      )}
                      {currentPost.status === 'published' && (
                        <Badge variant="success">
                          <Linkedin className="w-3 h-3 mr-1" />
                          Publié
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNewPost}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Nouveau
                    </Button>
                  </div>

                  {/* Preview or Edit Mode */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] text-sm leading-relaxed"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Appliquer les modifications
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <LinkedInPreview
                      content={currentPost.content}
                      authorName={linkedin.profile?.name || brandProfile.companyName}
                      authorTitle={brandProfile.sector}
                      authorImage={linkedin.profile?.picture}
                    />
                  )}

                  {/* Stats */}
                  {!isEditing && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900">
                        <div className="flex items-center gap-2 mb-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-xs text-teal-600 font-medium">Score</span>
                        </div>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
                          {currentPost.readabilityScore}<span className="text-sm font-normal">/100</span>
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Type className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs text-primary font-medium">Caractères</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {currentPost.content.length}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-amber-600 font-medium">Hashtags</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                          {currentPost.hashtags.length}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isEditing && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="h-11"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="h-11"
                        >
                          <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                          Régénérer
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant="secondary"
                          onClick={handleCopy}
                          className="h-11"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          {copied ? 'Copié !' : 'Copier'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleSave}
                          disabled={isSaving || saved}
                          className="h-11"
                        >
                          {saved ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {saved ? 'Sauvé' : 'Sauvegarder'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setShowScheduleDialog(true)}
                          className="h-11"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Programmer
                        </Button>
                      </div>

                      {/* Publish Button */}
                      <Button
                        variant="premium"
                        onClick={handlePublishToLinkedIn}
                        disabled={isPublishing || currentPost.status === 'published' || !linkedin.isConnected}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Publication...
                          </>
                        ) : currentPost.status === 'published' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Déjà publié
                          </>
                        ) : !linkedin.isConnected ? (
                          <>
                            <Linkedin className="w-5 h-5 mr-2" />
                            Connecter LinkedIn pour publier
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Publier sur LinkedIn
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {!isEditing && currentPost.suggestions && currentPost.suggestions.length > 0 && (
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Suggestions d'amélioration
                      </p>
                      <ul className="space-y-1">
                        {currentPost.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Posts */}
      {posts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Posts récents</CardTitle>
            <CardDescription>Cliquez pour charger un post existant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 6).map((post) => (
                <button
                  key={post.id}
                  onClick={() => {
                    setCurrentPost(post);
                    setIsEditing(false);
                    setSaved(true);
                  }}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/30 transition-all text-left group"
                >
                  <p className="text-sm text-foreground line-clamp-3 group-hover:text-primary transition-colors">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={post.status === 'published' ? 'success' : 'secondary'} className="text-xs">
                      {post.status === 'published' ? 'Publié' : post.status === 'ready' ? 'Prêt' : 'Brouillon'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.content.length} car.
                    </span>
                  </div>
                </button>
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
