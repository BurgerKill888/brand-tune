import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LinkedInPreview } from './LinkedInPreview';
import {
  Calendar as CalendarIcon,
  Send,
  Pencil,
  Image,
  Link2,
  Linkedin,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (postId: string, scheduledAt: Date, updatedContent: string) => void;
  onPublishNow: (postId: string, updatedContent: string) => void;
  onUpdatePost: (postId: string, updates: Partial<Post>) => void;
  authorName: string;
  authorTitle?: string;
  isScheduling?: boolean;
  isPublishing?: boolean;
}

export function PostDetailDialog({
  post,
  open,
  onOpenChange,
  onSchedule,
  onPublishNow,
  onUpdatePost,
  authorName,
  authorTitle,
  isScheduling = false,
  isPublishing = false,
}: PostDetailDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHour, setSelectedHour] = useState('13');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Sync content when post changes
  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
    }
  }, [post]);

  if (!post) return null;

  const handleSchedule = () => {
    if (!selectedDate) return;
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    
    // Save content changes before scheduling
    if (editedContent !== post.content) {
      onUpdatePost(post.id, { content: editedContent });
    }
    
    onSchedule(post.id, scheduledAt, editedContent);
  };

  const handlePublishNow = () => {
    // Save content changes before publishing
    if (editedContent !== post.content) {
      onUpdatePost(post.id, { content: editedContent });
    }
    onPublishNow(post.id, editedContent);
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
  };

  const handleSaveContent = () => {
    onUpdatePost(post.id, { content: editedContent });
    setIsEditing(false);
  };

  const scheduledDateTime = selectedDate
    ? (() => {
        const dt = new Date(selectedDate);
        dt.setHours(parseInt(selectedHour), parseInt(selectedMinute));
        return dt;
      })()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-lg">
            Planifier un post
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-[600px]">
          {/* Left Panel - LinkedIn Preview with Edit */}
          <div className="flex-1 border-r bg-muted/20 flex flex-col overflow-hidden">
            {/* Platform Badge */}
            <div className="flex items-center gap-2 p-4 border-b bg-background">
              <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </Badge>
              <Button
                variant={isEditing ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="ml-auto gap-1"
              >
                <Pencil className="w-3 h-3" />
                {isEditing ? 'Aperçu' : 'Modifier'}
              </Button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="min-h-[400px] text-sm leading-relaxed resize-none"
                    placeholder="Rédigez votre post..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {editedContent.length} caractères
                    </p>
                    <Button size="sm" onClick={handleSaveContent}>
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              ) : (
                <LinkedInPreview
                  content={editedContent}
                  authorName={authorName}
                  authorTitle={authorTitle}
                />
              )}
            </ScrollArea>

            {/* Action bar under preview */}
            <div className="flex items-center justify-center gap-2 p-4 border-t bg-background">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <Image className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <Link2 className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                className="rounded-full h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Scheduling */}
          <div className="w-[320px] p-6 flex flex-col bg-background">
            {/* Status indicator */}
            <div className="mb-6">
              <Badge variant="outline" className="gap-1.5 bg-amber-50 text-amber-700 border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                À planifier
              </Badge>
              {scheduledDateTime && (
                <p className="text-sm text-muted-foreground mt-3">
                  Planifier ce post le
                  <br />
                  <span className="font-semibold text-foreground text-base">
                    {format(scheduledDateTime, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </p>
              )}
            </div>

            {/* Calendar */}
            <div className="mb-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={fr}
                className={cn(
                  "rounded-lg border shadow-sm pointer-events-auto",
                  "w-full"
                )}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-full",
                    "[&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md mx-auto flex items-center justify-center"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>

            {/* Time Picker */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Heure <span className="text-xs opacity-70">Europe/Paris</span>
              </p>
              <div className="flex items-center gap-2">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i).padStart(2, '0')}>
                        {String(i).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground font-medium">:</span>
                <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <Button
                className="w-full gap-2 h-11"
                onClick={handleSchedule}
                disabled={!selectedDate || isScheduling}
              >
                <CalendarIcon className="w-4 h-4" />
                {isScheduling ? 'Planification...' : 'Planifier le post'}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 h-11"
                onClick={handlePublishNow}
                disabled={isPublishing}
              >
                <Send className="w-4 h-4" />
                {isPublishing ? 'Publication...' : 'Publier maintenant'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
