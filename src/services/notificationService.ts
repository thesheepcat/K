
interface NotificationCountResponse {
  count: number;
}

interface NotificationData {
  id: string;
  userPublicKey: string;
  postContent: string;
  timestamp: number;
  userNickname?: string;
  userProfileImage?: string;
  contentType: 'post' | 'reply' | 'vote';
  cursor: string;
  voteType?: 'upvote' | 'downvote' | null;
  mentionBlockTime?: number | null;
  contentId?: string | null;
  postId?: string | null;
  votedContent?: string | null;
}

interface NotificationResponse {
  notifications: NotificationData[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
}

class NotificationService {
  private static instance: NotificationService;
  private polling = false;
  private intervalId: NodeJS.Timeout | null = null;
  private latestNotificationCursor: string | null = null;
  private notificationCount = 0;
  private listeners: Array<(count: number) => void> = [];
  private currentUserPubkey: string | null = null;
  private apiBaseUrl: string = 'http://localhost:3000';

  // Storage key for cursor persistence
  private static readonly CURSOR_STORAGE_KEY = 'k_notifications_cursor';

  private constructor() {
    // Load persisted cursor on initialization
    this.loadPersistedCursor();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Set the API base URL to use for requests
   */
  setApiBaseUrl(apiBaseUrl: string): void {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Start polling for notification count every 10 seconds
   */
  startPolling(userPubkey: string, apiBaseUrl?: string): void {
    if (apiBaseUrl) {
      this.apiBaseUrl = apiBaseUrl;
    }

    if (this.polling && this.currentUserPubkey === userPubkey) {
      return; // Already polling for this user
    }

    this.stopPolling(); // Stop any existing polling
    this.currentUserPubkey = userPubkey;
    this.polling = true;

    // Initial fetch
    this.fetchNotificationCount();

    // Poll every 10 seconds
    this.intervalId = setInterval(() => {
      this.fetchNotificationCount();
    }, 10000);
  }

  /**
   * Stop the polling service
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.polling = false;
    this.currentUserPubkey = null;
    this.notificationCount = 0;
    // Don't clear the cursor here - it should persist across sessions
    this.notifyListeners(0);
  }

  /**
   * Get current notification count
   */
  getNotificationCount(): number {
    return this.notificationCount;
  }

  /**
   * Subscribe to notification count changes
   */
  subscribe(callback: (count: number) => void): () => void {
    this.listeners.push(callback);

    // Immediately call with current count
    callback(this.notificationCount);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Update the latest notification cursor (called when user opens NotificationsView)
   */
  updateLatestNotificationCursor(cursor: string | null): void {
    this.latestNotificationCursor = cursor;
    this.persistCursor(cursor);
  }

  /**
   * Load the persisted cursor from localStorage
   */
  private loadPersistedCursor(): void {
    try {
      const persistedData = localStorage.getItem(NotificationService.CURSOR_STORAGE_KEY);
      if (persistedData) {
        const data = JSON.parse(persistedData);
        if (data.cursor && typeof data.cursor === 'string') {
          this.latestNotificationCursor = data.cursor;
        }
      }
    } catch (error) {
      console.error('Error loading persisted notification cursor:', error);
      // Clear invalid data
      localStorage.removeItem(NotificationService.CURSOR_STORAGE_KEY);
    }
  }

  /**
   * Persist the cursor to localStorage
   */
  private persistCursor(cursor: string | null): void {
    try {
      if (cursor) {
        const data = {
          cursor,
          timestamp: Date.now()
        };
        localStorage.setItem(NotificationService.CURSOR_STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(NotificationService.CURSOR_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting notification cursor:', error);
    }
  }

  /**
   * Clear the persisted cursor (called on logout or when resetting)
   */
  clearPersistedCursor(): void {
    this.latestNotificationCursor = null;
    this.persistCursor(null);
  }

  /**
   * Fetch notification count from API
   */
  private async fetchNotificationCount(): Promise<void> {
    if (!this.currentUserPubkey) {
      return;
    }

    try {
      const url = new URL(`${this.apiBaseUrl}/get-notifications-count`);

      url.searchParams.append('requesterPubkey', this.currentUserPubkey);

      // Use the "after" parameter if we have a latest cursor
      if (this.latestNotificationCursor) {
        url.searchParams.append('after', this.latestNotificationCursor);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NotificationCountResponse = await response.json();

      // Update notification count
      this.notificationCount = data.count;
      this.notifyListeners(this.notificationCount);

    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Don't reset count on error - keep last known count
    }
  }

  /**
   * Fetch detailed notifications (for NotificationsView)
   */
  async fetchNotifications(options?: { limit?: number; before?: string; after?: string }): Promise<NotificationResponse> {
    if (!this.currentUserPubkey) {
      throw new Error('No user authenticated for notifications');
    }

    try {
      const url = new URL(`${this.apiBaseUrl}/get-notifications`);

      url.searchParams.append('requesterPubkey', this.currentUserPubkey);

      const limit = options?.limit || 10;
      url.searchParams.append('limit', limit.toString());

      if (options?.before) {
        url.searchParams.append('before', options.before);
      }

      if (options?.after) {
        url.searchParams.append('after', options.after);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NotificationResponse = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as seen (updates the cursor with the latest notification cursor)
   */
  markNotificationsAsSeen(latestCursor: string): void {
    this.updateLatestNotificationCursor(latestCursor);

    // Reset notification count since they've been seen
    this.notificationCount = 0;
    this.notifyListeners(0);
  }

  /**
   * Notify all listeners of count change
   */
  private notifyListeners(count: number): void {
    this.listeners.forEach(callback => {
      try {
        callback(count);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
}

export default NotificationService.getInstance();