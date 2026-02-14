import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useKaspaPostsApi } from "@/hooks/useKaspaPostsApi";

const POLLING_INTERVAL = 30000; // 30 seconds

interface TrendingHashtag {
  hashtag: string;
  usageCount: number;
  rank: number;
}

interface TrendingHashtagsResponse {
  timeWindow: string;
  fromTime: number;
  toTime: number;
  hashtags: TrendingHashtag[];
}

interface HashtagItemProps {
  hashtag: TrendingHashtag;
  onHashtagClick: (hashtag: string) => void;
}

const HashtagItem: React.FC<HashtagItemProps> = ({ hashtag, onHashtagClick }) => {
  return (
    <div
      className="p-4 hover:bg-accent hover:bg-opacity-50 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0"
      onClick={() => onHashtagClick(hashtag.hashtag)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
            <span className="text-primary font-bold text-lg">{hashtag.rank}</span>
          </div>
          <div>
            <p className="font-bold text-foreground text-info">
              #{hashtag.hashtag}
            </p>
            <p className="text-xs text-muted-foreground">
              {hashtag.usageCount} {hashtag.usageCount === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendingHashtagsCard: React.FC = () => {
  const navigate = useNavigate();
  const { apiBaseUrl } = useKaspaPostsApi();

  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to store the latest values to avoid dependency issues in polling
  const apiBaseUrlRef = useRef(apiBaseUrl);

  // Update refs when values change
  apiBaseUrlRef.current = apiBaseUrl;

  const loadTrendingHashtags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeWindow: '7d',
        limit: '10'
      });

      const response = await fetch(`${apiBaseUrlRef.current}/get-trending-hashtags?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trending hashtags: ${response.statusText}`);
      }

      const data: TrendingHashtagsResponse = await response.json();

      setHashtags(data.hashtags || []);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
      setError(error instanceof Error ? error.message : 'Failed to load trending hashtags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load trending hashtags on component mount and when apiBaseUrl changes
  useEffect(() => {
    loadTrendingHashtags();
  }, [apiBaseUrl, loadTrendingHashtags]);

  // Set up polling with stable references
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(async () => {
        try {
          const params = new URLSearchParams({
            timeWindow: '7d',
            limit: '10'
          });

          const response = await fetch(`${apiBaseUrlRef.current}/get-trending-hashtags?${params}`);

          if (!response.ok) {
            throw new Error(`Failed to fetch trending hashtags: ${response.statusText}`);
          }

          const data: TrendingHashtagsResponse = await response.json();

          // Clear error on successful response (connection restored)
          setError(null);

          // Update with fresh data from server
          setHashtags(data.hashtags || []);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending hashtags';
          setError(errorMessage);
          console.error('Error polling trending hashtags:', err);
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [apiBaseUrl]);

  const handleHashtagClick = (hashtag: string) => {
    navigate('/search-contents', {
      state: { initialHashtag: hashtag, timestamp: Date.now() }, // Add timestamp to force state change
      replace: false
    });
  };

  return (
    <div className="w-80 h-screen p-4 bg-background">
      <Card className="border-border gap-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">Trending</h3>
          </div>
          <p className="text-sm text-muted-foreground">Hot topics this week</p>
          {error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {hashtags.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              No trending hashtags
            </div>
          ) : (
            hashtags.map((hashtag) => (
              <HashtagItem
                key={hashtag.hashtag}
                hashtag={hashtag}
                onHashtagClick={handleHashtagClick}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendingHashtagsCard;
