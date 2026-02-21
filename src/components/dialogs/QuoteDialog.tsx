import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Dialog from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
// import EmojiPickerButton from '@/components/ui/emoji-picker';
import { fetchPostDetails, convertServerPostToClientPost } from '@/services/postsApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toSvg } from 'jdenticon';
import { LinkifiedText } from '@/utils/linkUtils';
import { countImageUrls } from '@/utils/mediaDetection';
import { countYouTubeUrls } from '@/utils/youtubeDetection';
import { countVideoFileUrls } from '@/utils/videoDetection';
import { countGifUrls } from '@/utils/gifDetection';
import { type Post } from '@/models/types';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { getExplorerTransactionUrl } from '@/utils/explorerUtils';

interface QuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  quotedAuthorPubkey: string;
}

const QuoteDialog: React.FC<QuoteDialogProps> = React.memo(({
  isOpen,
  onClose,
  postId,
  quotedAuthorPubkey
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const { privateKey, publicKey } = useAuth();
  const { sendTransaction, networkId } = useKaspaTransactions();
  const { apiBaseUrl, selectedNetwork, showSuccessNotifications } = useUserSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load the post details when dialog opens
  useEffect(() => {
    const loadPostDetails = async () => {
      if (!isOpen || !postId || !publicKey) return;

      setIsLoadingPost(true);
      try {
        const response = await fetchPostDetails(postId, publicKey, apiBaseUrl);
        const convertedPost = await convertServerPostToClientPost(response.post, publicKey, networkId);
        setQuotedPost(convertedPost);
      } catch (error) {
        console.error('Error loading post details:', error);
        toast.error('Failed to load post details');
      } finally {
        setIsLoadingPost(false);
      }
    };

    if (isOpen) {
      loadPostDetails();
    }
  }, [isOpen, postId, publicKey, apiBaseUrl, networkId]);

  // Emoji picker functionality (currently hidden, kept for future use)
  // const handleEmojiSelect = (emoji: string) => {
  //   const textarea = textareaRef.current;
  //   if (textarea) {
  //     const start = textarea.selectionStart;
  //     const end = textarea.selectionEnd;
  //     const newContent = content.substring(0, start) + emoji + content.substring(end);
  //     setContent(newContent);

  //     // Set cursor position after the emoji
  //     setTimeout(() => {
  //       textarea.focus();
  //       textarea.setSelectionRange(start + emoji.length, start + emoji.length);
  //     }, 0);
  //   } else {
  //     setContent(content + emoji);
  //   }
  // };

  const handlePost = async () => {
    if (content.trim() && privateKey && !isSubmitting) {
      try {
        setIsSubmitting(true);

        // Send quote transaction
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: content,
          type: 'quote' as any, // Cast as any since it's not in the official types yet
          postId: postId,
          mentionedPubkey: quotedAuthorPubkey
        } as any);

        // Show success toast with transaction details
        if (result) {
          if (showSuccessNotifications) {
            toast.success('Quote transaction successful!', {
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

          // Clear content and close dialog after successful transaction
          setContent('');
          onClose();
        }
      } catch (error) {
        console.error('Error submitting quote:', error);
        toast.error('An error occurred when sending transaction', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Generate avatar for quoted post - using useMemo to avoid re-rendering issues
  const displayAvatar = useMemo(() => {
    if (quotedPost?.author.avatar) {
      return quotedPost.author.avatar;
    }

    if (!quotedPost) {
      return '';
    }

    const identifier = quotedPost.author.pubkey || quotedPost.author.username;
    const svgString = toSvg(identifier, 32);
    const encodedSvg = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
  }, [quotedPost]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Quote Post">
      <div className="space-y-4">
        {/* Compose area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Add your comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 min-h-20 resize-none text-sm sm:text-base border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              />
            </div>
            {/*<EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />*/}
          </div>
        </div>

        {/* Quoted post visualization */}
        {isLoadingPost && (
          <div className="border border-border p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Loading post...</div>
          </div>
        )}

        {quotedPost && !isLoadingPost && (
          <div className="border border-border p-3 bg-muted rounded-md">
            <div className="flex space-x-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {quotedPost.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-foreground text-sm truncate">
                    {quotedPost.author.name}
                  </span>                  
                </div>
                <div className="mt-1 text-foreground text-sm break-words whitespace-pre-wrap">
                  <LinkifiedText onMentionClick={() => {}} maxImages={1} maxVideos={1}>{quotedPost.content}</LinkifiedText>
                </div>
                {(countImageUrls(quotedPost.content) > 1 || countYouTubeUrls(quotedPost.content) + countVideoFileUrls(quotedPost.content) + countGifUrls(quotedPost.content) > 1) && (
                  <div className="mt-2 p-1.5 bg-muted border-l-4 border-primary rounded-r">
                    <p className="text-xs text-muted-foreground">
                      Post contains more media...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post button */}
        <div className="flex justify-end">
          <Button
            onClick={handlePost}
            disabled={!content.trim() || isSubmitting || !privateKey}
            className="px-6 py-2 font-bold"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle-white mr-2"></div>
            )}
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});

QuoteDialog.displayName = 'QuoteDialog';

export default QuoteDialog;
