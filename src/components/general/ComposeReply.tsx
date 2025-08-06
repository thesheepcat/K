import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useJdenticonAvatar } from '@/hooks/useJdenticonAvatar';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import EmojiPickerButton from '@/components/ui/emoji-picker';

interface ComposeReplyProps {
  onReply: (content: string) => void;
  onCancel: () => void;
  replyingToUser: string;
  postId: string; // The post/reply being replied to
  mentionedPubkeys: string[]; // Array of pubkeys to mention
}

const ComposeReply: React.FC<ComposeReplyProps> = ({ onReply, onCancel, replyingToUser, postId, mentionedPubkeys }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey, privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Generate avatar for the current user
  const userAvatar = useJdenticonAvatar(publicKey || '', 32);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  const handleReply = async () => {
    if (content.trim() && privateKey && !isSubmitting) {
      try {
        setIsSubmitting(true);
        
        // Send reply transaction
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'reply',
          postId: postId,
          mentionedPubkeys: mentionedPubkeys
        });

        // Show success toast with transaction details
        if (result) {
          toast.success("Reply transaction successful!", {
            description: (
              <div className="space-y-1">
                <div>Transaction ID: {result.id}</div>
                <div>Fees: {result.feeAmount.toString()} sompi</div>
                <div>Fees: {result.feeKAS} KAS</div>
              </div>
            ),
            duration: 5000,
          });
          
          // Only clear content and call parent handler after successful transaction
          onReply(content);
          setContent('');
        }
      } catch (error) {
        console.error('Error sending transaction:', error);
        toast.error("An error occurred when sending transaction", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onCancel();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isSubmitting) {
      handleReply();
    }
  };

  return (
    <Card className="border-0 border-t border-gray-200 bg-gray-50 rounded-none">
      <CardContent className="p-3">
        <div className="mb-2 text-sm text-gray-600">
          Replying to <span className="text-blue-500">@{replyingToUser}</span>
        </div>
        <div className="flex space-x-2">
          <Avatar className="h-8 w-8 rounded-none">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-gray-200 text-gray-700 rounded-none text-xs">You</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="Post your reply"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-14 border-none resize-none text-sm placeholder-gray-500 focus:outline-none rounded-none bg-transparent"
                autoFocus
              />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                Press Esc to cancel • Cmd+Enter to reply
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isSubmitting}
                  className="text-gray-600 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 px-4 py-1 text-sm rounded-none hover:rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={!content.trim() || isSubmitting}
                  className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 px-4 py-1 text-sm font-bold rounded-none hover:rounded-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400" />
                      Replying...
                    </>
                  ) : (
                    'Reply'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComposeReply;