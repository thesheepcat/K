import React from 'react';
import { Copy, User, Wallet, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Dialog from '@/components/ui/dialog';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userPubkey: string;
  userAddress: string;
  displayName: string;
  userNickname?: string; // Optional user nickname
  onNavigateToUserPosts?: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  isOpen,
  onClose,
  userPubkey,
  userAddress,
  displayName,
  userNickname,
  onNavigateToUserPosts
}) => {
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="User Details">
      <div className="space-y-6">
        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-none">
            {copyFeedback}
          </div>
        )}

        {/* User Display Name */}
        <div className="text-center border-b border-border pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Here is user's details:</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Displaying information for <span className="font-medium">{displayName}</span>
          </p>
        </div>

        {/* User Nickname Section */}
        {userNickname && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <label className="block text-sm font-medium text-foreground">
                User Nickname
              </label>
            </div>
            <div className="bg-muted border border-border p-3 rounded-none">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground flex-1 mr-2">
                  {userNickname}
                </span>
                <Button
                  type="button"
                  onClick={() => copyToClipboard(userNickname!, 'User nickname')}
                  size="sm"
                  variant="ghost"
                  className="rounded-none flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Public Key Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <label className="block text-sm font-medium text-foreground">
              Public Key
            </label>
          </div>
          <div className="bg-muted border border-border p-3 rounded-none">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-foreground break-all flex-1 mr-2">
                {userPubkey}
              </code>
              <Button
                type="button"
                onClick={() => copyToClipboard(userPubkey, 'Public key')}
                size="sm"
                variant="ghost"
                className="rounded-none flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Kaspa Address Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <label className="block text-sm font-medium text-foreground">
              Kaspa Address
            </label>
          </div>
          <div className="bg-muted border border-border p-3 rounded-none">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-foreground break-all flex-1 mr-2">
                {userAddress}
              </code>
              <Button
                type="button"
                onClick={() => copyToClipboard(userAddress, 'Kaspa address')}
                size="sm"
                variant="ghost"
                className="rounded-none flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            onClick={onClose}
            className="w-full py-3 font-bold rounded-none"
          >
            Close
          </Button>
          {onNavigateToUserPosts && (
            <Button
              onClick={() => {
                onNavigateToUserPosts();
                onClose();
              }}
              variant="outline"
              className="w-full py-3 font-bold rounded-none"
            >
              See user's posts
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default UserDetailsDialog;