import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeftSidebar from '../general/LeftSidebar';
import RightSidebar from '../general/RightSidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('lg');

  // Determine if we should show trending hashtags based on current route
  const showTrending = location.pathname === '/search-contents';

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('sm');
      } else if (width < 768) {
        setScreenSize('md');
      } else if (width < 1024) {
        setScreenSize('lg');
      } else if (width < 1280) {
        setScreenSize('xl');
      } else {
        setScreenSize('2xl');
      }
      
      // Close mobile menu when resizing to larger screens
      if (width >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showRightSidebar = screenSize === '2xl';
  const showFullLeftSidebar = screenSize === 'xl' || screenSize === '2xl';
  const showCollapsedLeftSidebar = screenSize === 'lg';
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  return (
    <div className="h-screen bg-background flex justify-center overflow-hidden">
      <div className="flex w-full max-w-7xl bg-background shadow-lg relative h-full">
        {/* Mobile Header - Fixed at top */}
        {(screenSize === 'sm' || screenSize === 'md') && (
          <div
            className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
          >
            <div className="relative flex items-center px-4 py-3 max-w-7xl mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-0 w-8 h-8 bg-background shadow-sm rounded-full border border-border z-10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold text-foreground whitespace-nowrap">
                Your voice. Your ideas.
              </h1>
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {(screenSize === 'sm' || screenSize === 'md') && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-overlay z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <div
          className={`
            ${(screenSize === 'sm' || screenSize === 'md') ?
              `fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }` :
              'relative'
            }
            ${(screenSize === 'sm' || screenSize === 'md') ? 'h-screen' : 'h-full'}
          `}
          style={(screenSize === 'sm' || screenSize === 'md') ? { paddingTop: 'max(env(safe-area-inset-top), 24px)' } : undefined}
        >
          <LeftSidebar 
            isCollapsed={showCollapsedLeftSidebar}
            isMobile={screenSize === 'sm' || screenSize === 'md'}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isMobile ? 'w-full h-[calc(100vh-4rem)]' : 'h-full'}
          ${showCollapsedLeftSidebar ? 'ml-0' : ''}
          ${showFullLeftSidebar ? 'ml-0' : ''}
        `}>
          <div
            className="h-full"
            style={isMobile ? { paddingTop: 'calc(max(env(safe-area-inset-top), 24px) + 4rem)' } : undefined}
          >
            {children}
          </div>
        </div>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <div className="hidden 2xl:block">
            <RightSidebar showTrending={showTrending} />
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ResponsiveLayout;