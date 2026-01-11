import { useState } from "react";
import { 
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  User,
  Building2,
  Compass,
  Users,
  Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandProfile, EditorialCharter } from "@/types";
import { cn } from "@/lib/utils";

interface OnboardingViewProps {
  onComplete: (profile: BrandProfile) => void;
}

// Gélules pour les choix
const ROLE_OPTIONS = [
  { value: 'founder', label: '🚀 Fondateur / CEO', emoji: '🚀' },
  { value: 'director', label: '👔 Dirigeant', emoji: '👔' },
  { value: 'manager', label: '📊 Manager', emoji: '📊' },
  { value: 'expert', label: '🎯 Expert / Consultant', emoji: '🎯' },
  { value: 'freelance', label: '💻 Freelance', emoji: '💻' },
  { value: 'employee', label: '🧑‍💼 Salarié', emoji: '🧑‍💼' },
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
  { value: 'passion', label: '❤️ Une passion', emoji: '❤️' },
  { value: 'reconversion', label: '🔄 Une reconversion', emoji: '🔄' },
  { value: 'opportunity', label: '🎲 Une opportunité', emoji: '🎲' },
  { value: 'heritage', label: '👨‍👩‍👧 Un héritage familial', emoji: '👨‍👩‍👧' },
  { value: 'necessity', label: '💪 Une nécessité', emoji: '💪' },
  { value: 'curiosity', label: '🔍 La curiosité', emoji: '🔍' },
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

const CURRENT_FREQUENCY_OPTIONS = [
  { value: 'never', label: 'Jamais publié' },
  { value: 'rarely', label: 'Rarement (quelques fois par an)' },
  { value: 'monthly', label: '1-2 fois par mois' },
  { value: 'weekly', label: '1 fois par semaine' },
  { value: 'regular', label: '2-3 fois par semaine' },
];

const TARGET_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: '1x / semaine' },
  { value: '2-per-week', label: '2x / semaine' },
  { value: '3-per-week', label: '3x / semaine' },
  { value: 'daily', label: 'Quotidien' },
];

