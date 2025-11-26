import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import CryptoJS from 'crypto-js';
import kaspaService from '../services/kaspaService';
import { SESSION_DURATION_MS, ACTIVITY_THROTTLE_MS } from '../config/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  privateKey: string | null;
  publicKey: string | null;
  address: string | null;
  login: (privateKey: string, password: string) => Promise<void>;
  logout: () => void;
  generateNewKeyPair: () => Promise<{ privateKey: string; publicKey: string; address: string }>;
  hasStoredKey: () => boolean;
  unlockSession: (password: string) => Promise<boolean>;
  extendSession: () => void;
  getSessionTimeRemaining: () => number;
  lockSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'kaspa_encrypted_private_key';
const SESSION_KEY = 'kaspa_session_data';
const SESSION_PASSWORD_KEY = 'kaspa_temp_session_key';

// Session-based encryption: We generate a random session key that's stored in sessionStorage
// This allows page reloads during an active session without re-entering password
// But clears when the browser tab is closed or session expires
interface SessionData {
  encryptedPrivateKey: string;
  publicKey: string;
  address: string;
  timestamp: number;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [hasStoredKeyState, setHasStoredKeyState] = useState(false);

  // Check for valid session and stored encrypted key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    setHasStoredKeyState(!!storedKey);
    
    // Try to restore session from sessionStorage if available
    const sessionData = getValidSession();
    if (sessionData && storedKey) {
      tryRestoreSession(sessionData);
    } else if (storedKey) {
      // There's a stored key, but no valid session - user needs to unlock with password
      setIsAuthenticated(false);
    }
  }, []);

  const tryRestoreSession = async (sessionData: SessionData) => {
    try {
      // Get the temporary session key
      const sessionKey = sessionStorage.getItem(SESSION_PASSWORD_KEY);
      if (!sessionKey) {
        setIsAuthenticated(false);
        return;
      }

      // Decrypt the private key using the session key
      const decrypted = CryptoJS.AES.decrypt(sessionData.encryptedPrivateKey, sessionKey).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        // Session key invalid, clear session
        clearSession();
        setIsAuthenticated(false);
        return;
      }

      // Set authentication state
      setPrivateKey(decrypted);
      setPublicKey(sessionData.publicKey);
      setAddress(sessionData.address);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Session restore error:', error);
      clearSession();
      setIsAuthenticated(false);
    }
  };

  const getValidSession = (): SessionData | null => {
    try {
      const sessionDataStr = sessionStorage.getItem(SESSION_KEY);
      if (!sessionDataStr) return null;
      
      const sessionData: SessionData = JSON.parse(sessionDataStr);
      const currentTime = Date.now();
      
      // Check if session is still valid (within duration)
      if (currentTime - sessionData.timestamp <= SESSION_DURATION_MS) {
        return sessionData;
      } else {
        // Session expired, remove it
        clearSession();
        return null;
      }
    } catch (error) {
      // Invalid session data, remove it
      clearSession();
      return null;
    }
  };

  const generateSessionKey = (): string => {
    // Generate a random session key for encrypting keys during the session
    // This is different from the user's password and only exists in sessionStorage
    return CryptoJS.lib.WordArray.random(256/8).toString();
  };

  const saveSession = (privateKey: string, publicKey: string, address: string) => {
    // Generate a temporary session key (cleared when tab closes)
    const sessionKey = generateSessionKey();
    
    // Encrypt the private key with the session key
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, sessionKey).toString();
    
    const sessionData: SessionData = {
      encryptedPrivateKey,
      publicKey,
      address,
      timestamp: Date.now()
    };
    
    // Store encrypted session data and session key
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(SESSION_PASSWORD_KEY, sessionKey);
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_PASSWORD_KEY);
  };

  const isSessionValid = (): boolean => {
    const sessionData = getValidSession();
    return sessionData !== null;
  };

  const generateKeyPairFromKaspaSDK = async (privateKeyHex?: string, networkId?: string) => {
    try {
      // Ensure Kaspa SDK is loaded
      await kaspaService.ensureLoaded();
      
      // Generate keys using the service with network support
      return kaspaService.generateKeyPair(privateKeyHex, networkId);
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateNewKeyPair = async () => {
    return await generateKeyPairFromKaspaSDK();
  };

  const login = async (privateKeyInput: string, password: string) => {
    try {
      // Validate and generate keys from the private key
      const keyPair = await generateKeyPairFromKaspaSDK(privateKeyInput);

      // Encrypt the private key with the password
      const encrypted = CryptoJS.AES.encrypt(privateKeyInput, password).toString();

      // Store encrypted key in localStorage
      localStorage.setItem(STORAGE_KEY, encrypted);
      setHasStoredKeyState(true);

      // Save encrypted session data
      saveSession(keyPair.privateKey, keyPair.publicKey, keyPair.address);

      // Set authentication state
      setPrivateKey(keyPair.privateKey);
      setPublicKey(keyPair.publicKey);
      setAddress(keyPair.address);
      setIsAuthenticated(true);

    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid private key or encryption failed');
    }
  };

  const unlockSession = async (password: string): Promise<boolean> => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) {
        return false;
      }

      // Decrypt the private key
      const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        return false;
      }

      // Generate keys from the decrypted private key
      const keyPair = await generateKeyPairFromKaspaSDK(decrypted);
      
      // Save encrypted session data
      saveSession(keyPair.privateKey, keyPair.publicKey, keyPair.address);
      
      // Set authentication state
      setPrivateKey(keyPair.privateKey);
      setPublicKey(keyPair.publicKey);
      setAddress(keyPair.address);
      setIsAuthenticated(true);


      return true;
    } catch (error) {
      console.error('Unlock session error:', error);
      return false;
    }
  };

  const lockSession = () => {
    // Clear memory state but keep the encrypted key in localStorage
    setPrivateKey(null);
    setPublicKey(null);
    setAddress(null);
    setIsAuthenticated(false);

    // Clear session data
    clearSession();
  };

  const logout = () => {
    // Clear memory state
    setPrivateKey(null);
    setPublicKey(null);
    setAddress(null);
    setIsAuthenticated(false);

    // Clear session data
    clearSession();

    // Clear stored encrypted key from localStorage (full logout)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('k_notifications_cursor');
    setHasStoredKeyState(false);
  };

  const hasStoredKey = (): boolean => {
    return hasStoredKeyState;
  };

  const extendSession = () => {
    if (isAuthenticated && privateKey && publicKey && address) {
      saveSession(privateKey, publicKey, address);
    }
  };

  const getSessionTimeRemaining = (): number => {
    const sessionData = getValidSession();
    if (!sessionData) return 0;
    
    const currentTime = Date.now();
    const elapsed = currentTime - sessionData.timestamp;
    const remaining = SESSION_DURATION_MS - elapsed;
    
    return Math.max(0, remaining);
  };

  // Auto-extend session on any user activity and check for expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check for session expiration
    const checkSessionExpiration = () => {
      if (!isSessionValid()) {
        // Session expired, lock the session (don't full logout)
        lockSession();
      }
    };

    // Throttle the session extension to avoid too frequent updates
    let lastExtension = 0;
    const throttledExtendSession = () => {
      const now = Date.now();
      if (now - lastExtension > ACTIVITY_THROTTLE_MS) {
        extendSession();
        lastExtension = now;
      }
    };

    // Listen for any user activity to extend session
    const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, throttledExtendSession, true);
    });

    // Check session expiration every minute
    const expirationCheck = setInterval(checkSessionExpiration, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledExtendSession, true);
      });
      clearInterval(expirationCheck);
    };
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    privateKey,
    publicKey,
    address,
    login,
    logout,
    generateNewKeyPair,
    hasStoredKey,
    unlockSession,
    extendSession,
    getSessionTimeRemaining,
    lockSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};