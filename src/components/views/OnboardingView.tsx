import { useState } from "react";
import { 
  Building2, 
  Target, 
  MessageSquare, 
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BrandProfile, EditorialCharter } from "@/types";
import { cn } from "@/lib/utils";

interface OnboardingViewProps {
  onComplete: (profile: BrandProfile) => void;
}

const TONE_OPTIONS = [
  { value: 'expert', label: 'Expert', description: 'Technique et autoritaire' },
  { value: 'friendly', label: 'Friendly', description: 'Accessible et chaleureux' },
  { value: 'storytelling', label: 'Storytelling', description: 'Narratif et engageant' },
  { value: 'punchline', label: 'Punchline', description: 'Percutant et mémorable' },
  { value: 'mixed', label: 'Mixte', description: 'Variable selon le contexte' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Quotidien', description: '5+ posts/semaine' },
  { value: '3-per-week', label: '3x/semaine', description: 'Rythme soutenu' },
  { value: '2-per-week', label: '2x/semaine', description: 'Régulier' },
  { value: 'weekly', label: 'Hebdomadaire', description: '1 post/semaine' },
] as const;

const STEPS = [
  { id: 1, title: "Entreprise", icon: Building2 },
  { id: 2, title: "Cibles", icon: Target },
  { id: 3, title: "Ton", icon: MessageSquare },
  { id: 4, title: "Objectifs", icon: BarChart3 },
];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    sector: '',
    targets: [] as string[],
    targetInput: '',
    businessObjectives: [] as string[],
    objectiveInput: '',
    tone: '' as BrandProfile['tone'],
    values: [] as string[],
    valueInput: '',
    forbiddenWords: [] as string[],
    forbiddenInput: '',
    publishingFrequency: '' as BrandProfile['publishingFrequency'],
    kpis: [] as string[],
    kpiInput: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: string, inputField: string) => {
    const value = formData[inputField as keyof typeof formData] as string;
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()],
        [inputField]: '',
      }));
    }
  };

  const removeFromArray = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
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
    const charter: EditorialCharter = {
      audience: formData.targets.join(', '),
      positioning: `${formData.companyName} - ${formData.sector}`,
      tone: formData.tone,
      doList: formData.values,
      dontList: formData.forbiddenWords,
      kpis: formData.kpis,
      writingStyle: `Ton ${formData.tone}, fréquence ${formData.publishingFrequency}`,
    };

    const profile: BrandProfile = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      companyName: formData.companyName,
      sector: formData.sector,
      targets: formData.targets,
      businessObjectives: formData.businessObjectives,
      tone: formData.tone,
      values: formData.values,
      forbiddenWords: formData.forbiddenWords,
      examplePosts: [],
      publishingFrequency: formData.publishingFrequency,
      kpis: formData.kpis,
      editorialCharter: charter,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onComplete(profile);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName.trim() && formData.sector.trim();
      case 2:
        return formData.targets.length > 0;
      case 3:
        return formData.tone && formData.values.length > 0;
      case 4:
        return formData.publishingFrequency && formData.kpis.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Configurez votre profil éditorial
        </h1>
        <p className="text-muted-foreground">
          Répondez à quelques questions pour personnaliser votre stratégie
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : currentStep > step.id
                  ? "bg-teal-100 text-teal-700"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-2",
                currentStep > step.id ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-secondary/30 border-b border-border">
          <CardTitle>Étape {currentStep} sur 4</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Présentez votre entreprise"}
            {currentStep === 2 && "Définissez vos cibles et objectifs"}
            {currentStep === 3 && "Choisissez votre ton et vos valeurs"}
            {currentStep === 4 && "Configurez vos KPIs et fréquence"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {currentStep === 1 && (
            <Step1Form formData={formData} updateField={updateField} />
          )}
          {currentStep === 2 && (
            <Step2Form 
              formData={formData} 
              updateField={updateField}
              addToArray={addToArray}
              removeFromArray={removeFromArray}
            />
          )}
          {currentStep === 3 && (
            <Step3Form 
              formData={formData} 
              updateField={updateField}
              addToArray={addToArray}
              removeFromArray={removeFromArray}
            />
          )}
          {currentStep === 4 && (
            <Step4Form 
              formData={formData} 
              updateField={updateField}
              addToArray={addToArray}
              removeFromArray={removeFromArray}
            />
          )}
        </CardContent>

        {/* Footer */}
        <div className="px-8 py-6 bg-secondary/30 border-t border-border flex items-center justify-between">
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
            variant="premium"
            onClick={handleNext}
            disabled={!isStepValid()}
            className="gap-2"
          >
            {currentStep === 4 ? (
              <>
                Terminer
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
      </Card>
    </div>
  );
}

function Step1Form({ formData, updateField }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Nom de l'entreprise</Label>
        <Input
          id="companyName"
          placeholder="Ex: Acme Corp"
          value={formData.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          className="h-12"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sector">Secteur d'activité</Label>
        <Input
          id="sector"
          placeholder="Ex: SaaS B2B, E-commerce, Consulting..."
          value={formData.sector}
          onChange={(e) => updateField('sector', e.target.value)}
          className="h-12"
        />
      </div>
    </div>
  );
}

function Step2Form({ formData, updateField, addToArray, removeFromArray }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cibles principales</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Directeurs marketing, CEO startup..."
            value={formData.targetInput}
            onChange={(e) => updateField('targetInput', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToArray('targets', 'targetInput')}
            className="h-12"
          />
          <Button onClick={() => addToArray('targets', 'targetInput')} variant="secondary">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.targets.map((target: string, i: number) => (
            <Badge 
              key={i} 
              variant="info" 
              className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => removeFromArray('targets', i)}
            >
              {target} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Objectifs business</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Générer des leads, Notoriété, Recrutement..."
            value={formData.objectiveInput}
            onChange={(e) => updateField('objectiveInput', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToArray('businessObjectives', 'objectiveInput')}
            className="h-12"
          />
          <Button onClick={() => addToArray('businessObjectives', 'objectiveInput')} variant="secondary">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.businessObjectives.map((obj: string, i: number) => (
            <Badge 
              key={i} 
              variant="success" 
              className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => removeFromArray('businessObjectives', i)}
            >
              {obj} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Form({ formData, updateField, addToArray, removeFromArray }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Ton éditorial</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateField('tone', option.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-200",
                formData.tone === option.value
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-primary/50 hover:bg-secondary"
              )}
            >
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Valeurs à transmettre</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Innovation, Transparence, Excellence..."
            value={formData.valueInput}
            onChange={(e) => updateField('valueInput', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToArray('values', 'valueInput')}
            className="h-12"
          />
          <Button onClick={() => addToArray('values', 'valueInput')} variant="secondary">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.values.map((value: string, i: number) => (
            <Badge 
              key={i} 
              variant="info" 
              className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => removeFromArray('values', i)}
            >
              {value} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mots interdits (optionnel)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Révolutionnaire, Unique, Meilleur..."
            value={formData.forbiddenInput}
            onChange={(e) => updateField('forbiddenInput', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToArray('forbiddenWords', 'forbiddenInput')}
            className="h-12"
          />
          <Button onClick={() => addToArray('forbiddenWords', 'forbiddenInput')} variant="secondary">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.forbiddenWords.map((word: string, i: number) => (
            <Badge 
              key={i} 
              variant="warning" 
              className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => removeFromArray('forbiddenWords', i)}
            >
              {word} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4Form({ formData, updateField, addToArray, removeFromArray }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Fréquence de publication</Label>
        <div className="grid grid-cols-2 gap-3">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateField('publishingFrequency', option.value)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-200",
                formData.publishingFrequency === option.value
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-primary/50 hover:bg-secondary"
              )}
            >
              <p className="font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>KPIs à suivre</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Impressions, Engagement rate, Leads générés..."
            value={formData.kpiInput}
            onChange={(e) => updateField('kpiInput', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToArray('kpis', 'kpiInput')}
            className="h-12"
          />
          <Button onClick={() => addToArray('kpis', 'kpiInput')} variant="secondary">
            Ajouter
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.kpis.map((kpi: string, i: number) => (
            <Badge 
              key={i} 
              variant="success" 
              className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => removeFromArray('kpis', i)}
            >
              {kpi} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
