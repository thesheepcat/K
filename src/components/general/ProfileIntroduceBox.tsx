import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, User } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import { useKaspaPostsApi } from '@/hooks/useKaspaPostsApi';
import EmojiPickerButton from '@/components/ui/emoji-picker';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { Base64 } from 'js-base64';

const MAX_CHARACTERS = 100;
const MAX_NICKNAME_CHARACTERS = 20;

const ProfileIntroduceBox: React.FC = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [originalData, setOriginalData] = useState<{
    nickname: string;
    content: string;
    profileImage: string | null;
    profileImagePreview: string | null;
  }>({ nickname: '', content: '', profileImage: null, profileImagePreview: null });
  const { privateKey, publicKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const { fetchUserDetails } = useKaspaPostsApi();
  const { showSuccessNotifications } = useUserSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to load user profile data
  const loadUserProfile = useCallback(async (showLoadingSpinner: boolean = true) => {
    if (!publicKey) return;

    if (showLoadingSpinner) {
      setIsLoading(true);
    }
    try {
      const userDetails = await fetchUserDetails(publicKey, publicKey);

      let loadedNickname = '';
      let loadedContent = '';
      let loadedProfileImage: string | null = null;
      let loadedProfileImagePreview: string | null = null;

      if (userDetails && (userDetails.userNickname || userDetails.postContent || userDetails.userProfileImage)) {
        setHasExistingData(true);

        // Decode Base64 data
        if (userDetails.userNickname) {
          loadedNickname = Base64.decode(userDetails.userNickname);
        }
        if (userDetails.postContent) {
          loadedContent = Base64.decode(userDetails.postContent);
        }
        if (userDetails.userProfileImage) {
          loadedProfileImage = userDetails.userProfileImage;
          loadedProfileImagePreview = `data:image/png;base64,${userDetails.userProfileImage}`;
        }
      } else {
        // No data exists - keep fields empty
        setHasExistingData(false);
      }

      // Update followers/following/blocked counts
      if (userDetails) {
        setFollowersCount(userDetails.followersCount || 0);
        setFollowingCount(userDetails.followingCount || 0);
        setBlockedCount(userDetails.blockedCount || 0);
      }

      // Set current state (either with loaded data or empty)
      setNickname(loadedNickname);
      setContent(loadedContent);
      setProfileImage(loadedProfileImage);
      setProfileImagePreview(loadedProfileImagePreview);

      // Store original data for cancel functionality
      setOriginalData({
        nickname: loadedNickname,
        content: loadedContent,
        profileImage: loadedProfileImage,
        profileImagePreview: loadedProfileImagePreview
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      // On error, just keep empty data
      setHasExistingData(false);
      setNickname('');
      setContent('');
      setProfileImage(null);
      setProfileImagePreview(null);
      setOriginalData({
        nickname: '',
        content: '',
        profileImage: null,
        profileImagePreview: null
      });
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false);
      }
    }
  }, [publicKey, fetchUserDetails]);

  // Load existing user profile data on mount
  useEffect(() => {
    loadUserProfile(true);
  }, [loadUserProfile]);

  // Polling effect: refresh data every 5 seconds when not in editing mode
  useEffect(() => {
    if (isEditing) {
      return; // Don't poll when editing
    }

    const pollInterval = setInterval(() => {
      loadUserProfile(false); // Poll without showing loading spinner
    }, 5000); // 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [isEditing, loadUserProfile]);

  // Image processing function
  const processImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not supported'));
        return;
      }

      img.onload = () => {
        // Set canvas size to 48x48
        canvas.width = 48;
        canvas.height = 48;

        // Calculate crop dimensions to maintain aspect ratio
        const minDimension = Math.min(img.width, img.height);
        const cropX = (img.width - minDimension) / 2;
        const cropY = (img.height - minDimension) / 2;

        // Draw the image cropped and resized to 48x48
        ctx.drawImage(
          img,
          cropX, cropY, minDimension, minDimension,
          0, 0, 48, 48
        );

        // Convert to base64 (PNG format)
        const base64 = canvas.toDataURL('image/png');
        const base64Data = base64.split(',')[1]; // Remove data:image/png;base64, prefix
        resolve(base64Data);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Please select PNG, JPEG, or BMP image.');
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file is too large. Please select a file smaller than 5MB.');
      return;
    }

    try {
      const processedBase64 = await processImage(file);
      setProfileImage(processedBase64);

      // Create preview URL
      const previewUrl = `data:image/png;base64,${processedBase64}`;
      setProfileImagePreview(previewUrl);

      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try again.');
    }
  }, [processImage]);

  const removeImage = useCallback(() => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);

      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!nickname.trim()) {
      toast.error('Nickname is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Message is required');
      return;
    }
    if (nickname.length > MAX_NICKNAME_CHARACTERS) {
      toast.error(`Nickname must be ${MAX_NICKNAME_CHARACTERS} characters or less`);
      return;
    }
    if (content.length > MAX_CHARACTERS) {
      toast.error(`Message must be ${MAX_CHARACTERS} characters or less`);
      return;
    }

    // Validate nickname format (no emojis)
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    if (emojiRegex.test(nickname)) {
      toast.error('Nickname cannot contain emojis');
      return;
    }

    if (privateKey && !isSubmitting) {
      try {
        setIsSubmitting(true);

        // Encode data to Base64
        const encodedNickname = Base64.encode(nickname);
        const encodedProfileImage = profileImage || '';
        const encodedMessage = Base64.encode(content);

        // Create payload according to protocol specification
        const payloadData = `${encodedNickname}:${encodedProfileImage}:${encodedMessage}`;

        // Send broadcast transaction with extended payload
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: payloadData,
          type: 'broadcast'
        });

        // Show success toast with transaction details
        if (result) {
          if (showSuccessNotifications) {
            toast.success(hasExistingData ? "Profile updated successfully!" : "Profile created successfully!", {
              description: (
                <div className="space-y-1">
                  <div>Transaction ID: {result.id}</div>
                  <div>Fees: {result.feeAmount.toString()} sompi</div>
                  <div>Fees: {result.feeKAS} KAS</div>
                </div>
              ),
              duration: 5000,
            });
          }

          // Update original data with the newly saved data
          setOriginalData({
            nickname,
            content,
            profileImage,
            profileImagePreview
          });

          setHasExistingData(true);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error submitting profile:', error);
        toast.error("An error occurred when sending transaction", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    // Restore the original data (whether it exists or is empty)
    setNickname(originalData.nickname);
    setContent(originalData.content);
    setProfileImage(originalData.profileImage);
    setProfileImagePreview(originalData.profileImagePreview);
    setIsEditing(false);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const charactersRemaining = MAX_CHARACTERS - content.length;
  const nicknameCharactersRemaining = MAX_NICKNAME_CHARACTERS - nickname.length;
  const isOverLimit = charactersRemaining < 0 || nicknameCharactersRemaining < 0;

  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            {!isEditing && !isLoading && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
              >
                Edit
              </Button>
            )}
          </div>

          {!isEditing ? (
            // Display mode
            <div className="space-y-4">
              {/* Image section - always show with placeholder if loading */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Image
                </label>
                <div className="flex items-center space-x-3">
                  {isLoading ? (
                    <div className="relative w-12 h-12 bg-muted border border-border">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                      </div>
                    </div>
                  ) : profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-12 h-12 object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted border border-border"></div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Nickname
                </label>
                {isLoading ? (
                  <div className="relative">
                    <Input
                      value=""
                      readOnly
                      className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={nickname}
                    readOnly
                    placeholder="No nickname set"
                    className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Message
                </label>
                {isLoading ? (
                  <div className="relative">
                    <Textarea
                      value=""
                      readOnly
                      className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0 resize-none"
                      rows={3}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={content}
                    readOnly
                    placeholder="No message set"
                    className="text-sm bg-muted border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0 resize-none"
                    rows={3}
                  />
                )}
              </div>

              {/* Followers, Following, and Blocked Counters */}
              <div className="flex gap-4 text-sm pt-2">
                <div className="flex gap-1 items-baseline">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                  ) : (
                    <span className="font-semibold text-foreground">{followingCount}</span>
                  )}
                  <span
                    className="text-muted-foreground cursor-pointer hover:underline"
                    onClick={() => navigate('/users-following')}
                  >
                    Following
                  </span>
                </div>
                <div className="flex gap-1 items-baseline">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                  ) : (
                    <span className="font-semibold text-foreground">{followersCount}</span>
                  )}
                  <span
                    className="text-muted-foreground cursor-pointer hover:underline"
                    onClick={() => navigate('/users-followers')}
                  >
                    Followers
                  </span>
                </div>
                <div className="flex gap-1 items-baseline">
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle" style={{borderColor: 'hsl(var(--muted-foreground))'}}></div>
                  ) : (
                    <span className="font-semibold text-foreground">{blockedCount}</span>
                  )}
                  <span
                    className="text-muted-foreground cursor-pointer hover:underline"
                    onClick={() => navigate('/users-blocked')}
                  >
                    Blocked
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Edit mode
            <div className="space-y-4">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Image <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="flex items-center space-x-4">
                  {profileImagePreview ? (
                    <div className="relative">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-12 h-12 object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 border-2 border-dashed border-border flex items-center justify-center bg-muted">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/bmp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profileImagePreview ? 'Change Image' : 'Upload Image'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPEG, or BMP • Max 5MB • Will be resized to 48x48px
                    </p>
                  </div>
                </div>
              </div>

              {/* Nickname Input */}
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium text-muted-foreground">
                  Nickname <span className="text-destructive">*</span>
                </label>
                <Input
                  id="nickname"
                  placeholder="Enter your nickname (max 20 characters)..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-sm border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                  maxLength={MAX_NICKNAME_CHARACTERS + 5}
                />
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${
                    nicknameCharactersRemaining < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {nicknameCharactersRemaining} characters remaining
                  </span>
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-muted-foreground">
                  Message <span className="text-destructive">*</span>
                </label>
                <div className="flex items-start space-x-2">
                  <Textarea
                    ref={textareaRef}
                    id="message"
                    placeholder="Share your message (max 100 characters)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 text-sm resize-none border-input-thin focus-visible:border-input-thin-focus focus-visible:ring-0"
                    maxLength={MAX_CHARACTERS + 10}
                    rows={3}
                  />
                  <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${
                    charactersRemaining < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {charactersRemaining} characters remaining
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!nickname.trim() || !content.trim() || isSubmitting || isOverLimit}
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-transparent rounded-full animate-loader-circle-white mr-2"></div>
                  )}
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileIntroduceBox;
