import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Repeat2, Send, Globe, MoreHorizontal } from "lucide-react";

interface LinkedInPreviewProps {
  content: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
}

export function LinkedInPreview({ 
  content, 
  authorName, 
  authorTitle = "Fondateur & CEO",
  authorImage 
}: LinkedInPreviewProps) {
  const formattedContent = content.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < content.split('\n').length - 1 && <br />}
    </span>
  ));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-[550px] mx-auto">
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={authorImage} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {authorName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {authorName}
              </p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5 line-clamp-1">
                {authorTitle}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                Maintenant · <Globe className="w-3 h-3" />
              </p>
            </div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
          {formattedContent}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="px-3 py-1.5 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" />
            </span>
            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px]">
              ❤️
            </span>
          </div>
          <span className="ml-1">42</span>
        </div>
        <div className="flex gap-2">
          <span>8 commentaires</span>
          <span>·</span>
          <span>3 republications</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex justify-between">
        {[
          { icon: ThumbsUp, label: "J'aime" },
          { icon: MessageCircle, label: "Commenter" },
          { icon: Repeat2, label: "Republier" },
          { icon: Send, label: "Envoyer" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
