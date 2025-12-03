import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import KaspaLogo from '../icons/KaspaLogo';
import LogoutConfirmDialog from '@/components/dialogs/LogoutConfirmDialog';
import { toast } from 'sonner';

const UnlockSession: React.FC = () => {
  const { unlockSession, logout } = useAuth();
  const { theme } = useUserSettings();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const success = await unlockSession(password);

      if (!success) {
        toast.error('Unlock failed', {
          description: 'Invalid password. Please try again.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Unlock error:', error);
      toast.error('Unlock failed', {
        description: 'Invalid password. Please try again.',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    // Use the centralized logout function which handles everything
    logout();
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" isDarkTheme={theme === 'dark'} />
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        </div>

        <Card className="border border-border shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="password" className="block text-base font-medium text-foreground">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="text-base pr-10 border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="text-base w-full py-3 font-bold"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Unlocking...' : 'Unlock Session'}
                </Button>
                <Button
                  type="button"
                  onClick={handleLogoutClick}
                  variant="outline"
                  className="text-base w-full py-3 font-bold"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Use Different Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default UnlockSession;