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
  FileText,
  Link,
  File,
  Trash2,
  ChevronDown,
  Pencil,
  Image as ImageIcon,
  CheckCheck,
  MoreVertical
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Post, BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLinkedIn } from "@/hooks/useLinkedIn";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { LinkedInPreview } from "@/components/posts/LinkedInPreview";
import { SchedulePostDialog } from "@/components/posts/SchedulePostDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/appStore";

interface PostsViewProps {
  brandProfile: BrandProfile;
  posts: Post[];
  onAddPost: (post: Post) => void;
  onUpdatePost: (id: string, updates: Partial<Post>) => void;
}

const POST_TYPES = [
  { value: 'instructif', label: 'Instructif' },
  { value: 'inspirant', label: 'Inspirant' },
  { value: 'promotionnel', label: 'Promotionnel' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'engagement', label: 'Engagement' },
];

const POST_CATEGORIES = [
  { value: 'explication', label: 'Explication / analyse' },
  { value: 'conseil', label: 'Conseil pratique' },
  { value: 'tendance', label: 'Tendance du moment' },
  { value: 'cas-etude', label: "Cas d'étude" },
  { value: 'annonce', label: 'Annonce' },
];

const EMOJI_OPTIONS = [
  { value: 'adapte', label: 'Adapté' },
  { value: 'beaucoup', label: 'Beaucoup' },
  { value: 'peu', label: 'Peu' },
  { value: 'aucun', label: 'Aucun' },
];

const REGISTRE_OPTIONS = [
  { value: 'tutoiement', label: 'Tutoiement' },
  { value: 'vouvoiement', label: 'Vouvoiement' },
];

const LANGUE_OPTIONS = [
  { value: 'francais', label: 'Français' },
  { value: 'anglais', label: 'Anglais' },
];

