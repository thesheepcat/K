import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WARNING_THRESHOLD_MS } from '@/config/auth';

const SessionTimeoutWarning: React.FC = () => {
  const { isAuthenticated, getSessionTimeRemaining, lockSession } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const checkSessionTimeout = () => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      
      // Show warning when threshold time or less remaining
      const shouldShow = remaining > 0 && remaining <= WARNING_THRESHOLD_MS;
      setShowWarning(shouldShow);
      
      // Auto lock session when it expires
      if (remaining <= 0) {
        lockSession();
      }
    };

    // Check immediately
    checkSessionTimeout();
    
    // Check every second for real-time countdown in warning
    const interval = setInterval(checkSessionTimeout, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, getSessionTimeRemaining, lockSession]);



  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed top-20 md:top-20 lg:top-4 right-4 z-[60] max-w-sm mx-4 sm:mx-0" data-session-warning>
      <Card className="border-warning bg-warning-subtle shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-warning-icon mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-warning-text mb-1">
                Session Expiring Soon
              </h4>
              <p className="text-sm text-warning-secondary mb-3">
                Your session will expire in {formatTime(timeRemaining)}. 
                You'll need to enter your password again.
              </p>
              <p className="text-xs text-warning-muted mb-3">
                Any activity will automatically extend your session.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-warning-muted hover:text-warning-hover text-xs px-3 py-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionTimeoutWarning;