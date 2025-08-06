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
  onNavigateToUserPosts?: () => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  isOpen,
  onClose,
  userPubkey,
  userAddress,
  displayName,
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
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-none">
            {copyFeedback}
          </div>
        )}

        {/* User Display Name */}
        <div className="text-center border-b border-gray-200 pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <User className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-black">Here is user's details:</h3>
          </div>
          <p className="text-sm text-gray-600">
            Displaying information for <span className="font-medium">{displayName}</span>
          </p>
        </div>

        {/* Public Key Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Public Key
            </label>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-none">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all flex-1 mr-2">
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
          <p className="text-xs text-gray-500">
            Used for post identification and verification
          </p>
        </div>

        {/* Kaspa Address Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Kaspa Address
            </label>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-none">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all flex-1 mr-2">
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
          <p className="text-xs text-gray-500">
            User's wallet address for receiving transactions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {onNavigateToUserPosts && (
            <Button
              onClick={() => {
                onNavigateToUserPosts();
                onClose();
              }}
              className="w-full rounded-none bg-gray-600 text-white hover:bg-gray-700"
            >
              See user's posts
            </Button>
          )}
          <Button
            onClick={onClose}
            className="w-full rounded-none bg-black text-white hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default UserDetailsDialog;