export function PostsView({ brandProfile, posts, onAddPost, onUpdatePost }: PostsViewProps) {
  const { toast } = useToast();
  const linkedin = useLinkedIn();
  const { scheduledPosts, schedulePost } = useScheduledPosts(brandProfile.id);
  const { prefillPostData, setPrefillPostData } = useAppStore();
  
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parametersOpen, setParametersOpen] = useState(true);

  // Form state
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("instructif");
  const [postCategory, setPostCategory] = useState("explication");
  const [emojiStyle, setEmojiStyle] = useState("adapte");
  const [registre, setRegistre] = useState("tutoiement");
  const [langue, setLangue] = useState("francais");
  const [inputTab, setInputTab] = useState("sujet");

  // Handle prefill data from IdeasView
  useEffect(() => {
    if (prefillPostData) {
      setTopic(prefillPostData.topic);
      
      // Map category from IdeasView to postCategory
      const categoryMap: Record<string, string> = {
        "Bonnes pratiques": "conseil",
        "Explication / analyse": "explication",
        "Liste de conseils/règles/etc": "conseil",
        "Conseil percutant": "conseil",
        "Tendance du moment": "tendance",
        "Retour d'expérience": "cas-etude",
      };
      
      if (prefillPostData.category && categoryMap[prefillPostData.category]) {
        setPostCategory(categoryMap[prefillPostData.category]);
      }
      
      // Clear the prefill data after using it
      setPrefillPostData(null);
      
      toast({
        title: "Idée chargée",
        description: "Le sujet a été pré-rempli. Cliquez sur 'Générer' pour créer votre post.",
      });
    }
  }, [prefillPostData, setPrefillPostData, toast]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-post', {
        body: {
          topic,
          length: 'medium',
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
        length: 'medium',
        tone: brandProfile.tone,
        cta: "CTA inclus",
        keywords: data.keywords || [],
        hashtags: data.hashtags || [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCurrentPost(newPost);
      setShowPreview(true);
      
      toast({
        title: "Post généré !",
        description: "Votre post est prêt. Vous pouvez le modifier ou le publier.",
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
        description: "Votre post a été enregistré.",
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
      title: "Copié !",
      description: "Le post a été copié dans le presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
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
    <div className="space-y-6 animate-fade-in">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Generation Form */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6 space-y-6">
            {/* Top Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <Button 
                  variant={isGenerating ? "default" : "ghost"} 
                  size="icon"
                  className="h-9 w-9"
                  disabled={isGenerating}
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => currentPost && handleSave()}
                  disabled={!currentPost || isSaving}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {linkedin.isConnected && linkedin.profile && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={linkedin.profile.picture} />
                    <AvatarFallback className="text-xs">
                      {linkedin.profile.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Type and Category Selects */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type de post</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Catégorie de post</Label>
                <Select value={postCategory} onValueChange={setPostCategory}>
                  <SelectTrigger>
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
            </div>

            {/* Input Tabs */}
            <Tabs value={inputTab} onValueChange={setInputTab}>
              <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-secondary/50">
                <TabsTrigger value="sujet" className="text-xs py-2">
                  Sujet
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs py-2">
                  URL
                </TabsTrigger>
                <TabsTrigger value="fichier" className="text-xs py-2">
                  Fichier
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sujet" className="mt-4">
                <div className="relative">
                  <Textarea
                    placeholder="Décrivez le sujet de votre post...&#10;Ex: Pourquoi l'IA a encore besoin de l'humain..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[120px] resize-none pr-10"
                  />
                  {topic && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setTopic("")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-secondary/30">
                    <Link className="w-5 h-5 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="Collez une URL pour l'analyser..."
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'IA analysera le contenu de l'URL pour générer un post
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="fichier" className="mt-4">
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-border bg-secondary/30">
                  <File className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Glissez un fichier ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, TXT supportés
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Parameters Collapsible */}
            <Collapsible open={parametersOpen} onOpenChange={setParametersOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  parametersOpen && "rotate-180"
                )} />
                Paramètres
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {/* Tonality */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-secondary/50">
                    Tonalité
                  </Badge>
                  <Badge variant="secondary">
                    {brandProfile.companyName}
                  </Badge>
                </div>

                {/* Emojis & Registre */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-secondary/50">
                    Emojis
                  </Badge>
                  <Select value={emojiStyle} onValueChange={setEmojiStyle}>
                    <SelectTrigger className="h-7 w-auto border-none bg-secondary text-xs">
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
                  <Badge variant="outline" className="bg-secondary/50">
                    Registre
                  </Badge>
                  <Select value={registre} onValueChange={setRegistre}>
                    <SelectTrigger className="h-7 w-auto border-none bg-secondary text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTRE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Langue */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-secondary/50">
                    Langue
                  </Badge>
                  <Select value={langue} onValueChange={setLangue}>
                    <SelectTrigger className="h-7 w-auto border-none bg-secondary text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">Variante</Badge>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              variant="premium" 
              className="w-full h-12 text-base"
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
                  Générer un post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Panel - Preview */}
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            {!currentPost ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">
                  Votre post apparaîtra ici
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                  Entrez un sujet et cliquez sur "Générer un post" pour voir la prévisualisation LinkedIn
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* LinkedIn Preview */}
                <LinkedInPreview
                  content={currentPost.content}
                  authorName={linkedin.profile?.name || brandProfile.companyName}
                  authorTitle={`${brandProfile.sector}`}
                  authorImage={linkedin.profile?.picture}
                />

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPreview(false)}
                      className="h-10 w-10"
                      title="Éditer"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPreview(true)}
                      className="h-10 w-10"
                      title="Prévisualiser"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      title="Ajouter une image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowScheduleDialog(true)}
                      className="h-10 w-10"
                      title="Programmer"
                    >
                      <Clock className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handlePublishToLinkedIn}
                    disabled={isPublishing}
                    className="rounded-full h-10 w-10 p-0"
                  >
                    {isPublishing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsUp className="w-3 h-3 text-teal-600" />
                      <span className="text-xs text-teal-600 font-medium">Score</span>
                    </div>
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-400">
                      {currentPost.readabilityScore}/100
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Type className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Caractères</span>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {currentPost.content.length}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3 h-3 text-amber-600" />
                      <span className="text-xs text-amber-600 font-medium">Hashtags</span>
                    </div>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                      {currentPost.hashtags.length}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copié' : 'Copier'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                    Régénérer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Posts Grid */}
      {posts.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Posts sauvegardés ({posts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.slice(0, 6).map((post) => (
                <div 
                  key={post.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer bg-card"
                  onClick={() => {
                    setCurrentPost(post);
                    setShowPreview(true);
                  }}
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
