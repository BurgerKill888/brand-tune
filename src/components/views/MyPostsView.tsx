import { useState, useMemo } from 'react';
import { Post } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  FileText,
  Calendar,
  CheckCircle2,
  Heart,
  MoreVertical,
  ImagePlus,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { PostDetailDialog } from '@/components/posts/PostDetailDialog';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useLinkedIn } from '@/hooks/useLinkedIn';
import { useToast } from '@/hooks/use-toast';

interface MyPostsViewProps {
  posts: Post[];
  onCreatePost: () => void;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onUpdatePost: (postId: string, updates: Partial<Post>) => void;
  onToggleFavorite?: (postId: string) => void;
  favorites?: string[];
  brandProfileId?: string;
  authorName?: string;
  authorTitle?: string;
}

type FilterTab = 'all' | 'draft' | 'scheduled' | 'published' | 'favorites';

const POST_TYPES = [
  { value: 'educational', label: 'Instructif', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'storytelling', label: 'Storytelling', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'promotional', label: 'Promotionnel', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'engagement', label: 'Engagement', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'news', label: 'Actualité', color: 'bg-red-100 text-red-700 border-red-200' },
];

const POST_STATUSES = [
  { value: 'draft', label: 'Brouillon', icon: FileText, color: 'text-muted-foreground' },
  { value: 'ready', label: 'Planifié', icon: Calendar, color: 'text-blue-600' },
  { value: 'published', label: 'Publié', icon: CheckCircle2, color: 'text-green-600' },
];