const STEPS = [
  { id: 1, title: "Vous", icon: User, question: "Faisons connaissance 👋" },
  { id: 2, title: "Entreprise", icon: Building2, question: "Parlez-moi de votre activité" },
  { id: 3, title: "Parcours", icon: Compass, question: "Votre histoire m'intéresse" },
  { id: 4, title: "Audience", icon: Users, question: "À qui voulez-vous parler ?" },
  { id: 5, title: "Rythme", icon: Calendar, question: "Trouvons votre rythme" },
];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Vous
    firstName: '',
    role: '',
    // Step 2 - Entreprise
    companyName: '',
    sector: '',
    teamSize: '',
    // Step 3 - Parcours
    experience: '',
    journey: '',
    motivations: [] as string[],
    // Step 4 - Audience
    audiences: [] as string[],
    goals: [] as string[],
    // Step 5 - Rythme
    currentFrequency: '',
    targetFrequency: '',
  });

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

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Convertir les motivations en valeurs pour le profil
    const motivationLabels = formData.motivations.map(m => 
      MOTIVATION_OPTIONS.find(o => o.value === m)?.label.replace(/^[^\s]+\s/, '') || m
    );

    // Convertir les audiences en cibles
    const targetLabels = formData.audiences.map(a => 
      AUDIENCE_OPTIONS.find(o => o.value === a)?.label.replace(/^[^\s]+\s/, '') || a
    );

    // Convertir les objectifs
    const goalLabels = formData.goals.map(g => 
      GOAL_OPTIONS.find(o => o.value === g)?.label.replace(/^[^\s]+\s/, '') || g
    );

    const charter: EditorialCharter = {
      audience: targetLabels.join(', '),
      positioning: `${formData.companyName} - ${formData.sector}`,
      tone: 'mixed', // Sera déduit du contexte
      doList: motivationLabels,
      dontList: [],
      kpis: goalLabels,
      writingStyle: `Fréquence cible: ${formData.targetFrequency}`,
    };

    const profile: BrandProfile = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      companyName: formData.companyName || formData.firstName,
      sector: formData.sector,
      targets: targetLabels,
      businessObjectives: goalLabels,
      tone: 'mixed', // Le ton sera adapté selon le contexte
      values: motivationLabels,
      forbiddenWords: [],
      examplePosts: [],
      publishingFrequency: formData.targetFrequency as BrandProfile['publishingFrequency'],
      kpis: goalLabels,
      editorialCharter: charter,
      // Nouvelles données contextuelles
      firstName: formData.firstName,
      role: formData.role,
      teamSize: formData.teamSize,
      experience: formData.experience,
      journey: formData.journey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onComplete(profile);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() && formData.role;
      case 2:
        return formData.sector.trim() && formData.teamSize;
      case 3:
        return formData.experience && formData.journey && formData.motivations.length > 0;
      case 4:
        return formData.audiences.length > 0 && formData.goals.length > 0;
      case 5:
        return formData.currentFrequency && formData.targetFrequency;
      default:
        return false;
    }
  };

  const currentStepData = STEPS[currentStep - 1];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in py-8">
      {/* Header minimaliste */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Étape {currentStep} sur 5
        </p>
      </div>

      {/* Progress bar simple */}
      <div className="flex gap-1 mb-8 px-4">
        {STEPS.map((step) => (
          <div 
            key={step.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              currentStep >= step.id ? "bg-primary" : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Question principale */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {currentStepData.question}
        </h1>
      </div>

      {/* Contenu de l'étape */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {currentStep === 1 && (
            <Step1Content formData={formData} updateField={updateField} />
          )}
          {currentStep === 2 && (
            <Step2Content formData={formData} updateField={updateField} />
          )}
          {currentStep === 3 && (
            <Step3Content formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} />
          )}
          {currentStep === 4 && (
            <Step4Content formData={formData} toggleArrayField={toggleArrayField} />
          )}
          {currentStep === 5 && (
            <Step5Content formData={formData} updateField={updateField} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 px-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isStepValid()}
          className="gap-2 btn-primary"
        >
          {currentStep === 5 ? (
            <>
              C'est parti !
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Continuer
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Composant Gélule réutilisable
function Pill({ 
  label, 
  selected, 
  onClick,
  size = 'default'
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
  size?: 'default' | 'large';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border-2 transition-all duration-200 font-medium",
        size === 'large' ? "px-5 py-3 text-base" : "px-4 py-2 text-sm",
        selected
          ? "border-primary bg-primary text-white shadow-md"
          : "border-border bg-white hover:border-primary/50 hover:bg-primary/5 text-foreground"
      )}
    >
      {label}
    </button>
  );
}

// Étape 1 : Vous
function Step1Content({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Prénom */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Comment vous appelez-vous ?
        </label>
        <Input
          placeholder="Votre prénom"
          value={formData.firstName}
          onChange={(e) => updateField('firstName', e.target.value)}
          className="h-12 text-lg"
          autoFocus
        />
      </div>

      {/* Rôle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Quel est votre rôle ?
        </label>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.role === option.value}
              onClick={() => updateField('role', option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Étape 2 : Entreprise
function Step2Content({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Nom entreprise (optionnel) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Nom de votre entreprise <span className="text-muted-foreground">(optionnel)</span>
        </label>
        <Input
          placeholder="Ex: Mon Entreprise"
          value={formData.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          className="h-12"
        />
      </div>

      {/* Secteur */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Dans quel secteur évoluez-vous ?
        </label>
        <Input
          placeholder="Ex: Marketing digital, Immobilier, Tech, Santé..."
          value={formData.sector}
          onChange={(e) => updateField('sector', e.target.value)}
          className="h-12"
        />
        <p className="text-xs text-muted-foreground">
          Soyez précis, ça m'aidera à mieux vous accompagner
        </p>
      </div>

      {/* Taille équipe */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Taille de votre équipe
        </label>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZE_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.teamSize === option.value}
              onClick={() => updateField('teamSize', option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Étape 3 : Parcours
function Step3Content({ formData, updateField, toggleArrayField }: any) {
  return (
    <div className="space-y-6">
      {/* Expérience */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Depuis combien de temps êtes-vous dans ce domaine ?
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.experience === option.value}
              onClick={() => updateField('experience', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Parcours */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Qu'est-ce qui vous a mené ici ?
        </label>
        <div className="flex flex-wrap gap-2">
          {JOURNEY_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.journey === option.value}
              onClick={() => updateField('journey', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Motivations (multi-select) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Qu'est-ce qui vous anime le plus ? <span className="text-muted-foreground">(plusieurs choix possibles)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MOTIVATION_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.motivations.includes(option.value)}
              onClick={() => toggleArrayField('motivations', option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Étape 4 : Audience
function Step4Content({ formData, toggleArrayField }: any) {
  return (
    <div className="space-y-6">
      {/* Audiences (multi-select) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          À qui voulez-vous parler sur LinkedIn ? <span className="text-muted-foreground">(plusieurs choix possibles)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.audiences.includes(option.value)}
              onClick={() => toggleArrayField('audiences', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Objectifs (multi-select) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Qu'est-ce que vous voulez accomplir ? <span className="text-muted-foreground">(plusieurs choix possibles)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.goals.includes(option.value)}
              onClick={() => toggleArrayField('goals', option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Étape 5 : Rythme
function Step5Content({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      {/* Fréquence actuelle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          À quelle fréquence publiez-vous actuellement ?
        </label>
        <div className="flex flex-wrap gap-2">
          {CURRENT_FREQUENCY_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.currentFrequency === option.value}
              onClick={() => updateField('currentFrequency', option.value)}
            />
          ))}
        </div>
      </div>

      {/* Fréquence cible */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Quel rythme vous semble réaliste pour vous ?
        </label>
        <div className="flex flex-wrap gap-2">
          {TARGET_FREQUENCY_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={formData.targetFrequency === option.value}
              onClick={() => updateField('targetFrequency', option.value)}
              size="large"
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 Conseil : mieux vaut un post par semaine de qualité que 5 posts bâclés
        </p>
      </div>

      {/* Message de bienvenue */}
      {formData.targetFrequency && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <p className="text-sm text-foreground">
            ✨ Parfait {formData.firstName} ! Je vais vous accompagner pour créer du contenu authentique qui reflète votre parcours et parle vraiment à votre audience.
          </p>
        </div>
      )}
    </div>
  );
}
