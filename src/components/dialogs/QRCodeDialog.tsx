import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Dialog from '@/components/ui/dialog';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  qrCodeDataURL: string;
  onCopyAddress: () => void;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = ({
  isOpen,
  onClose,
  address,
  qrCodeDataURL,
  onCopyAddress,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Your Kaspa Address"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* QR Code Image */}
        {qrCodeDataURL && (
          <div className="bg-white p-4 rounded-lg">
            <img
              src={qrCodeDataURL}
              alt="QR Code"
              className="w-full h-full"
            />
          </div>
        )}

        {/* Address Text */}
        <div className="w-full space-y-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Your address
          </label>
          <div className="relative">
            <Input
              value={address || 'Not available'}
              readOnly
              className="pr-10 text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
              <button
                type="button"
                onClick={onCopyAddress}
                disabled={!address}
                className="p-1 text-muted-foreground/60 hover:text-muted-foreground disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-sm text-destructive font-medium">⚠️ Warning: Send only small amounts of KAS (1-5 KAS max)!</p>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
};

export default QRCodeDialog;