export function MyPostsView({
  posts,
  onCreatePost,
  onEditPost,
  onDeletePost,
  onUpdatePost,
  onToggleFavorite,
  favorites = [],
  brandProfileId,
  authorName = 'Utilisateur',
  authorTitle = 'Expert LinkedIn',
}: MyPostsViewProps) {
  const { toast } = useToast();
  const { schedulePost } = useScheduledPosts(brandProfileId);
  const { publishPost, isConnected } = useLinkedIn();
  
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter posts based on active tab and search query
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    switch (activeTab) {
      case 'draft':
        result = result.filter((p) => p.status === 'draft');
        break;
      case 'scheduled':
        result = result.filter((p) => p.status === 'ready');
        break;
      case 'published':
        result = result.filter((p) => p.status === 'published');
        break;
      case 'favorites':
        result = result.filter((p) => favorites.includes(p.id));
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(query) ||
          p.keywords.some((k) => k.toLowerCase().includes(query)) ||
          p.hashtags.some((h) => h.toLowerCase().includes(query))
      );
    }

    return result;
  }, [posts, activeTab, searchQuery, favorites]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(paginatedPosts.map((p) => p.id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts([...selectedPosts, postId]);
    } else {
      setSelectedPosts(selectedPosts.filter((id) => id !== postId));
    }
  };

  const handleRowClick = (post: Post) => {
    setSelectedPost(post);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (postId: string, newStatus: Post['status']) => {
    onUpdatePost(postId, { status: newStatus });
  };

  const handleTypeChange = (postId: string, newType: string) => {
    onUpdatePost(postId, { tone: newType });
  };

  const handleSchedule = async (postId: string, scheduledAt: Date, updatedContent?: string) => {
    setIsScheduling(true);
    try {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const success = await schedulePost(post.content, scheduledAt, postId);
        if (success) {
          onUpdatePost(postId, { status: 'ready' });
          setIsDetailOpen(false);
        }
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePublishNow = async (postId: string) => {
    if (!isConnected) {
      toast({
        title: "LinkedIn non connecté",
        description: "Connectez votre compte LinkedIn dans les paramètres.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const success = await publishPost(post.content);
        if (success) {
          onUpdatePost(postId, { status: 'published' });
          setIsDetailOpen(false);
          toast({
            title: "Post publié ! 🎉",
            description: "Votre post a été publié sur LinkedIn.",
          });
        }
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = (status: Post['status']) => {
    const statusConfig = POST_STATUSES.find((s) => s.value === status) || POST_STATUSES[0];
    const Icon = statusConfig.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPostType = (tone: string) => {
    const type = POST_TYPES.find((t) => t.value === tone) || POST_TYPES[0];
    return (
      <Badge variant="outline" className={type.color}>
        {type.label}
      </Badge>
    );
  };

  const truncateContent = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const tabCounts = useMemo(() => ({
    all: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'ready').length,
    published: posts.filter((p) => p.status === 'published').length,
    favorites: posts.filter((p) => favorites.includes(p.id)).length,
  }), [posts, favorites]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes posts</h1>
        <p className="text-muted-foreground">Prépare tes posts pour les publier.</p>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); setCurrentPage(1); }}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              Tous
              <span className="text-xs text-muted-foreground">({tabCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-2">
              <FileText className="w-4 h-4" />
              Brouillons
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Calendar className="w-4 h-4" />
              Planifiés
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Publiés
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              Favoris
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Chercher un post..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={onCreatePost} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer un post
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPosts.length === paginatedPosts.length && paginatedPosts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[300px]">POST</TableHead>
              <TableHead>STATUT</TableHead>
              <TableHead>PUBLICATION</TableHead>
              <TableHead>MÉDIA</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="w-8 h-8" />
                    <p>Aucun post trouvé</p>
                    <Button variant="outline" size="sm" onClick={onCreatePost}>
                      Créer votre premier post
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPosts.map((post) => (
                <TableRow 
                  key={post.id} 
                  className="group cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(post)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPosts.includes(post.id)}
                      onCheckedChange={(checked) => handleSelectPost(post.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground line-clamp-1">
                        {truncateContent(post.content)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(post.createdAt, 'dd/MM/yyyy', { locale: fr })} | {post.length === 'short' ? 'Court' : post.length === 'long' ? 'Long' : 'Standard'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 h-auto p-0 hover:bg-transparent">
                          {getStatusBadge(post.status)}
                          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {POST_STATUSES.map((status) => (
                          <DropdownMenuItem
                            key={status.value}
                            onClick={() => handleStatusChange(post.id, status.value as Post['status'])}
                            className={post.status === status.value ? 'bg-muted' : ''}
                          >
                            <status.icon className={`w-4 h-4 mr-2 ${status.color}`} />
                            {status.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">–</span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="gap-1 text-xs">
                      <ImagePlus className="w-3 h-3" />
                      Ajouter
                    </Button>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1 h-auto p-0 hover:bg-transparent">
                          {getPostType(post.tone)}
                          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Changer le type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {POST_TYPES.map((type) => (
                          <DropdownMenuItem
                            key={type.value}
                            onClick={() => handleTypeChange(post.id, type.value)}
                            className={post.tone === type.value ? 'bg-muted' : ''}
                          >
                            <Badge variant="outline" className={`${type.color} mr-2`}>
                              {type.label}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onToggleFavorite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onToggleFavorite(post.id)}
                        >
                          <Heart
                            className={`w-4 h-4 ${favorites.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditPost(post)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRowClick(post)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Aperçu & Planifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredPosts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Posts {(currentPage - 1) * postsPerPage + 1} à{' '}
              {Math.min(currentPage * postsPerPage, filteredPosts.length)} sur un total de{' '}
              {filteredPosts.length}
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(postsPerPage)}
                onValueChange={(v) => { setPostsPerPage(Number(v)); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 posts</SelectItem>
                  <SelectItem value="10">10 posts</SelectItem>
                  <SelectItem value="25">25 posts</SelectItem>
                  <SelectItem value="50">50 posts</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onSchedule={handleSchedule}
        onPublishNow={(postId, updatedContent) => handlePublishNow(postId)}
        onUpdatePost={onUpdatePost}
        authorName={authorName}
        authorTitle={authorTitle}
        isScheduling={isScheduling}
        isPublishing={isPublishing}
      />
    </div>
  );
}
