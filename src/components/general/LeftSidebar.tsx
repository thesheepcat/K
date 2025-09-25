import { User, Settings, MessageSquareQuote, MessageSquareReply, ScanEye, Users, LogOut, AtSign, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import KaspaLogo from '../icons/KaspaLogo';

interface LeftSidebarProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isCollapsed = false, isMobile = false, onMobileMenuClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { theme } = useUserSettings();

  const menuItems = [
    { icon: MessageSquareQuote, label: 'My posts', path: '/' },
    { icon: MessageSquareReply, label: 'My replies', path: '/my-replies' },
    //{ icon: UserRoundPlus, label: 'Following', path: '/following' },
    { icon: ScanEye, label: 'Watching', path: '/watching' },
    { icon: AtSign, label: 'Mentions', path: '/mentions' },
    //{ icon: Bell, label: 'Notifications', path: '/notifications' },
    
    { icon: Users, label: 'Users', path: '/users' },
    { icon: UserX, label: 'Blocked', path: '/blocked-users' },
    //{ icon: UserCheck, label: 'Promoted users', path: '/promoted' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: LogOut, label: 'Logout', path: '/logout', isLogout: true },
  ];

  const handleNavigation = (path: string, isLogout?: boolean) => {
    if (isLogout) {
      logout();
    } else {
      navigate(path);
    }
    // Close mobile menu after navigation
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
    } ${isMobile ? 'pt-20' : ''}`}>
      <div className="mb-8 flex justify-center">
        <KaspaLogo className={`${logoSize} transition-all duration-300`} isDarkTheme={theme === 'dark'} />
      </div>
      <nav className="space-y-3">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            onClick={() => handleNavigation(item.path, item.isLogout)}
            className={`w-full ${showLabels ? 'justify-start px-4' : 'justify-center px-2'} py-3 text-left rounded-lg transition-all duration-300 cursor-pointer ${
              location.pathname === item.path ? 'text-foreground font-bold' : 'text-muted-foreground'
            } hover:bg-muted`}
            title={isCollapsed && !isMobile ? item.label : undefined}
          >
            <item.icon className={`h-6 w-6 ${showLabels ? 'mr-4' : ''} transition-all duration-300`} />
            {showLabels && <span className="text-lg sm:text-xl">{item.label}</span>}
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default LeftSidebar;