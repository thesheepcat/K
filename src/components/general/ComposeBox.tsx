import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import EmojiPickerButton from '@/components/ui/emoji-picker';

interface ComposeBoxProps {
  onPost: (content: string) => void;
}

const ComposeBox: React.FC<ComposeBoxProps> = ({ onPost }) => {
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

  const handlePost = async () => {
    if (content.trim() && privateKey && !isSubmitting) {
      try {
        setIsSubmitting(true);
        
        // Send post transaction
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'post',
          mentionedPubkeys: [] // Empty array for posts as specified
        });

        // Show success toast with transaction details
        if (result) {
          toast.success("Post transaction successful!", {
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
          onPost(content);
          setContent('');
        }
      } catch (error) {
        console.error('Error submitting post:', error);
        toast.error("An error occurred when sending transaction", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Card className="border-l-0 border-r-0 border-t-0 border-b border-border bg-card rounded-none">
      <CardContent className="p-3 sm:p-4">
        <div className="flex space-x-2 sm:space-x-3">
          {/* Removing avatar
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-none flex-shrink-0">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground rounded-none text-xs sm:text-sm">You</AvatarFallback>
          </Avatar>
          */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-10 sm:min-h-12 resize-none text-sm sm:text-base rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-2">
              </div>
              <Button
                onClick={handlePost}
                disabled={!content.trim() || isSubmitting}
                className="px-4 sm:px-6 py-2 font-bold rounded-lg hover:rounded-lg text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-transparent rounded-full animate-loader-circle mr-2" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                    <span className="hidden sm:inline">Posting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComposeBox;