import { useState, useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  Video,
  Sparkles,
  Upload,
  Download,
  Trash2,
  Plus,
  Wand2,
  Loader2,
  Palette,
  Type,
  Square,
  Circle,
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Scissors,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Film,
  ImagePlus,
  Crop,
  SunMedium,
  Contrast,
  Droplets,
  Brush,
  Eraser,
  PenTool
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BrandProfile } from "@/types";

interface StudioViewProps {
  brandProfile: BrandProfile | null;
}

interface UploadedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  file?: File;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

const IMAGE_STYLES = [
  { id: 'professional', label: 'Professionnel', description: 'Clean et corporate' },
  { id: 'creative', label: 'Créatif', description: 'Artistique et coloré' },
  { id: 'minimalist', label: 'Minimaliste', description: 'Simple et épuré' },
  { id: 'tech', label: 'Tech', description: 'Moderne et futuriste' },
  { id: 'nature', label: 'Nature', description: 'Organique et naturel' },
  { id: '3d', label: '3D Render', description: 'Rendu 3D réaliste' },
];

const IMAGE_FORMATS = [
  { id: 'square', label: 'Carré', ratio: '1:1', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Paysage', ratio: '16:9', width: 1920, height: 1080 },
  { id: 'portrait', label: 'Portrait', ratio: '9:16', width: 1080, height: 1920 },
  { id: 'linkedin', label: 'LinkedIn Post', ratio: '1.91:1', width: 1200, height: 628 },
  { id: 'story', label: 'Story', ratio: '9:16', width: 1080, height: 1920 },
];

export function StudioView({ brandProfile }: StudioViewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generation state
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [selectedFormat, setSelectedFormat] = useState("linkedin");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Editor state
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<UploadedMedia | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Décrivez l'image que vous souhaitez générer.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate AI image generation (would integrate with DALL-E, Midjourney API, etc.)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate placeholder images (in production, these would be real AI-generated images)
      const format = IMAGE_FORMATS.find(f => f.id === selectedFormat) || IMAGE_FORMATS[0];
      const placeholderUrl = `https://placehold.co/${format.width}x${format.height}/8B5CF6/FFFFFF?text=${encodeURIComponent(prompt.slice(0, 20))}`;
      
      setGeneratedImages(prev => [placeholderUrl, ...prev]);

      toast({
        title: "Image générée ! 🎨",
        description: "Votre image est prête à être utilisée.",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast({
          title: "Format non supporté",
          description: "Veuillez uploader une image ou une vidéo.",
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      const newMedia: UploadedMedia = {
        id: crypto.randomUUID(),
        type: isVideo ? 'video' : 'image',
        url,
        name: file.name,
        file,
      };

      setUploadedMedia(prev => [...prev, newMedia]);
      setSelectedMedia(newMedia);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = (id: string) => {
    setUploadedMedia(prev => prev.filter(m => m.id !== id));
    if (selectedMedia?.id === id) {
      setSelectedMedia(null);
    }
  };

  const handleAddText = () => {
    const newText: TextOverlay = {
      id: crypto.randomUUID(),
      text: "Votre texte ici",
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#FFFFFF",
      fontFamily: "Arial",
    };
    setTextOverlays(prev => [...prev, newText]);
  };

  const handleDownload = () => {
    if (!selectedMedia) {
      toast({
        title: "Aucun média sélectionné",
        description: "Sélectionnez une image ou vidéo à télécharger.",
        variant: "destructive",
      });
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = selectedMedia.url;
    link.download = selectedMedia.name || 'media';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Téléchargement lancé",
      description: "Votre fichier est en cours de téléchargement.",
    });
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const getImageFilter = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Camera className="w-8 h-8 text-primary" />
            Studio Créatif
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez des images IA et créez des visuels pour vos posts LinkedIn
          </p>
        </div>
        <Badge variant="info" className="px-3 py-1.5">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          IA Créative
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Générer
          </TabsTrigger>
          <TabsTrigger value="edit-image" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Photo
          </TabsTrigger>
          <TabsTrigger value="edit-video" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Vidéo
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Generation Form */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  Génération d'Image IA
                </CardTitle>
                <CardDescription>
                  Décrivez l'image que vous souhaitez créer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label>Description de l'image</Label>
                  <Textarea
                    placeholder="Ex: Une photo professionnelle d'un bureau moderne avec des plantes vertes, éclairage naturel, style minimaliste..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label>Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {IMAGE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          selectedStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <p className="font-medium text-sm text-foreground">{style.label}</p>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_FORMATS.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.label} ({format.ratio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer l'image
                    </>
                  )}
                </Button>

                {/* Quick prompts */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Suggestions rapides</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Photo de bureau moderne",
                      "Équipe en réunion",
                      "Graphique professionnel",
                      "Portrait corporate",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Generated Images Gallery */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Images Générées
                </CardTitle>
                <CardDescription>
                  {generatedImages.length} image(s) créée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Vos images générées apparaîtront ici
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((url, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary" className="h-8 w-8">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => {
                              const newMedia: UploadedMedia = {
                                id: crypto.randomUUID(),
                                type: 'image',
                                url,
                                name: `generated-${index + 1}.png`,
                              };
                              setUploadedMedia(prev => [...prev, newMedia]);
                              toast({
                                title: "Image ajoutée à l'éditeur",
                                description: "Vous pouvez maintenant la modifier.",
                              });
                            }}
                          >
                            <ImagePlus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Photo Edit Tab */}
        <TabsContent value="edit-image" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Media Library */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-primary" />
                  Bibliothèque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>

                {/* Media List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {uploadedMedia.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun média importé
                    </p>
                  ) : (
                    uploadedMedia.filter(m => m.type === 'image').map((media) => (
                      <div
                        key={media.id}
                        onClick={() => setSelectedMedia(media)}
                        className={cn(
                          "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                          selectedMedia?.id === media.id
                            ? "border-primary"
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <img
                          src={media.url}
                          alt={media.name}
                          className="w-full h-20 object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(media.id);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Center: Canvas/Preview */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 h-full">
                <CardContent className="p-6 h-full flex items-center justify-center">
                  {selectedMedia && selectedMedia.type === 'image' ? (
                    <div className="relative w-full max-w-lg">
                      <img
                        src={selectedMedia.url}
                        alt={selectedMedia.name}
                        className="w-full rounded-lg shadow-lg"
                        style={{ filter: getImageFilter() }}
                      />
                      {/* Text Overlays */}
                      {textOverlays.map((overlay) => (
                        <div
                          key={overlay.id}
                          className="absolute cursor-move"
                          style={{
                            left: `${overlay.x}%`,
                            top: `${overlay.y}%`,
                            fontSize: overlay.fontSize,
                            color: overlay.color,
                            fontFamily: overlay.fontFamily,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          }}
                        >
                          {overlay.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">
                        Sélectionnez une image
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Importez ou générez une image pour commencer
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Tools */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Outils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adjustments */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ajustements</Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <SunMedium className="w-4 h-4" />
                          Luminosité
                        </span>
                        <span className="text-xs text-muted-foreground">{brightness}%</span>
                      </div>
                      <Slider
                        value={[brightness]}
                        onValueChange={([v]) => setBrightness(v)}
                        min={0}
                        max={200}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Contrast className="w-4 h-4" />
                          Contraste
                        </span>
                        <span className="text-xs text-muted-foreground">{contrast}%</span>
                      </div>
                      <Slider
                        value={[contrast]}
                        onValueChange={([v]) => setContrast(v)}
                        min={0}
                        max={200}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Saturation
                        </span>
                        <span className="text-xs text-muted-foreground">{saturation}%</span>
                      </div>
                      <Slider
                        value={[saturation]}
                        onValueChange={([v]) => setSaturation(v)}
                        min={0}
                        max={200}
                        step={1}
                      />
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={resetAdjustments}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>

                {/* Text Tool */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texte</Label>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleAddText}>
                    <Type className="w-4 h-4 mr-2" />
                    Ajouter du texte
                  </Button>
                </div>

                {/* Quick Tools */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Crop className="w-4 h-4 mr-1" />
                      Recadrer
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Pivoter
                    </Button>
                  </div>
                </div>

                {/* Export */}
                <Button className="w-full" onClick={handleDownload} disabled={!selectedMedia}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Video Edit Tab */}
        <TabsContent value="edit-video" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Video Library */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="w-4 h-4 text-primary" />
                  Vidéos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer vidéo
                </Button>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {uploadedMedia.filter(m => m.type === 'video').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune vidéo importée
                    </p>
                  ) : (
                    uploadedMedia.filter(m => m.type === 'video').map((media) => (
                      <div
                        key={media.id}
                        onClick={() => setSelectedMedia(media)}
                        className={cn(
                          "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all bg-secondary",
                          selectedMedia?.id === media.id
                            ? "border-primary"
                            : "border-transparent hover:border-primary/50"
                        )}
                      >
                        <div className="p-3 flex items-center gap-2">
                          <Video className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm truncate">{media.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(media.id);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center text-white hover:bg-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Center: Video Preview */}
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  {selectedMedia && selectedMedia.type === 'video' ? (
                    <div className="space-y-4">
                      {/* Video Player */}
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <video
                          src={selectedMedia.url}
                          className="w-full"
                          style={{ filter: getImageFilter() }}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon">
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="icon">
                          <SkipForward className="w-4 h-4" />
                        </Button>

                        {/* Timeline */}
                        <div className="flex-1">
                          <Slider
                            value={[currentTime]}
                            onValueChange={([v]) => setCurrentTime(v)}
                            max={duration || 100}
                            step={0.1}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Timeline Track */}
                      <div className="h-16 bg-secondary rounded-lg p-2">
                        <div className="h-full bg-primary/20 rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Timeline vidéo
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Video className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">
                        Sélectionnez une vidéo
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Importez une vidéo pour commencer le montage
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Video Tools */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-primary" />
                  Montage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trim */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Découpage</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Scissors className="w-4 h-4 mr-1" />
                      Couper
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-1" />
                      Dupliquer
                    </Button>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ajustements</Label>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Luminosité</span>
                        <span className="text-xs text-muted-foreground">{brightness}%</span>
                      </div>
                      <Slider
                        value={[brightness]}
                        onValueChange={([v]) => setBrightness(v)}
                        min={0}
                        max={200}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contraste</span>
                        <span className="text-xs text-muted-foreground">{contrast}%</span>
                      </div>
                      <Slider
                        value={[contrast]}
                        onValueChange={([v]) => setContrast(v)}
                        min={0}
                        max={200}
                      />
                    </div>
                  </div>
                </div>

                {/* Text Overlay */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texte</Label>
                  <Button variant="outline" size="sm" className="w-full">
                    <Type className="w-4 h-4 mr-2" />
                    Ajouter titre
                  </Button>
                </div>

                {/* Export */}
                <Button className="w-full" onClick={handleDownload} disabled={!selectedMedia}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="border-violet-100 dark:border-violet-900/50 bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-950/30 dark:to-cyan-950/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-foreground">Conseil Studio</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Les images générées par IA au format LinkedIn (1200x628) obtiennent 2x plus d'engagement. Utilisez des prompts détaillés pour de meilleurs résultats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

