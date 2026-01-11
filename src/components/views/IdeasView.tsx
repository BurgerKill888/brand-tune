import { useState, useEffect } from "react";
import { 
  Lightbulb,
  Trash2,
  ArrowRight,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BrandProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";

interface IdeasViewProps {
  brandProfile: BrandProfile | null;
  onNavigate: (view: string) => void;
}

interface CapturedIdea {
  id: string;
  title: string;
  hook: string;
  source?: string;
  createdAt: string;
  developed?: boolean;
}

// Idées par défaut (larges et adaptables)
const DEFAULT_IDEAS: Omit<CapturedIdea, 'id' | 'createdAt'>[] = [
  { 
    title: "Les 5 erreurs que tout le monde fait au début",
    hook: "Partagez les leçons que vous auriez aimé apprendre plus tôt",
    source: "Expérience personnelle"
  },
  { 
    title: "Ce que j'ai appris en échouant",
    hook: "Un échec récent et ce qu'il vous a enseigné",
    source: "Retour d'expérience"
  },
  { 
    title: "La question qu'on me pose le plus souvent",
    hook: "Répondez enfin à cette question récurrente",
    source: "Interactions clients"
  },
  { 
    title: "Avant vs Maintenant : mon évolution",
    hook: "Comment votre approche a évolué avec l'expérience",
    source: "Introspection professionnelle"
  },
  { 
    title: "Le conseil que je donnerais à mon moi d'il y a 5 ans",
    hook: "Un message du futur pour les débutants",
    source: "Sagesse acquise"
  },
  { 
    title: "Pourquoi j'ai changé d'avis sur...",
    hook: "Une conviction qui a évolué avec le temps",
    source: "Évolution de pensée"
  },
];

export function IdeasView({ brandProfile, onNavigate }: IdeasViewProps) {
  const { toast } = useToast();
  const { setPrefillPostData } = useAppStore();
  const [capturedIdeas, setCapturedIdeas] = useState<CapturedIdea[]>([]);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Charger les idées
  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = () => {
    try {
      const saved = localStorage.getItem('captured_ideas');
      if (saved) {
        setCapturedIdeas(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading ideas:', e);
    }
  };

  const saveIdeas = (ideas: CapturedIdea[]) => {
    localStorage.setItem('captured_ideas', JSON.stringify(ideas));
    setCapturedIdeas(ideas);
  };

  const handleAddIdea = () => {
    if (!newIdeaTitle.trim()) return;

    const newIdea: CapturedIdea = {
      id: `idea-${Date.now()}`,
      title: newIdeaTitle,
      hook: "Développez cette idée selon votre angle unique",
      source: "Ajout manuel",
      createdAt: new Date().toISOString(),
    };

    saveIdeas([newIdea, ...capturedIdeas]);
    setNewIdeaTitle("");
    setShowAddForm(false);
    toast({ title: "Idée ajoutée !", description: "Elle est prête à être développée" });
  };

  const handleDeleteIdea = (id: string) => {
    const updated = capturedIdeas.filter(i => i.id !== id);
    saveIdeas(updated);
    toast({ title: "Idée supprimée" });
  };

  const handleDevelopIdea = (idea: CapturedIdea) => {
    setPrefillPostData({
      topic: `${idea.title}\n\n${idea.hook}`,
      category: undefined,
    });
    
    // Marquer comme développée
    const updated = capturedIdeas.map(i => 
      i.id === idea.id ? { ...i, developed: true } : i
    );
    saveIdeas(updated);
    
    onNavigate('posts');
  };

  const handleUseDefaultIdea = (idea: Omit<CapturedIdea, 'id' | 'createdAt'>) => {
    setPrefillPostData({
      topic: `${idea.title}\n\n${idea.hook}`,
      category: undefined,
    });
    onNavigate('posts');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Mes idées capturées
        </h1>
        <p className="text-muted-foreground">
          Votre réservoir d'inspiration pour vos prochains posts authentiques
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        {showAddForm ? (
          <Card className="w-full border-border/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Input
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
                  placeholder="Notez une nouvelle idée..."
                  className="flex-1"
                  autoFocus
                />
                <Button onClick={handleAddIdea} disabled={!newIdeaTitle.trim()}>
                  Ajouter
                </Button>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une idée
          </Button>
        )}
      </div>

      {/* Idées capturées */}
      {capturedIdeas.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Vos idées ({capturedIdeas.length})
          </h2>

          <div className="space-y-3">
            {capturedIdeas.map((idea) => (
              <Card 
                key={idea.id} 
                className={cn(
                  "content-card",
                  idea.developed && "border-green-200 bg-green-50/30"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      {idea.developed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground mb-1">
                        {idea.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {idea.hook}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(idea.createdAt)}
                        </span>
                        {idea.source && (
                          <Badge variant="outline" className="text-xs">
                            {idea.source}
                          </Badge>
                        )}
                        {idea.developed && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Développée
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDevelopIdea(idea)}
                      >
                        Développer
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Idées par défaut - Toujours affichées */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          Idées universelles
          <span className="text-xs font-normal text-muted-foreground ml-2">
            Des angles qui marchent toujours
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_IDEAS.map((idea, index) => (
            <Card 
              key={index} 
              className="content-card cursor-pointer hover:border-primary/30 group"
              onClick={() => handleUseDefaultIdea(idea)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {idea.hook}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Message d'encouragement */}
      {capturedIdeas.length === 0 && (
        <div className="help-card text-center">
          <p className="text-sm">
            💡 <strong>Conseil :</strong> Les meilleures idées viennent souvent de la veille. Explorez les actualités de votre secteur et capturez ce qui vous interpelle !
          </p>
          <Button 
            variant="link" 
            onClick={() => onNavigate('watch')}
            className="mt-2"
          >
            Aller à la veille
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
