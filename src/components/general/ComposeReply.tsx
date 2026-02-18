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

interface ComposeReplyProps {
  onReply: (content: string) => void;
  onCancel: () => void;
  replyingToUser: string;
  postId: string; // The post/reply being replied to
  mentionedPubkeys: string[]; // Array of pubkeys to mention
}

const ComposeReply: React.FC<ComposeReplyProps> = ({ onReply, onCancel, postId, mentionedPubkeys }) => {
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

  const handleReply = async () => {
    if (content.trim() && privateKey && !isSubmitting) {
      try {
        setIsSubmitting(true);
        
        // Combine original mentioned pubkeys with newly detected mentions
        const allMentionedPubkeys = [
          ...mentionedPubkeys,
          ...validatedMentions.map(m => m.pubkey)
        ];
        
        // Remove duplicates
        const uniqueMentionedPubkeys = [...new Set(allMentionedPubkeys)];
        
        // Send reply transaction
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'reply',
          postId: postId,
          mentionedPubkeys: uniqueMentionedPubkeys
        });

        // Show success toast with transaction details
        if (result) {
          if (showSuccessNotifications) {
            toast.success("Reply transaction successful!", {
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
    <Card className="border-0 border-t border-border bg-compose">
      <CardContent className="p-3">
        <div className="flex space-x-2">
          {/* Removing avatar
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">You</AvatarFallback>
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
                className="flex-1 min-h-14 resize-none text-base bg-transparent border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
            </div>
            <ComposeMediaPreview items={mediaItems} onDismiss={dismissMediaItem} />
            <div className="flex justify-end items-center mt-2">
              <div className="flex space-x-2">
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:bg-muted disabled:bg-muted disabled:text-muted-foreground px-4 py-1 text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={!content.trim() || isSubmitting}
                  className="px-4 py-1 text-base font-bold"
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle-white mr-2"></div>
                  )}
                  {isSubmitting ? 'Replying...' : 'Reply'}
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