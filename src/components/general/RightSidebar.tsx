import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useJdenticonAvatar } from "@/hooks/useJdenticonAvatar";
import { useKaspaPostsApi } from "@/hooks/useKaspaPostsApi";
import { useAuth } from "@/contexts/AuthContext";
import { type Post } from "@/models/types";
import { truncateKaspaAddress } from "@/utils/postUtils";

const POLLING_INTERVAL = 10000; // 10 seconds

interface UserItemProps {
  user: Post;
  onUserClick: (userPubkey: string) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onUserClick }) => {
  const jdenticonAvatar = useJdenticonAvatar(user.author.pubkey, 40);
  
  // Use profile image if available, otherwise use generated avatar
  const displayAvatar = user.author.avatar || jdenticonAvatar;
  
  return (
    <div className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onUserClick(user.author.pubkey || '')}
          >
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-gray-200 text-gray-700">
              {user.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p 
              className="font-bold text-black hover:underline cursor-pointer"
              onClick={() => onUserClick(user.author.pubkey || '')}
            >
              {user.author.name}
            </p>
            <p 
              className="text-sm text-gray-500 hover:underline cursor-pointer"
              onClick={() => onUserClick(user.author.pubkey || '')}
              title={user.author.username}
            >
              @{truncateKaspaAddress(user.author.username)}
            </p>
          </div>
        </div>
        {/* Temporarily disabled */}
        {/* 
        <Button className="bg-black text-white hover:bg-gray-800 px-6 py-2 font-bold rounded-none">
          Follow
        </Button>
        */}
      </div>
    </div>
  );
};

const RightSidebar: React.FC = () => {
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
      
      const response = await fetchFunctionRef.current(publicKeyRef.current || undefined, options);
      
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
  }, [fetchAndConvertUsers, publicKey]);

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
          
          const response = await fetchFunctionRef.current(publicKeyRef.current || undefined, options);
          
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
    <div className="w-80 h-screen p-4 bg-white">
      <Card className="border-gray-200 rounded-none  gap-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-black">Meet new users</h3>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Error: {error}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-gray-500">
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
    </div>
  );
};

export default RightSidebar;