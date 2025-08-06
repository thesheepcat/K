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

interface IntroduceComposeBoxProps {
  onPost: (content: string) => void;
}

const MAX_CHARACTERS = 100;

const IntroduceComposeBox: React.FC<IntroduceComposeBoxProps> = ({ onPost }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey, privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Generate avatar for the current user
  const userAvatar = useJdenticonAvatar(publicKey || '', 40);

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
    if (content.trim() && privateKey && !isSubmitting && content.length <= MAX_CHARACTERS) {
      try {
        setIsSubmitting(true);
        
        // Send post transaction
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'broadcast'
        });

        // Show success toast with transaction details
        if (result) {
          toast.success("Introduction posted successfully!", {
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
        console.error('Error submitting introduction:', error);
        toast.error("An error occurred when sending transaction", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const charactersRemaining = MAX_CHARACTERS - content.length;
  const isOverLimit = charactersRemaining < 0;

  return (
    <Card className="border-l-0 border-r-0 border-t-0 border-b border-gray-200 bg-white rounded-none">
      <CardContent className="p-3 sm:p-4">
        <div className="flex space-x-2 sm:space-x-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-none flex-shrink-0">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-gray-200 text-gray-700 rounded-none text-xs sm:text-sm">You</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-2">
              <Textarea
                ref={textareaRef}
                placeholder="Introduce yourself to everyone (max 100 characters)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-10 sm:min-h-12 border-none resize-none text-sm sm:text-base placeholder-gray-500 focus:outline-none rounded-none"
                maxLength={MAX_CHARACTERS + 10} // Allow slight overflow for better UX
              />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${isOverLimit ? 'text-red-500' : charactersRemaining <= 20 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {charactersRemaining} characters remaining
                </span>
                {isOverLimit && (
                  <span className="text-xs text-red-500">Character limit exceeded</span>
                )}
              </div>
              <Button
                onClick={handlePost}
                disabled={!content.trim() || isSubmitting || isOverLimit}
                className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 px-4 sm:px-6 py-2 font-bold rounded-none hover:rounded-none text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin text-gray-400" />
                    <span className="hidden sm:inline">Posting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  'Introduce'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntroduceComposeBox;