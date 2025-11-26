import React from 'react';
import { Button } from '@/components/ui/button';
import Dialog from '@/components/ui/dialog';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Use Different Account">
      <div className="space-y-4">
        {/* Warning Message */}
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-none">
          <div className="flex items-start space-x-2">
            <div>
              <p className="text-base text-destructive font-medium">⚠️ Warning: You are logging out!</p>
              <p className="text-base text-warning/80 mt-1">
                Are you sure you want to logout? You will need to enter your private key again to access your account.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border space-y-2 sm:space-y-0 sm:flex sm:justify-end sm:space-x-2">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="text-base w-full sm:w-auto py-3 font-bold rounded-none order-2 sm:order-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            className="text-base w-full sm:w-auto py-3 font-bold rounded-none order-1 sm:order-2"
          >
            Yes, Use Different Account
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default LogoutConfirmDialog;
