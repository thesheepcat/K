import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Dialog from '@/components/ui/dialog';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError(null);
    
    try {
      const success = await onConfirm(password);
      if (success) {
        // Reset form and close dialog
        setPassword('');
        setShowPassword(false);
        setError(null);
        onClose();
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setPassword('');
    setShowPassword(false);
    setError(null);
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
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-warning mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-warning font-medium">Security Verification</p>
              <p className="text-xs text-warning/80 mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-none">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-destructive mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <label className="block text-sm font-medium text-foreground">
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
          
          <p className="text-xs text-muted-foreground">
            Enter the password you used when setting up your wallet
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-3 font-bold rounded-none"
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
            className="w-full py-3 font-bold rounded-none"
          >
            Cancel
          </Button>
        </div>

        {/* Security Note */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Your password is used to verify your identity</p>
          <p>and decrypt your private key securely.</p>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordConfirmDialog;