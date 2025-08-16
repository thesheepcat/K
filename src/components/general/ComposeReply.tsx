import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
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
  const { privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <Card className="border-0 border-t border-border bg-compose rounded-none">
      <CardContent className="p-3">
        <div className="mb-2 text-sm text-muted-foreground">
          Replying to <span className="text-info">@{replyingToUser}</span>
        </div>
        <div className="flex space-x-2">
          {/* Removing avatar
          <Avatar className="h-8 w-8 rounded-none">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground rounded-none text-xs">You</AvatarFallback>
          </Avatar>
          */}
          <div className="flex-1">
            <div className="flex items-start space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="Post your reply"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-14 resize-none text-sm rounded-none bg-transparent border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-muted-foreground">
                Press Esc to cancel • Cmd+Enter to reply
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:bg-muted disabled:bg-muted disabled:text-muted-foreground px-4 py-1 text-sm rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={!content.trim() || isSubmitting}
                  className="px-4 py-1 text-sm font-bold rounded-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-2" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
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