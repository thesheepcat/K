import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import EmojiPickerButton from '@/components/ui/emoji-picker';
import { detectMentionsInText, validateAndReturnPublicKey } from '@/utils/kaspaAddressUtils';
import { getExplorerTransactionUrl } from '@/utils/explorerUtils';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useComposeMediaPreview } from '@/hooks/useComposeMediaPreview';
import ComposeMediaPreview from '@/components/general/ComposeMediaPreview';

interface ComposeBoxProps {
  onPost: (content: string) => void;
}

const ComposeBox: React.FC<ComposeBoxProps> = ({ onPost }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedMentions, setValidatedMentions] = useState<Array<{pubkey: string}>>([]);
  const { privateKey } = useAuth();
  const { sendTransaction, networkId } = useKaspaTransactions();
  const { selectedNetwork, showSuccessNotifications } = useUserSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { items: mediaItems, dismissItem: dismissMediaItem } = useComposeMediaPreview(content);

  // Validate mentions whenever content changes
  useEffect(() => {
    const validateMentions = async () => {
      const mentions = detectMentionsInText(content);
      const validated: Array<{pubkey: string}> = [];
      
      for (const mention of mentions) {
        const validPubkey = await validateAndReturnPublicKey(mention.pubkey);
        if (validPubkey) {
          validated.push({ pubkey: validPubkey });
        }
      }
      
      setValidatedMentions(validated);
    };
    
    if (content.includes('@')) {
      validateMentions();
    } else {
      setValidatedMentions([]);
    }
  }, [content, networkId]);

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
        
        // Send post transaction with mentioned public keys
        const mentionedPubkeys = validatedMentions.map(m => m.pubkey);
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'post',
          mentionedPubkeys: mentionedPubkeys
        });

        // Show success toast with transaction details
        if (result) {
          if (showSuccessNotifications) {
            toast.success("Post transaction successful!", {
              description: (
                <div className="space-y-2">
                  <div>Transaction ID: {result.id}</div>
                  <div>Fees: {result.feeAmount.toString()} sompi</div>
                  <div>Fees: {result.feeKAS} KAS</div>
                  <button
                    onClick={() => window.open(getExplorerTransactionUrl(result.id, selectedNetwork), '_blank')}
                    className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                  >
                    Open explorer
                  </button>
                </div>
              ),
              duration: 5000
            });
          }

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
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs sm:text-sm">You</AvatarFallback>
          </Avatar>
          */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 min-h-10 sm:min-h-12 resize-none text-base border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                />
              </div>
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <ComposeMediaPreview items={mediaItems} onDismiss={dismissMediaItem} />
            <div className="flex justify-between items-center mt-2">
              <div className="flex space-x-2">
              </div>
              <Button
                onClick={handlePost}
                disabled={!content.trim() || isSubmitting}
                className="px-4 sm:px-6 py-2 font-bold text-sm sm:text-base"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-transparent rounded-full animate-loader-circle-white mr-2"></div>
                )}
                {isSubmitting ? (
                  <>
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