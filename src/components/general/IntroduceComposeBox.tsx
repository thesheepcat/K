import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useKaspaTransactions } from '@/hooks/useKaspaTransactions';
import EmojiPickerButton from '@/components/ui/emoji-picker';
import { Base64 } from 'js-base64';

interface IntroduceComposeBoxProps {
  onPost: (content: string) => void;
}

const MAX_CHARACTERS = 100;
const MAX_NICKNAME_CHARACTERS = 20;

const IntroduceComposeBox: React.FC<IntroduceComposeBoxProps> = ({ onPost }) => {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed
  const { privateKey } = useAuth();
  const { sendTransaction } = useKaspaTransactions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
      
      toast.success('Profile image uploaded successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image. Please try again.');
    }
  }, [processImage]);

  const removeImage = useCallback(() => {
    setProfileImage(null);
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
      setProfileImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [profileImagePreview]);

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

  const handlePost = async () => {
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
        // k:1:broadcast:sender_pubkey:sender_signature:base64_encoded_nickname:base64_encoded_profile_image:base64_encoded_message:
        const payloadData = `${encodedNickname}:${encodedProfileImage}:${encodedMessage}`;
        
        // Send broadcast transaction with extended payload
        const result = await sendTransaction({
          privateKey: privateKey,
          userMessage: payloadData, // This will be signed and included in the broadcast
          type: 'broadcast'
        });

        // Show success toast with transaction details
        if (result) {
          toast.success("Introduction posted successfully!", {
            description: (
              <div className="space-y-1">
                <div>Transaction ID: {result.id}</div>
                <div>Fees: {result.feeAmount.toString()} sompi</div>
                <div>Fees: {result.feeKAS} KAS</div>
              </div>
            ),
            duration: 5000,
          });
          
          // Only clear content and call parent handler after successful transaction
          onPost(content);
          setNickname('');
          setContent('');
          removeImage();
        }
      } catch (error) {
        console.error('Error submitting introduction:', error);
        toast.error("An error occurred when sending transaction", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const charactersRemaining = MAX_CHARACTERS - content.length;
  const nicknameCharactersRemaining = MAX_NICKNAME_CHARACTERS - nickname.length;
  const isOverLimit = charactersRemaining < 0 || nicknameCharactersRemaining < 0;

  return (
    <Card className="border-l-0 border-r-0 border-t-0 border-b border-gray-200 bg-white rounded-none gap-0">
      <CardHeader className="p-3 sm:p-4 pb-1 flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Introduce Yourself</h3>
          <p className="text-sm text-gray-600">Share your nickname, profile image, and a message with the network</p>         
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="p-3 sm:p-4 pt-2">
        <div className="space-y-0">
          {/* Nickname Input */}
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium text-gray-700">
                Nickname <span className="text-red-500">*</span>
              </label>
            <Input
                id="nickname"
                placeholder="Enter your nickname (max 20 characters)..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="rounded-none border-gray-300 focus:border-gray-500"
                maxLength={MAX_NICKNAME_CHARACTERS + 5}
              />
              <div className="flex justify-between items-center">
                <span className={`text-xs ${
                  nicknameCharactersRemaining < 0 ? 'text-red-500' : 
                  nicknameCharactersRemaining <= 5 ? 'text-orange-500' : 'text-gray-500'
                }`}>
                  {nicknameCharactersRemaining} characters remaining
                </span>
                {nicknameCharactersRemaining < 0 && (
                  <span className="text-xs text-red-500">Character limit exceeded</span>
                )}
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="py-4">
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
            <div className="flex space-x-2 sm:space-x-3">
                {/* 
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-none flex-shrink-0">
                  <AvatarImage src={userAvatar} />
                  <AvatarFallback className="bg-gray-200 text-gray-700 rounded-none text-xs sm:text-sm">You</AvatarFallback>
                </Avatar>
                */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-2">
                    <Textarea
                      ref={textareaRef}
                      id="message"
                      placeholder="Share your message with the network (max 100 characters)..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 min-h-10 sm:min-h-12 border-gray-300 resize-none text-sm sm:text-base placeholder-gray-500 focus:outline-none rounded-none"
                      maxLength={MAX_CHARACTERS + 10}
                    />
                    <EmojiPickerButton onEmojiSelect={handleEmojiSelect} className="mt-1" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${
                      charactersRemaining < 0 ? 'text-red-500' : 
                      charactersRemaining <= 20 ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      {charactersRemaining} characters remaining
                    </span>
                    {charactersRemaining < 0 && (
                      <span className="text-xs text-red-500">Character limit exceeded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Profile Image <span className="text-gray-500">(optional)</span>
              </label>
            <div className="flex items-center space-x-4">
                {profileImagePreview ? (
                  <div className="relative">
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-12 h-12 object-cover border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex gap-2 justify-center">
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
                    className="rounded-none border-gray-300 hover:bg-gray-300"
                  >
                    {profileImagePreview ? 'Change Image' : 'Upload Image'}
                  </Button>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <p>PNG, JPEG, or BMP • Max 5MB • Will be resized to 48x48px</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handlePost}
              disabled={!nickname.trim() || !content.trim() || isSubmitting || isOverLimit}
              className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 px-6 py-2 font-bold rounded-none hover:rounded-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400" />
                  Introducing...
                </>
              ) : (
                'Introduce Yourself'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
};

export default IntroduceComposeBox;