import React, { useState, useEffect } from "react";
import { HashRouter, BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserSettingsProvider, useUserSettings } from "./contexts/UserSettingsContext";
import LoginForm from "./components/auth/LoginForm";
import UnlockSession from "./components/auth/UnlockSession";
import SessionTimeoutWarning from "./components/auth/SessionTimeoutWarning";
import ResponsiveLayout from "./components/layout/ResponsiveLayout";
import MyPosts from "./components/views/MyPostsView.tsx";
import MyReplies from "./components/views/MyRepliesView.tsx";
import Watching from "./components/views/WatchingView.tsx";
import Following from "./components/views/FollowingView.tsx";
import Mentions from "./components/views/MentionsView.tsx";
import NotificationsView from "./components/views/NotificationsView.tsx";
import UsersView from "./components/views/UsersView.tsx";
import SearchUsersView from "./components/views/SearchUsersView.tsx";
import SearchContentsView from "./components/views/SearchContentsView.tsx";
import UsersBlockedView from "./components/views/UsersBlockedView.tsx";
import UsersFollowingView from "./components/views/UsersFollowingView.tsx";
import UsersFollowersView from "./components/views/UsersFollowersView.tsx";
import PostDetailView from "./components/views/PostDetailView.tsx";
import UserPostsView from "./components/views/UserPostsView.tsx";
import ProfileView from "./components/views/ProfileView.tsx";
import SettingsView from "./components/views/SettingsView.tsx";

import { Toaster } from "@/components/ui/sonner";
import { type Post } from "@/models/types";
import kaspaService from "./services/kaspaService";
import { useNetworkValidator } from "./hooks/useNetworkValidator";
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { App as CapacitorApp } from '@capacitor/app';

// Use HashRouter for Electron (file:// protocol), BrowserRouter for web
const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron');
const Router = isElectron ? HashRouter : BrowserRouter;

// Component to handle Android back button
const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listenerHandle: any = null;

    const setupBackButton = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          // If we can go back in the navigation history, do that
          navigate(-1);
        } else {
          // If we're at the root and can't go back, exit the app
          CapacitorApp.exitApp();
        }
      });
    };

    setupBackButton();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [navigate, location]);

  return null;
};

const MainApp: React.FC = () => {
  const { isAuthenticated, hasStoredKey } = useAuth();
  const { theme } = useUserSettings();
  const [myPostsData, setMyPostsData] = useState<Post[]>([]); // Only server posts, no local posts
  const [myRepliesData, setMyRepliesData] = useState<Post[]>([]);
  const [watchingData, setWatchingData] = useState<Post[]>([]);
  const [followingData, setFollowingData] = useState<Post[]>([]);
  const [mentionsData, setMentionsData] = useState<Post[]>([]);
  const [usersData, setUsersData] = useState<Post[]>([]);
  const [searchUsersData, setSearchUsersData] = useState<Post[]>([]);
  const [searchContentsData, setSearchContentsData] = useState<Post[]>([]);
  const [blockedUsersData, setBlockedUsersData] = useState<Post[]>([]);
  const [usersFollowingData, setUsersFollowingData] = useState<Post[]>([]);
  const [usersFollowersData, setUsersFollowersData] = useState<Post[]>([]);

  // Validate network after login
  useNetworkValidator();

  // Update status bar and navigation bar style when theme changes
  useEffect(() => {
    const updateBars = async () => {
      try {
        if (theme === 'dark') {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#141414' }); // Dark background
          await NavigationBar.setNavigationBarColor({
            color: '#141414', // Dark navigation bar
            darkButtons: false // Light buttons for dark background
          });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' }); // White background
          await NavigationBar.setNavigationBarColor({
            color: '#ffffff', // White navigation bar
            darkButtons: true // Dark buttons for light background
          });
        }
      } catch (error) {
        // StatusBar/NavigationBar API not available (web or other platforms)
        console.log('StatusBar/NavigationBar API not available');
      }
    };

    updateBars();
  }, [theme]);

  useEffect(() => {
    // Hide the static HTML splash screen and load Kaspa WASM
    const loadApp = async () => {
      try {
        await kaspaService.ensureLoaded();
      } catch (error) {
        console.error('Failed to load Kaspa SDK:', error);
      } finally {
        // Add a minimum delay to ensure splash screen is visible, then hide it
        setTimeout(() => {
          const staticSplash = document.getElementById('initial-splash');
          if (staticSplash) {
            staticSplash.classList.add('splash-hidden');
          }
        }, 2000);
      }
    };
    
    loadApp();
  }, [])

  // Show login form if not authenticated and no stored key
  if (!isAuthenticated && !hasStoredKey()) {
    return <LoginForm />;
  }

  // Show unlock session if not authenticated but has stored key
  if (!isAuthenticated && hasStoredKey()) {
    return <UnlockSession />;
  }

  const updatePostRecursively = (posts: Post[], targetId: string, updateFn: (post: Post) => Post): Post[] => {
    return posts.map(post => {
      if (post.id === targetId) {
        return updateFn(post);
      }
      if (post.nestedReplies && post.nestedReplies.length > 0) {
        return {
          ...post,
          nestedReplies: updatePostRecursively(post.nestedReplies, targetId, updateFn)
        };
      }
      return post;
    });
  };

  const handleUpVote = (postId: string) => {
    const upVoteUpdateFn = (post: Post) => ({
      ...post,
      upVoted: !post.upVoted,
      upVotes: post.upVoted ? post.upVotes - 1 : post.upVotes + 1,
      // If upvoting, remove downvote if it exists
      downVoted: post.upVoted ? post.downVoted : false,
      downVotes: post.upVoted ? post.downVotes : (post.downVoted ? post.downVotes - 1 : post.downVotes)
    });

    // Update in all arrays with recursive search
    setMyPostsData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
    setMyRepliesData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
    setWatchingData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
    setFollowingData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
    setMentionsData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
    setSearchContentsData(prev => updatePostRecursively(prev, postId, upVoteUpdateFn));
  };

  const handleDownVote = (postId: string) => {
    const downVoteUpdateFn = (post: Post) => ({
      ...post,
      downVoted: !post.downVoted,
      downVotes: post.downVoted ? post.downVotes - 1 : post.downVotes + 1,
      // If downvoting, remove upvote if it exists
      upVoted: post.downVoted ? post.upVoted : false,
      upVotes: post.downVoted ? post.upVotes : (post.upVoted ? post.upVotes - 1 : post.upVotes)
    });

    // Update in all arrays with recursive search
    setMyPostsData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
    setMyRepliesData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
    setWatchingData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
    setFollowingData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
    setMentionsData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
    setSearchContentsData(prev => updatePostRecursively(prev, postId, downVoteUpdateFn));
  };

  const handleRepost = (postId: string) => {
    const repostUpdateFn = (post: Post) => ({
      ...post,
      reposted: !post.reposted,
      reposts: post.reposted ? post.reposts - 1 : post.reposts + 1
    });

    // Update in all arrays with recursive search
    setMyPostsData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
    setMyRepliesData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
    setWatchingData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
    setFollowingData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
    setMentionsData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
    setSearchContentsData(prev => updatePostRecursively(prev, postId, repostUpdateFn));
  };

  const handleServerPostsUpdate = (serverPosts: Post[]) => {
    setMyPostsData(serverPosts); // My posts are only server posts
  };

  const handleMyRepliesPostsUpdate = (serverPosts: Post[]) => {
    setMyRepliesData(serverPosts);
  };

  const handleWatchingPostsUpdate = (serverPosts: Post[]) => {
    setWatchingData(serverPosts);
  };

  const handleFollowingPostsUpdate = (serverPosts: Post[]) => {
    setFollowingData(serverPosts);
  };

  const handleMentionsPostsUpdate = (serverPosts: Post[]) => {
    setMentionsData(serverPosts);
  };

  const handleUsersPostsUpdate = (serverPosts: Post[]) => {
    setUsersData(serverPosts);
  };

  const handleSearchUsersPostsUpdate = (serverPosts: Post[]) => {
    setSearchUsersData(serverPosts);
  };

  const handleBlockedUsersPostsUpdate = (serverPosts: Post[]) => {
    setBlockedUsersData(serverPosts);
  };

  const handleUsersFollowingPostsUpdate = (serverPosts: Post[]) => {
    setUsersFollowingData(serverPosts);
  };

  const handleUsersFollowersPostsUpdate = (serverPosts: Post[]) => {
    setUsersFollowersData(serverPosts);
  };

  const handleSearchContentsPostsUpdate = (serverPosts: Post[]) => {
    setSearchContentsData(serverPosts);
  };



  const handlePost = (content: string) => {
    // Note: The post will appear in My Posts once the server returns it 
    // and the polling mechanism fetches it
    void content; // Suppress unused variable warning
  };
  
  return (
    <Router>
      <BackButtonHandler />
      <style>
        {`
          .overflow-y-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <SessionTimeoutWarning />
      <ResponsiveLayout>
        <Routes>
          <Route
            path="/"
            element={
              <Watching
                posts={watchingData}
                onUpVote={handleUpVote}
                onDownVote={handleDownVote}
                onRepost={handleRepost}
                onServerPostsUpdate={handleWatchingPostsUpdate}
              />
            }
          />
          <Route
            path="/my-posts"
            element={
              <MyPosts
                posts={myPostsData}
                onUpVote={handleUpVote}
                onDownVote={handleDownVote}
                onRepost={handleRepost}
                onPost={handlePost}
                onServerPostsUpdate={handleServerPostsUpdate}
              />
            }
          />
          <Route
            path="/my-replies"
            element={
              <MyReplies
                posts={myRepliesData}
                onUpVote={handleUpVote}
                onDownVote={handleDownVote}
                onRepost={handleRepost}
                onServerPostsUpdate={handleMyRepliesPostsUpdate}
              />
            }
          />
  <Route
    path="/following"
    element={
      <Following
        posts={followingData}
        onUpVote={handleUpVote}
        onDownVote={handleDownVote}
        onRepost={handleRepost}
        onServerPostsUpdate={handleFollowingPostsUpdate}
      />
    }
  />
  <Route
    path="/mentions"
    element={
      <Mentions
        posts={mentionsData}
        onUpVote={handleUpVote}
        onDownVote={handleDownVote}
        onRepost={handleRepost}
        onServerPostsUpdate={handleMentionsPostsUpdate}
      />
    }
  />
  <Route
    path="/notifications"
    element={<NotificationsView />}
  />
  <Route
    path="/search-contents"
    element={
      <SearchContentsView
        posts={searchContentsData}
        onUpVote={handleUpVote}
        onDownVote={handleDownVote}
        onRepost={handleRepost}
        onServerPostsUpdate={handleSearchContentsPostsUpdate}
      />
    }
  />
          <Route
            path="/users"
            element={
              <UsersView
                posts={usersData}
                onServerPostsUpdate={handleUsersPostsUpdate}
              />
            }
          />
          <Route
            path="/search-users"
            element={
              <SearchUsersView
                posts={searchUsersData}
                onServerPostsUpdate={handleSearchUsersPostsUpdate}
              />
            }
          />
          <Route
            path="/users-blocked"
            element={
              <UsersBlockedView
                posts={blockedUsersData}
                onServerPostsUpdate={handleBlockedUsersPostsUpdate}
              />
            }
          />
          <Route
            path="/users-following/:userPubkey?"
            element={
              <UsersFollowingView
                posts={usersFollowingData}
                onServerPostsUpdate={handleUsersFollowingPostsUpdate}
              />
            }
          />
          <Route
            path="/users-followers/:userPubkey?"
            element={
              <UsersFollowersView
                posts={usersFollowersData}
                onServerPostsUpdate={handleUsersFollowersPostsUpdate}
              />
            }
          />
          <Route
            path="/post/:postId" 
            element={
              <PostDetailView 
                onUpVote={handleUpVote}
                onDownVote={handleDownVote}
                onRepost={handleRepost}
              />
            } 
          />
          <Route 
            path="/user/:userPubkey" 
            element={
              <UserPostsView 
                onUpVote={handleUpVote}
                onDownVote={handleDownVote}
                onRepost={handleRepost}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={<ProfileView />} 
          />
          <Route 
            path="/settings" 
            element={<SettingsView />} 
          />
        </Routes>
      </ResponsiveLayout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <Toaster />
        <MainApp />
      </UserSettingsProvider>
    </AuthProvider>
  );
};

export default App;