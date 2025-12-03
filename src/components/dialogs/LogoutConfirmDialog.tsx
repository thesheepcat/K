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
    <Dialog isOpen={isOpen} onClose={onClose} title="⚠️ Warning: You are logging out!">
      <div className="space-y-4">
        <p className="text-base text-foreground">
          Are you sure you want to logout? You will need to enter your private key again to access your account.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 space-y-2 sm:space-y-0 sm:flex sm:justify-end sm:space-x-2">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="text-base w-full sm:w-auto py-3 font-bold order-2 sm:order-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            className="text-base w-full sm:w-auto py-3 font-bold order-1 sm:order-2"
          >
            Yes, Use Different Account
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default LogoutConfirmDialog;
