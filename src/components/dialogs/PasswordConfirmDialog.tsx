import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Dialog from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<boolean>;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

const PasswordConfirmDialog: React.FC<PasswordConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "⚠️ Warning: You are revealing your private key!",
  isLoading = false
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Password required', {
        description: 'Please enter your password',
        duration: 2000,
      });
      return;
    }

    try {
      const success = await onConfirm(password);
      if (success) {
        // Reset form and close dialog
        setPassword('');
        setShowPassword(false);
        onClose();
      } else {
        toast.error('Invalid password', {
          description: 'Please try again',
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error('Authentication failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 2000,
      });
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <label className="block text-base font-medium text-muted-foreground">
              Password
            </label>
          </div>

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.scrollBy(0, -100);
                }, 300);
              }}
              placeholder="Enter your password"
              className="pr-12 border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-x-2 sm:gap-0">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            variant="outline"
            className="text-base w-full sm:w-auto py-3 font-bold order-2 sm:order-1"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="text-base w-full sm:w-auto py-3 font-bold order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-2" style={{borderColor: 'white'}}></div>
                Verifying...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordConfirmDialog;