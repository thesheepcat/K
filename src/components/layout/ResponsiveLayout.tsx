import React, { useState, useEffect } from 'react';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LeftSidebar from '../general/LeftSidebar';
import RightSidebar from '../general/RightSidebar';
import { useJdenticonAvatar } from '@/hooks/useJdenticonAvatar';
import { useAuth } from '@/contexts/AuthContext';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState('lg');
  const { publicKey } = useAuth();

  // Generate avatar for mobile menu button using user's public key
  const mobileMenuAvatar = useJdenticonAvatar(publicKey || '', 32);

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
    <div className="h-screen bg-white flex justify-center overflow-hidden">
      <div className="flex w-full max-w-7xl bg-white shadow-lg relative h-full">
        {/* Mobile Header - Fixed at top */}
        {(screenSize === 'sm' || screenSize === 'md') && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="relative flex items-center px-4 py-3 max-w-7xl mx-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-0 w-8 h-8 bg-white shadow-sm rounded-full border border-gray-200 z-10"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={mobileMenuAvatar} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 rounded-full text-xs">A</AvatarFallback>
                  </Avatar>
                )}
              </Button>
              <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold text-gray-900 whitespace-nowrap">
                Your voice. Your ideas.
              </h1>
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {(screenSize === 'sm' || screenSize === 'md') && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <div className={`
          ${(screenSize === 'sm' || screenSize === 'md') ? 
            `fixed left-0 z-40 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }` : 
            'relative'
          }
          ${(screenSize === 'sm' || screenSize === 'md') ? 'top-16 h-[calc(100vh-4rem)]' : 'h-full'}
        `}>
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
          <div className={`h-full ${isMobile ? 'mt-16' : ''}`}>
            {children}
          </div>
        </div>

        {/* Right Sidebar */} 
        {showRightSidebar && (
          <div className="hidden 2xl:block">
            <RightSidebar />
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ResponsiveLayout;