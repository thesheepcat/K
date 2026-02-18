import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { useKaspaPostsApi } from "@/hooks/useKaspaPostsApi";
import { useAuth } from "@/contexts/AuthContext";
import { type Post } from "@/models/types";
import TrendingHashtagsCard from "./TrendingHashtagsCard";

const POLLING_INTERVAL = 10000; // 10 seconds
const MOST_ACTIVE_POLLING_INTERVAL = 30000; // 30 seconds

interface RightSidebarProps {
  showTrending?: boolean;
}

interface UserItemProps {
  user: Post;
  onUserClick: (userPubkey: string) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onUserClick }) => {
  const jdenticonAvatar = useJdenticonAvatar(user.author.pubkey, 40);

  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = user.author.avatar || jdenticonAvatar;

  return (
    <div
      className="p-4 hover:bg-accent hover:bg-opacity-50 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0"
      onClick={() => onUserClick(user.author.pubkey || '')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {user.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-foreground">
              {user.author.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ActiveUserItemProps {
  user: Post;
  onUserClick: (userPubkey: string) => void;
}

const ActiveUserItem: React.FC<ActiveUserItemProps> = ({ user, onUserClick }) => {
  const jdenticonAvatar = useJdenticonAvatar(user.author.pubkey, 40);
  const displayAvatar = user.author.avatar || jdenticonAvatar;

  return (
    <div
      className="p-4 hover:bg-accent hover:bg-opacity-50 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0"
      onClick={() => onUserClick(user.author.pubkey || '')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {user.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-foreground">
              {user.author.name}
            </p>
            {user.contentsCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {user.contentsCount} {user.contentsCount === 1 ? 'post' : 'posts'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MostActiveUsersCard: React.FC = () => {
  const navigate = useNavigate();
  const { publicKey } = useAuth();
  const { fetchAndConvertMostActiveUsers, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();

  const [activeUsers, setActiveUsers] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunctionRef = useRef(fetchAndConvertMostActiveUsers);
  const publicKeyRef = useRef(publicKey);

  fetchFunctionRef.current = fetchAndConvertMostActiveUsers;
  publicKeyRef.current = publicKey;

  const loadActiveUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }
      const response = await fetchFunctionRef.current(publicKeyRef.current, 5, '7d');

      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      // Sort by contentsCount in descending order (most active first)
      const sortedUsers = (response.posts || []).sort((a, b) => {
        const countA = a.contentsCount ?? 0;
        const countB = b.contentsCount ?? 0;
        return countB - countA;
      });

      setActiveUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading most active users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load active users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveUsers();
  }, [publicKey, selectedNetwork, apiBaseUrl, loadActiveUsers]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          if (!publicKeyRef.current) {
            return;
          }
          const response = await fetchFunctionRef.current(publicKeyRef.current, 5, '7d');

          if (!response || !response.pagination) {
            console.error('Invalid polling response structure:', response);
            return;
          }

          setError(null);

          // Sort by contentsCount in descending order (most active first)
          const sortedUsers = (response.posts || []).sort((a, b) => {
            const countA = a.contentsCount ?? 0;
            const countB = b.contentsCount ?? 0;
            return countB - countA;
          });

          setActiveUsers(sortedUsers);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active users';
          setError(errorMessage);
          console.error('Error fetching most active users from server:', err);
        }
      }, MOST_ACTIVE_POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, apiBaseUrl]);

  const handleUserClick = (userPubkey: string) => {
    if (userPubkey) {
      navigate(`/user/${userPubkey}`);
    }
  };

  return (
    <Card className="border-border gap-2 mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">Most active users</h3>
        </div>
        <p className="text-sm text-muted-foreground">Top users this week</p>
        {error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            Error: {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {activeUsers.length === 0 && !isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            No active users found
          </div>
        ) : (
          activeUsers.map((user) => (
            <ActiveUserItem
              key={user.id}
              user={user}
              onUserClick={handleUserClick}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

const RightSidebar: React.FC<RightSidebarProps> = ({ showTrending = false }) => {
  // If showing trending hashtags, render TrendingHashtagsCard instead
  if (showTrending) {
    return <TrendingHashtagsCard />;
  }

  const navigate = useNavigate();
  const { publicKey } = useAuth();
  const { fetchAndConvertUsers, selectedNetwork, apiBaseUrl } = useKaspaPostsApi();
  
  const [users, setUsers] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to store the latest values to avoid dependency issues in polling
  const fetchFunctionRef = useRef(fetchAndConvertUsers);
  const publicKeyRef = useRef(publicKey);
  const usersRef = useRef(users);

  // Update refs when values change
  fetchFunctionRef.current = fetchAndConvertUsers;
  publicKeyRef.current = publicKey;
  usersRef.current = users;

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const options = {
        limit: 5
      };

      if (!publicKeyRef.current) {
        throw new Error('User not authenticated');
      }
      const response = await fetchFunctionRef.current(publicKeyRef.current, options);
      
      // Defensive check for response structure
      if (!response || !response.pagination) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }

      setUsers(response.posts || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load users on component mount and when network or apiBaseUrl changes
  useEffect(() => {
    loadUsers();
  }, [publicKey, selectedNetwork, apiBaseUrl, loadUsers]);

  // Set up polling with stable references
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          const options = {
            limit: 5
          };

          if (!publicKeyRef.current) {
            console.error('User not authenticated for polling');
            return;
          }
          const response = await fetchFunctionRef.current(publicKeyRef.current, options);
          
          // Defensive check for response structure
          if (!response || !response.pagination) {
            console.error('Invalid polling response structure:', response);
            return;
          }

          // Clear error on successful response (connection restored)
          setError(null);
          
          // Update with fresh data from server
          setUsers(response.posts || []);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
          setError(errorMessage);
          console.error('Error fetching users from server:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedNetwork, apiBaseUrl]);

  const handleUserClick = (userPubkey: string) => {
    if (userPubkey) {
      navigate(`/user/${userPubkey}`);
    }
  };

  return (
    <div className="w-80 h-screen overflow-y-auto p-4 bg-background">
      <Card className="border-border gap-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">Meet users</h3>
          </div>
          <p className="text-sm text-muted-foreground">Connect with the community</p>
          {error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <UserItem 
                key={user.id} 
                user={user} 
                onUserClick={handleUserClick}
              />
            ))
          )}
        </CardContent>
      </Card>
      <MostActiveUsersCard />
    </div>
  );
};

export default RightSidebar;