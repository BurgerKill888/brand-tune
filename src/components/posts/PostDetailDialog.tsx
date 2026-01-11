import { useState } from 'react';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
  ChevronLeft,
  ChevronRight,
  Linkedin,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (postId: string, scheduledAt: Date) => void;
  onPublishNow: (postId: string) => void;
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
  authorName,
  authorTitle,
  isScheduling = false,
  isPublishing = false,
}: PostDetailDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHour, setSelectedHour] = useState('13');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (!post) return null;

  const handleSchedule = () => {
    if (!selectedDate) return;
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
    onSchedule(post.id, scheduledAt);
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
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            Planifier un post
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - LinkedIn Preview */}
          <div className="flex-1 border-r bg-muted/30 p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="gap-1.5">
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <LinkedInPreview
                content={post.content}
                authorName={authorName}
                authorTitle={authorTitle}
              />

              {/* Action bar under preview */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Pencil className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Image className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border" />
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Link2 className="w-4 h-4" />
                </Button>
                <Button size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Scheduling */}
          <div className="w-[340px] p-6 flex flex-col">
            {/* Status indicator */}
            <div className="mb-4">
              <Badge variant="outline" className="gap-1.5 bg-amber-50 text-amber-700 border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                À planifier
              </Badge>
              {scheduledDateTime && (
                <p className="text-sm text-muted-foreground mt-2">
                  Planifier ce post le
                  <br />
                  <span className="font-medium text-foreground">
                    {format(scheduledDateTime, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </p>
              )}
            </div>

            {/* Calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={fr}
                className="rounded-md border p-0"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>

            {/* Time Picker */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                Heure <span className="text-xs">Europe/Paris</span>
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
                <span className="text-muted-foreground">:</span>
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
                className="w-full gap-2"
                onClick={handleSchedule}
                disabled={!selectedDate || isScheduling}
              >
                <CalendarIcon className="w-4 h-4" />
                {isScheduling ? 'Planification...' : 'Planifier le post'}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => onPublishNow(post.id)}
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
