import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-none">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">Security Verification</p>
              <p className="text-xs text-yellow-600 mt-1">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-none">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password Input */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
          </div>
          
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pr-12 rounded-none"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            Enter the password you used when setting up your wallet
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full rounded-none bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
            className="w-full rounded-none"
          >
            Cancel
          </Button>
        </div>

        {/* Security Note */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Your password is used to verify your identity</p>
          <p>and decrypt your private key securely.</p>
        </div>
      </form>
    </Dialog>
  );
};

export default PasswordConfirmDialog;