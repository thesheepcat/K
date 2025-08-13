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
    } catch (err) {
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
    <div className="min-h-screen bg-white flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <KaspaLogo className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Enter your password to unlock your session</p>
        </div>

        <Card className="border border-gray-200 rounded-none">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-none">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10 rounded-none"
                    required                    
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 font-bold rounded-none"
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? 'Unlocking...' : 'Unlock Session'}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Use Different Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Forgot your password? You'll need to login with your private key again.</p>
        </div>
      </div>
    </div>
  );
};

export default UnlockSession;