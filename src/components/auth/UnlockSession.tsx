import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Lock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import KaspaLogo from '../icons/KaspaLogo';

const UnlockSession: React.FC = () => {
  const { unlockSession, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const success = await unlockSession(password);
      
      if (!success) {
        setError('Invalid password');
      }
    } catch {
      setError('Failed to unlock session');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Use the centralized logout function which handles everything
    logout();
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Enter your password to unlock your session</p>
        </div>

        <Card className="border border-border rounded-none shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
                    className="pr-10 rounded-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    required                    
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the password you used when setting up your account
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-bold rounded-none"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Unlocking...' : 'Unlock Session'}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full py-3 font-bold rounded-none"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Use Different Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Forgot your password? You'll need to login with your private key again.</p>
        </div>
      </div>
    </div>
  );
};

export default UnlockSession;