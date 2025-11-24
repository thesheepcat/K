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
  title = "Confirm Password",
  message = "Please enter your password to continue",
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
        {/* Warning Message */}
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-none">
          <div className="flex items-start space-x-2">
            <div>
              <p className="text-base text-destructive font-medium">⚠️ Security Verification</p>
              <p className="text-base text-warning/80 mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>

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
              placeholder="Enter your password"
              className="pr-12 rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
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
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="text-base w-full py-3 font-bold rounded-none"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle mr-2" style={{borderColor: 'white'}}></div>
                Verifying...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Confirm
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            variant="outline"
            className="text-base w-full py-3 font-bold rounded-none"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordConfirmDialog;