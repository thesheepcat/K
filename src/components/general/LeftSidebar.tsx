import { User, Settings, MessageSquare, MessageSquareReply, ScanEye, Users, LogOut, AtSign, Bell, UserRoundPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import notificationService from '@/services/notificationService';
import KaspaLogo from '../icons/KaspaLogo';
import LogoutConfirmDialog from '@/components/dialogs/LogoutConfirmDialog';
import { useState, useEffect } from 'react';

interface LeftSidebarProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isCollapsed = false, isMobile = false, onMobileMenuClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, publicKey } = useAuth();
  const { theme, apiBaseUrl } = useUserSettings();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Subscribe to notification count changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotificationCount);
    return unsubscribe;
  }, []);

  // Update notification service with current API base URL and start/stop polling
  useEffect(() => {
    notificationService.setApiBaseUrl(apiBaseUrl);

    if (isAuthenticated && publicKey) {
      notificationService.startPolling(publicKey, apiBaseUrl);
    } else {
      notificationService.stopPolling();
    }
  }, [isAuthenticated, publicKey, apiBaseUrl]);

  const menuItems = [
    { icon: ScanEye, label: 'Watching', path: '/' },
    { icon: UserRoundPlus, label: 'Following', path: '/following' },
    { icon: MessageSquare, label: 'My posts', path: '/my-posts' },
    { icon: MessageSquareReply, label: 'My replies', path: '/my-replies' },
    { icon: AtSign, label: 'Mentions', path: '/mentions' },
    { icon: Bell, label: 'Notifications', path: '/notifications', showBadge: true },
    { icon: Search, label: 'Search', path: '/search-contents' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: LogOut, label: 'Logout', path: '/logout', isLogout: true },
  ];

  const handleNavigation = (path: string, isLogout?: boolean) => {
    if (isLogout) {
      setShowLogoutDialog(true);
    } else {
      navigate(path);
    }
    // Close mobile menu after navigation
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };


  const sidebarWidth = isMobile ? 'w-64' : isCollapsed ? 'w-16' : 'w-64';
  const logoSize = isCollapsed && !isMobile ? 'h-8 w-8' : 'h-16 w-16';
  const showLabels = !isCollapsed || isMobile;

  return (
    <div className={`${sidebarWidth} h-screen border-r border-border bg-background transition-all duration-300 ease-in-out ${
      isCollapsed && !isMobile ? 'p-2' : 'p-4'
    } ${isMobile ? 'pt-20' : ''} flex flex-col overflow-hidden`}>
      <div className="mb-4 flex justify-center flex-shrink-0">
        <KaspaLogo className={`${logoSize} transition-all duration-300`} isDarkTheme={theme === 'dark'} />
      </div>
      <nav className="space-y-3 overflow-y-auto flex-1">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            onClick={() => handleNavigation(item.path, item.isLogout)}
            className={`w-full ${showLabels ? 'justify-start px-4 gap-4' : 'justify-center px-2'} py-3 text-left rounded-lg transition-all duration-300 cursor-pointer ${
              location.pathname === item.path ? 'text-foreground font-bold' : 'text-muted-foreground'
            } hover:bg-muted relative`}
            title={isCollapsed && !isMobile ? item.label : undefined}
          >
            <div className="relative inline-block">
              <item.icon
                className={`size-5 transition-all duration-300`}
                strokeWidth={location.pathname === item.path ? 2.7 : 2}
              />
              {item.showBadge && notificationCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[11px] rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {notificationCount > 30 ? '30+' : notificationCount}
                </span>
              )}
            </div>
            {showLabels && <span className="text-lg sm:text-xl">{item.label}</span>}
          </Button>
        ))}
      </nav>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default LeftSidebar;