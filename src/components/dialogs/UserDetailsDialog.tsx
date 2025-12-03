import React from 'react';
import { Copy, User, Wallet, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dialog from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userPubkey: string;
  userAddress: string;
  userNickname?: string; // Optional user nickname
  onNavigateToUserPosts?: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  isOpen,
  onClose,
  userPubkey,
  userAddress,
  userNickname,
  onNavigateToUserPosts
}) => {
  const copyToClipboard = async (text: string, label: string) => {
    // Fallback function using older API
    const fallbackCopy = (text: string): boolean => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    };

    try {
      // Try modern clipboard API first, but with a catch for failures
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          toast.success('Copied!', {
            description: `${label} copied to clipboard`,
            duration: 2000,
          });
          return;
        } catch (clipboardError) {
          // Modern API failed, fall through to fallback
          console.log('Modern clipboard API failed, using fallback:', clipboardError);
        }
      }

      // Use fallback method
      const success = fallbackCopy(text);
      if (success) {
        toast.success('Copied!', {
          description: `${label} copied to clipboard`,
          duration: 2000,
        });
      } else {
        throw new Error('Fallback copy method failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Copy failed', {
        description: 'Failed to copy to clipboard',
        duration: 2000,
      });
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="User Details">
      <div className="space-y-6">
        {/* User Nickname Section */}
        {userNickname && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <label className="block text-sm font-medium text-muted-foreground">
                Nickname
              </label>
            </div>
            <div className="bg-muted border border-border p-2 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground flex-1 mr-2">
                  {userNickname}
                </span>
                <Button
                  type="button"
                  onClick={() => copyToClipboard(userNickname!, 'User nickname')}
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Public Key Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <label className="block text-sm font-medium text-muted-foreground">
              Public Key
            </label>
          </div>
          <div className="bg-muted border border-border p-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground break-all flex-1 mr-2 font-sans">
                {userPubkey}
              </span>
              <Button
                type="button"
                onClick={() => copyToClipboard(userPubkey, 'Public key')}
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Kaspa Address Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <label className="block text-sm font-medium text-muted-foreground">
              Kaspa Address
            </label>
          </div>
          <div className="bg-muted border border-border p-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground break-all flex-1 mr-2 font-sans">
                {userAddress}
              </span>
              <Button
                type="button"
                onClick={() => copyToClipboard(userAddress, 'Kaspa address')}
                size="sm"
                variant="ghost"
                className="flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border space-y-2">
          {onNavigateToUserPosts && (
            <Button
              onClick={() => {
                onNavigateToUserPosts();
                onClose();
              }}
              className="w-full py-3 font-bold text-sm"
            >
              See user's posts
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full py-3 font-bold text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default UserDetailsDialog;