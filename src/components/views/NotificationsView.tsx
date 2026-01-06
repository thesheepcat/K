import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import notificationService from '@/services/notificationService';
import NotificationCard from '../general/NotificationCard';

interface NotificationData {
  id: string;
  userPublicKey: string;
  postContent: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  contentType: 'post' | 'reply' | 'vote' | 'quote';
  cursor: string;
  voteType?: 'upvote' | 'downvote' | null;
  mentionBlockTime?: number | null;
  contentId?: string | null;
  postId?: string | null;
  votedContent?: string | null;
}


interface NotificationsProps {
  onNotificationsSeen?: () => void;
}

const POLLING_INTERVAL = 5000; // 5 seconds

const NotificationsView: React.FC<NotificationsProps> = ({ onNotificationsSeen }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { publicKey } = useAuth();
  const { apiBaseUrl } = useUserSettings();

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef(notifications);
  const nextCursorRef = useRef(nextCursor);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);

  // Update refs when values change
  notificationsRef.current = notifications;
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;

  const loadNotifications = useCallback(async (reset: boolean = true) => {
    try {
      if (!publicKey) {
        console.warn('No public key available for fetching notifications');
        return;
      }

      // Update the notification service with current API base URL
      notificationService.setApiBaseUrl(apiBaseUrl);

      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const options: { limit?: number; before?: string; after?: string } = {
        limit: 10,
        ...(reset ? {} : { before: nextCursorRef.current || undefined })
      };

      const response = await notificationService.fetchNotifications(options);

      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      if (reset) {
        setNotifications(response.notifications || []);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);

        // Mark notifications as seen when first loaded
        if (response.notifications && response.notifications.length > 0) {
          const latestNotification = response.notifications[0]; // First notification is the latest
          notificationService.markNotificationsAsSeen(latestNotification.cursor);
          onNotificationsSeen?.();
        }
      } else {
        // Append new notifications to existing ones
        const updatedNotifications = [...notificationsRef.current, ...(response.notifications || [])];
        setNotifications(updatedNotifications);
        setNextCursor(response.pagination.nextCursor);
        setHasMore(response.pagination.hasMore);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications from server:', err);
    } finally {
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [publicKey, apiBaseUrl, onNotificationsSeen]);

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMoreRef.current) {
      return;
    }

    await loadNotifications(false);
  }, [loadNotifications]);

  // Load notifications on component mount
  useEffect(() => {
    if (publicKey) {
      setTimeout(() => loadNotifications(true), 0);
    }
  }, [publicKey, apiBaseUrl, loadNotifications]);

  // Set up polling for new notifications
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          if (!publicKey) {
            return;
          }

          const options: { limit?: number } = {
            limit: 10
          };

          // Update the notification service with current API base URL
          notificationService.setApiBaseUrl(apiBaseUrl);

          const response = await notificationService.fetchNotifications(options);

          // Defensive check for response structure
          if (!response || !response.pagination) {
            console.error('Invalid polling response structure:', response);
            return;
          }

          // Check if server data has any changes compared to local data
          const serverNotifications = response.notifications || [];
          const localNotifications = notificationsRef.current;

          let hasChanges = false;

          // Check if notification count differs
          if (serverNotifications.length !== localNotifications.length) {
            hasChanges = true;
          } else {
            // Compare each notification for changes
            for (let i = 0; i < Math.min(serverNotifications.length, localNotifications.length); i++) {
              const serverNotification = serverNotifications[i];
              const localNotification = localNotifications[i];

              if (
                serverNotification.id !== localNotification.id ||
                serverNotification.timestamp !== localNotification.timestamp
              ) {
                hasChanges = true;
                break;
              }
            }
          }

          if (hasChanges) {
            // Only update the first page of notifications to preserve infinite scroll state
            const currentNotifications = notificationsRef.current;

            if (currentNotifications.length <= 10) {
              // If we only have first page loaded, replace all
              setNotifications(serverNotifications);
              setHasMore(response.pagination.hasMore);
              setNextCursor(response.pagination.nextCursor);
            } else {
              // If we have more than first page, only update the first 10 notifications
              const updatedNotifications = [
                ...serverNotifications.slice(0, Math.min(serverNotifications.length, 10)),
                ...currentNotifications.slice(10)
              ];
              setNotifications(updatedNotifications);
            }
          }

          // Always update cursor when polling while viewing notifications
          // This keeps the notification badge at zero while user is on this page
          if (serverNotifications.length > 0) {
            const latestNotification = serverNotifications[0];
            notificationService.markNotificationsAsSeen(latestNotification.cursor);
          }
        } catch (err) {
          console.error('Error polling notifications:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [publicKey, apiBaseUrl]);

  // Infinite scroll setup
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const shouldLoadMore = distanceFromBottom < 300; // Load when within 300px of bottom

      if (shouldLoadMore && hasMoreRef.current && !isLoadingMoreRef.current) {
        loadMoreNotifications();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreNotifications]);

  // Check if content fills the container and load more if needed
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isLoading) return;

    const checkAndLoadMore = () => {
      const { scrollHeight, clientHeight } = scrollContainer;
      const hasScrollbar = scrollHeight > clientHeight;

      // If there's no scrollbar and we have more content to load, load it
      if (!hasScrollbar && hasMoreRef.current && !isLoadingMoreRef.current && notifications.length > 0) {
        loadMoreNotifications();
      }
    };

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkAndLoadMore, 100);

    return () => clearTimeout(timeoutId);
  }, [notifications, isLoading, loadMoreNotifications]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto lg:border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border p-4 z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            Error: {error}
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {isLoading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-transparent rounded-full animate-loader-circle mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            No notifications found.
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))}

            {/* Auto-load more content when scrolling near bottom */}
            {hasMore && isLoadingMore && (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-loader-circle mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading more notifications...</p>
              </div>
            )}

            {/* End of notifications indicator */}
            {!hasMore && notifications.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No more notifications to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;