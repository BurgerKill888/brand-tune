import { useState, useEffect } from "react";
import { 
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Target,
  Frown,
  BookOpen,
  Lightbulb,
  Newspaper,
  Sparkles,
  Check,
  Copy,
  Save,
  Eye,
  PenLine
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BrandProfile } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/appStore";

interface ReflectionViewProps {
  brandProfile: BrandProfile;
  onSavePost: (content: string) => void;
  onNavigate: (view: string) => void;
}

// Types de déclencheurs
const TRIGGERS = [
  { 
    id: 'conversation', 
    label: 'Une conversation', 
    icon: MessageSquare, 
    description: 'Un échange qui vous a marqué',
    emoji: '💬'
  },
  { 
    id: 'victory', 
    label: 'Une victoire', 
    icon: Target, 
    description: 'Quelque chose que vous avez réussi',
    emoji: '🎯'
  },
  { 
    id: 'frustration', 
    label: 'Une frustration', 
    icon: Frown, 
    description: 'Quelque chose qui vous agace',
    emoji: '😤'
  },
  { 
    id: 'learning', 
    label: 'Un apprentissage', 
    icon: BookOpen, 
    description: 'Quelque chose que vous avez découvert',
    emoji: '📚'
  },
  { 
    id: 'insight', 
    label: 'Un déclic', 
    icon: Lightbulb, 
    description: 'Une prise de conscience soudaine',
    emoji: '💡'
  },
  { 
    id: 'news', 
    label: 'Une actualité', 
    icon: Newspaper, 
    description: 'Une info qui vous interpelle',
    emoji: '📰'
  },
];

// Questions par déclencheur
const QUESTIONS: Record<string, { question: string; hint: string }[]> = {
  conversation: [
    { question: "Qui était cette personne ?", hint: "Client, collègue, prospect, ami... Plus vous êtes spécifique, plus votre histoire sera ancrée dans le réel" },
    { question: "Dans quel contexte cette conversation a-t-elle eu lieu ?", hint: "Réunion, café, appel, événement... Le contexte donne de la profondeur" },
    { question: "Quelle question exactement vous a-t-elle posée ?", hint: "Essayez de vous souvenir des mots exacts. Ils rendent l'histoire tangible et crédible" },
    { question: "Qu'est-ce que cette question révèle de plus profond ?", hint: "Un besoin, une peur, une incompréhension... C'est LA question qui transforme une anecdote en insight" },
  ],
  victory: [
    { question: "Qu'avez-vous accompli exactement ?", hint: "Décrivez le résultat concret, mesurable si possible" },
    { question: "Quelle difficulté avez-vous dû surmonter ?", hint: "Les obstacles rendent la victoire plus valorisante" },
    { question: "Quel a été le résultat tangible ?", hint: "Chiffres, feedback, impact... Les preuves comptent" },
    { question: "Quelle a été la clé de votre succès ?", hint: "Ce que vous avez fait différemment cette fois" },
  ],
  frustration: [
    { question: "Qu'est-ce qui vous a frustré exactement ?", hint: "Soyez précis sur la situation" },
    { question: "Pourquoi est-ce un problème selon vous ?", hint: "Expliquez l'impact réel" },
    { question: "Comment cela affecte-t-il concrètement ?", hint: "Votre équipe, vos clients, votre secteur..." },
    { question: "Quelle alternative proposeriez-vous ?", hint: "Votre frustration devient une proposition de valeur" },
  ],
  learning: [
    { question: "Qu'avez-vous découvert récemment ?", hint: "Une méthode, un concept, un outil..." },
    { question: "Comment l'avez-vous appris ?", hint: "Formation, expérience, lecture, mentorat..." },
    { question: "Qu'est-ce qui a changé dans votre façon de voir les choses ?", hint: "Le 'avant/après' est puissant" },
    { question: "Comment pourriez-vous l'appliquer concrètement ?", hint: "Rendez votre apprentissage actionnable" },
  ],
  insight: [
    { question: "Quel moment a déclenché ce déclic ?", hint: "Le contexte précis du 'eureka'" },
    { question: "Qu'avez-vous réalisé exactement ?", hint: "La prise de conscience en une phrase" },
    { question: "Quelle connexion avez-vous faite ?", hint: "Quel lien inattendu avez-vous vu ?" },
    { question: "Qu'est-ce que ça change pour vous ?", hint: "L'impact sur vos pratiques ou votre vision" },
  ],
  news: [
    { question: "Quelle information vous a interpellé ?", hint: "L'actu, la stat, l'annonce..." },
    { question: "Où l'avez-vous vue ?", hint: "Source, contexte de découverte" },
    { question: "Quel angle différent avez-vous sur ce sujet ?", hint: "Votre perspective unique" },
    { question: "Quelles implications pour votre secteur ?", hint: "Ce que ça change concrètement" },
  ],
};

// Structures de narration
const STRUCTURES = [
  { 
    id: 'story', 
    label: 'Raconter une histoire', 
    structure: 'Situation → Événement → Leçon',
    strengths: 'Engageant, mémorable',
    warning: 'Besoin de détails concrets',
    icon: '📖'
  },
  { 
    id: 'opinion', 
    label: 'Prendre position', 
    structure: 'Constat → Votre thèse → Arguments',
    strengths: 'Différenciant, débat',
    warning: 'Assumer sa position',
    icon: '🔥'
  },
  { 
    id: 'tips', 
    label: 'Partager des conseils', 
    structure: 'Problème → Solutions → Action',
    strengths: 'Actionnable, partageable',
    warning: 'Éviter le générique',
    icon: '💡'
  },
  { 
    id: 'question', 
    label: 'Poser une question', 
    structure: 'Contexte → Question ouverte → Votre début de réponse',
    strengths: 'Engagement, humilité',
    warning: 'Question sincère',
    icon: '❓'
  },
];

export function ReflectionView({ brandProfile, onSavePost, onNavigate }: ReflectionViewProps) {
  const { toast } = useToast();
  const { prefillPostData, setPrefillPostData } = useAppStore();
  
  // Étape actuelle (0-4)
  const [currentStep, setCurrentStep] = useState(0);
  
  // Données du parcours
  const [initialThought, setInitialThought] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedStructure, setSelectedStructure] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [copied, setCopied] = useState(false);

  // Charger les données pré-remplies
  useEffect(() => {
    if (prefillPostData?.topic) {
      setInitialThought(prefillPostData.topic);
      setPrefillPostData(null);
    }
  }, [prefillPostData]);

  // Auto-save
  useEffect(() => {
    const timer = setInterval(() => {
      if (postContent.trim()) {
        localStorage.setItem('draft_reflection', JSON.stringify({
          initialThought,
          selectedTrigger,
          answers,
          selectedStructure,
          postContent,
          savedAt: new Date().toISOString()
        }));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [postContent, initialThought, selectedTrigger, answers, selectedStructure]);

  const questions = selectedTrigger ? QUESTIONS[selectedTrigger] : [];

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerQuestion = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleNextStep();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    toast({ title: "Copié !", description: "Votre post est dans le presse-papier" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSavePost(postContent);
    toast({ title: "Sauvegardé !", description: "Votre brouillon est enregistré" });
  };

  // Rendu par étape
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // ÉTAPE 0 : Point de départ
  const renderStep0 = () => (
    <div className="text-center max-w-lg mx-auto animate-fade-in">
      <div className="text-5xl mb-6">💭</div>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        De quoi voulez-vous parler ?
      </h2>
      
      <Textarea
        value={initialThought}
        onChange={(e) => setInitialThought(e.target.value)}
        placeholder="Ex: Une conversation, une réalisation, une frustration, une observation..."
        className="zen-textarea text-base mb-4"
        rows={4}
      />

      <div className="help-card text-left mb-6">
        <p className="text-sm">
          💡 Aucun filtre ici. Juste le début d'une pensée.
        </p>
      </div>

      <Button 
        onClick={handleNextStep}
        disabled={!initialThought.trim()}
        className="btn-primary"
      >
        Continuer
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  // ÉTAPE 1 : Contextualiser
  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Ce qui a été écrit */}
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-sm text-muted-foreground mb-1">Vous avez écrit :</p>
        <p className="text-foreground italic">"{initialThought.slice(0, 100)}{initialThought.length > 100 ? '...' : ''}"</p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-2">
        ✨ Cette réflexion vient probablement de :
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Chaque type d'expérience appelle des questions différentes pour en extraire toute la valeur.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {TRIGGERS.map((trigger) => (
          <button
            key={trigger.id}
            onClick={() => setSelectedTrigger(trigger.id)}
            className={cn(
              "trigger-card",
              selectedTrigger === trigger.id && "selected"
            )}
          >
            <div className="text-3xl mb-2">{trigger.emoji}</div>
            <p className="font-medium text-foreground">{trigger.label}</p>
            <p className="text-sm text-muted-foreground">{trigger.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handlePrevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button 
          onClick={handleNextStep}
          disabled={!selectedTrigger}
          className="btn-primary"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // ÉTAPE 2 : Extraction (Questions)
  const renderStep2 = () => {
    const currentQ = questions[currentQuestionIndex];
    
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-4">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </Badge>
        </div>

        <h2 className="text-xl font-semibold text-foreground text-center mb-4">
          {currentQ?.question}
        </h2>

        <Textarea
          value={answers[currentQuestionIndex] || ""}
          onChange={(e) => handleAnswerQuestion(e.target.value)}
          placeholder="Prenez votre temps..."
          className="zen-textarea text-base mb-4"
          rows={4}
        />

        <div className="help-card mb-6">
          <p className="text-sm">
            💡 {currentQ?.hint}
          </p>
        </div>

        <div className="flex justify-between">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else {
                handlePrevStep();
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentQuestionIndex > 0 ? 'Question précédente' : 'Retour'}
          </Button>
          <Button 
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestionIndex]?.trim()}
            className="btn-primary"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Question suivante' : 'Passer à la structure'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // ÉTAPE 3 : Structure
  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Récapitulatif */}
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-2">📍 Récapitulatif de votre vécu</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Déclencheur :</strong> {TRIGGERS.find(t => t.id === selectedTrigger)?.label}</p>
            {answers.slice(0, 2).map((a, i) => (
              <p key={i} className="line-clamp-1">
                <strong>{questions[i]?.question.split(' ').slice(0, 3).join(' ')}...</strong> {a.slice(0, 50)}...
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground mb-2">
        Comment voulez-vous raconter cette histoire ?
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Vous avez la matière. Maintenant, choisissons comment la structurer.
      </p>

      <div className="space-y-4 mb-6">
        {STRUCTURES.map((struct) => (
          <button
            key={struct.id}
            onClick={() => setSelectedStructure(struct.id)}
            className={cn(
              "w-full trigger-card",
              selectedStructure === struct.id && "selected"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">{struct.icon}</div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{struct.label}</p>
                <p className="text-sm text-primary">→ {struct.structure}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-600">💪 {struct.strengths}</span>
                  <span className="text-amber-600">⚠️ {struct.warning}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handlePrevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button 
          onClick={handleNextStep}
          disabled={!selectedStructure}
          className="btn-primary"
        >
          Passer à la rédaction
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // ÉTAPE 4 : Rédaction
  const renderStep4 = () => {
    const structure = STRUCTURES.find(s => s.id === selectedStructure);
    const charCount = postContent.length;
    const isOptimal = charCount >= 600 && charCount <= 1500;

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guide latéral */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-secondary/30">
              <p className="text-sm font-medium text-foreground mb-2">
                {structure?.icon} Structure choisie
              </p>
              <p className="text-xs text-muted-foreground">
                {structure?.structure}
              </p>
            </Card>

            <div className="help-card">
              <p className="text-sm font-medium mb-2">Questions pour vous guider :</p>
              <ul className="text-sm space-y-2">
                {questions.slice(0, 3).map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{q.question.split(' ').slice(0, 5).join(' ')}?</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground italic">
              💡 Votre vécu est unique, racontez-le avec vos mots
            </p>
          </div>

          {/* Zone de rédaction */}
          <div className="lg:col-span-2">
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Commencez à écrire votre post... L'authenticité avant la performance."
              className="zen-textarea min-h-[400px] text-base"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm",
                  isOptimal ? "text-green-600" : charCount > 1500 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {charCount} caractères
                </span>
                {isOptimal && <Badge variant="secondary" className="text-xs">Optimal ✓</Badge>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Sauvegarder
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={handlePrevStep}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Modifier la structure
          </Button>
          <Button 
            onClick={() => toast({ title: "Post terminé ! 🎉", description: "Vous pouvez maintenant le copier et le publier sur LinkedIn" })}
            disabled={!postContent.trim()}
            className="btn-primary"
          >
            <Check className="w-4 h-4 mr-2" />
            Terminer
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] py-8">
      {/* Barre de progression */}
      <div className="flex justify-center gap-3 mb-12">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "progress-dot",
              currentStep === step && "active",
              currentStep > step && "completed"
            )}
          />
        ))}
      </div>

      {/* Contenu de l'étape */}
      {renderStep()}
    </div>
  );
}

