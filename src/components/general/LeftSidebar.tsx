import { User, Settings, MessageSquareQuote, ScanEye, Users, LogOut, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  const menuItems = [
    { icon: MessageSquareQuote, label: 'My posts', path: '/' },
    //{ icon: UserRoundPlus, label: 'Following', path: '/following' },
    { icon: ScanEye, label: 'Watching', path: '/watching' },
    { icon: AtSign, label: 'Mentions', path: '/mentions' },
    //{ icon: Bell, label: 'Notifications', path: '/notifications' },
    
    { icon: Users, label: 'Users', path: '/users' },
    //{ icon: UserCheck, label: 'Promoted users', path: '/promoted' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile menu after navigation
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const handleLogout = () => {
    logout();
    // Close mobile menu after logout
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const sidebarWidth = isMobile ? 'w-64' : isCollapsed ? 'w-16' : 'w-64';
  const logoSize = isCollapsed && !isMobile ? 'h-8 w-8' : 'h-16 w-16';
  const showLabels = !isCollapsed || isMobile;

  return (
    <div className={`${sidebarWidth} h-screen border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
      isCollapsed && !isMobile ? 'p-2' : 'p-4'
    }`}>
      <div className="mb-8 flex justify-center">
        <KaspaLogo className={`${logoSize} transition-all duration-300`} />
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            onClick={() => handleNavigation(item.path)}
            className={`w-full ${showLabels ? 'justify-start px-4' : 'justify-center px-2'} py-3 text-left rounded-lg transition-all duration-300 ${
              location.pathname === item.path ? 'bg-gray-100 text-black font-bold' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={isCollapsed && !isMobile ? item.label : undefined}
          >
            <item.icon className={`h-6 w-6 ${showLabels ? 'mr-4' : ''} transition-all duration-300`} />
            {showLabels && <span className="text-lg sm:text-xl">{item.label}</span>}
          </Button>
        ))}
      </nav>
      <Button 
        onClick={handleLogout}
        className={`w-full mt-8 bg-gray-200 text-gray-700 hover:bg-gray-300 py-3 font-bold rounded-lg transition-all duration-300 ${
          showLabels ? 'text-lg' : 'text-sm'
        }`}
        title={isCollapsed && !isMobile ? 'Logout' : undefined}
      >
        <LogOut className={`h-6 w-6 ${showLabels ? 'mr-4' : ''} transition-all duration-300`} />
        {showLabels && <span className="text-sm sm:text-base">Logout</span>}
      </Button>
    </div>
  );
};

export default LeftSidebar;