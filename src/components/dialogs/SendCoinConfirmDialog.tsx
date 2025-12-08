import React from 'react';
import { Button } from '@/components/ui/button';
import Dialog from '@/components/ui/dialog';

interface SendCoinConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  destinationAddress: string;
  amount?: string; // Optional - only for 'amount' operation type
  operationType: 'amount' | 'utxo';
}

const SendCoinConfirmDialog: React.FC<SendCoinConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  destinationAddress,
  amount,
  operationType,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="⚠️ Confirm Transaction">
      <div className="space-y-4">
        <p className="text-base text-foreground">
          Are you sure you want to send {operationType === 'amount' ? `${amount} KAS` : 'a single UTXO'} to the following address?
        </p>

        <div className="bg-muted border border-border rounded-md p-3">
          <p className="text-sm break-all">{destinationAddress}</p>
        </div>

        <p className="text-sm text-destructive font-medium">
          ⚠️ This action cannot be undone. Please verify the destination address carefully!
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
            Confirm Send
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default SendCoinConfirmDialog;
