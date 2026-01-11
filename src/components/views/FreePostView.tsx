import { useState, useEffect } from "react";
import { 
  Sparkles,
  Copy,
  Check,
  Save,
  Wand2,
  RefreshCw,
  Lightbulb,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BrandProfile, Post } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/appStore";

interface FreePostViewProps {
  brandProfile: BrandProfile;
  onSavePost: (post: Partial<Post>) => Promise<{ error: Error | null }>;
}

const QUICK_PROMPTS = [
  { emoji: "✨", label: "Améliorer", action: "improve", desc: "Style plus engageant" },
  { emoji: "🎯", label: "Plus percutant", action: "punchier", desc: "Phrases courtes" },
  { emoji: "📝", label: "Reformuler", action: "rephrase", desc: "Version alternative" },
  { emoji: "🔥", label: "Accroche", action: "hook", desc: "Début captivant" },
  { emoji: "❓", label: "Question", action: "question", desc: "Invite aux commentaires" },
];

export function FreePostView({ brandProfile, onSavePost }: FreePostViewProps) {
  const { toast } = useToast();
  const { prefillPostData, setPrefillPostData } = useAppStore();
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger le texte pré-rempli depuis le Dashboard
  useEffect(() => {
    if (prefillPostData?.topic) {
      setContent(prefillPostData.topic);
      setPrefillPostData(null);
      toast({ title: "Votre réflexion a été chargée ✨" });
    }
  }, [prefillPostData]);

  const handleAIAssist = async (action: string) => {
    if (!content.trim()) {
      toast({ title: "Écrivez d'abord quelque chose", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setActiveAction(action);
    
    try {
      // Construire le prompt selon l'action
      const actionPrompts: Record<string, string> = {
        improve: `Améliore ce texte pour LinkedIn en gardant le sens : "${content}"`,
        punchier: `Rends ce texte plus percutant et direct pour LinkedIn : "${content}"`,
        rephrase: `Reformule ce texte différemment pour LinkedIn : "${content}"`,
        hook: `Ajoute une accroche percutante à ce texte LinkedIn : "${content}"`,
        question: `Ajoute une question engageante à la fin de ce texte LinkedIn : "${content}"`,
        complete: `Développe cette idée en un post LinkedIn complet : "${content}"`,
      };

      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          topic: actionPrompts[action],
          length: 'medium',
          postType: 'instructif',
          postCategory: 'conseil',
          emojiStyle: 'adapte',
          registre: 'vouvoiement',
          langue: 'francais',
          brandProfile: {
            companyName: brandProfile.companyName,
            sector: brandProfile.sector,
            tone: brandProfile.tone,
            values: brandProfile.values || [],
            forbiddenWords: brandProfile.forbiddenWords || [],
            targets: brandProfile.targets || [],
            businessObjectives: brandProfile.businessObjectives || [],
          },
          includeCta: true,
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Erreur de la fonction');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data?.content) {
        setContent(data.content);
        toast({ 
          title: action === 'complete' ? "Post complété ! ✨" : "Post amélioré ! ✨",
          description: "Vous pouvez continuer à modifier"
        });
      } else {
        throw new Error('Aucun contenu retourné');
      }
    } catch (error: any) {
      console.error('AI assist error:', error);
      toast({ 
        title: "Erreur", 
        description: error?.message || "L'IA n'est pas disponible",
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleComplete = () => handleAIAssist('complete');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copié ! 📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    try {
      await onSavePost({
        content,
        status: 'draft',
        type: 'free',
      });
      toast({ title: "Brouillon sauvegardé ! ✅" });
    } catch {
      toast({ title: "Erreur de sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const charCount = content.length;
  const isOptimalLength = charCount >= 500 && charCount <= 1500;
  const isTooShort = charCount > 0 && charCount < 100;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-8 px-4 animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Nouveau post
          </h1>
          <p className="text-muted-foreground">
            Écrivez librement, l'IA peut vous aider à améliorer
          </p>
        </div>

        {/* Editor */}
        <Card className="border-border/50 shadow-sm mb-6">
          <CardContent className="p-0">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Qu'avez-vous envie de partager aujourd'hui ?

Écrivez une ébauche, même imparfaite...
L'IA peut ensuite vous aider à l'améliorer."
              className="min-h-[300px] text-base border-0 focus-visible:ring-0 resize-none p-6 rounded-xl"
              disabled={isGenerating}
            />
            
            {/* Complete button - visible when text is short */}
            {isTooShort && (
              <div className="px-6 py-3 border-t border-border/30 bg-primary/5">
                <Button
                  onClick={handleComplete}
                  disabled={isGenerating}
                  className="w-full btn-primary"
                >
                  {isGenerating && activeAction === 'complete' ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> L'IA développe votre idée...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> Compléter et développer avec l'IA</>
                  )}
                </Button>
              </div>
            )}
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
              <span className={cn(
                "text-sm",
                isOptimalLength ? "text-green-600 font-medium" : "text-muted-foreground"
              )}>
                {charCount} caractères
                {isOptimalLength && " ✓ Longueur idéale"}
                {isTooShort && " — Écrivez un peu plus"}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "..." : "Sauvegarder"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  disabled={!content.trim()}
                  className="btn-primary"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2" /> Copié !</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copier</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistance */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Assistance IA</span>
              {isGenerating && (
                <span className="ml-auto flex items-center gap-2 text-sm text-primary">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  En cours...
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.action}
                  onClick={() => handleAIAssist(prompt.action)}
                  disabled={isGenerating || !content.trim()}
                  className={cn(
                    "p-3 rounded-xl border text-center transition-all",
                    "border-border/50 bg-white hover:bg-primary/5 hover:border-primary/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    activeAction === prompt.action && "bg-primary/10 border-primary/50"
                  )}
                >
                  <div className="text-xl mb-1">{prompt.emoji}</div>
                  <div className="text-xs font-medium text-foreground">{prompt.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{prompt.desc}</div>
                </button>
              ))}
            </div>

            {/* Compléter button for longer texts */}
            {charCount >= 100 && charCount < 400 && (
              <Button
                onClick={handleComplete}
                disabled={isGenerating}
                variant="outline"
                className="w-full mt-4"
              >
                {isGenerating && activeAction === 'complete' ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Développement en cours...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Développer et compléter le post</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/30">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Comment ça marche :</strong>
              <ul className="mt-2 space-y-1">
                <li>• Écrivez votre idée, même brute ou incomplète</li>
                <li>• Cliquez sur un bouton d'assistance pour améliorer</li>
                <li>• L'IA génère une version améliorée de votre texte</li>
                <li>• Vous pouvez enchaîner plusieurs améliorations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
