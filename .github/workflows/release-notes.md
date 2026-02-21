### Release notes
- ⚠️ **IMPORTANT: This release is configured by default to work on Kaspa MAINNET**
- This release uses **real KAS coins**. Please be aware that any transactions will involve actual cryptocurrency. Make sure you understand the implications before using this version
- This release requires K-indexer 0.1.18

### New features
- **Transaction notifications setting** - New option in Settings > Appearance to show or hide success notifications on transactions. Error notifications are always shown.
- **External image rendering** - Posts now automatically display images from external URLs. 
  - Supported formats: PNG, JPEG, JPG, GIF, WebP, BMP, SVG, ICO, and AVIF. 
- **YouTube video embedding** - Full support for YouTube videos and Shorts with click-to-play interface. 
  - Compatible formats:
    - Standard videos: `youtube.com/watch?v=VIDEO_ID`
    - YouTube Shorts: `youtube.com/shorts/VIDEO_ID`
    - Short links: `youtu.be/VIDEO_ID`
    - Live streams: `youtube.com/live/VIDEO_ID`
    - Embed links: `youtube.com/embed/VIDEO_ID`
    - Timestamp support: `?t=` and `&t=` parameters preserved
    - Music links: `music.youtube.com` URLs supported
- **External video file rendering** - Posts now automatically display inline video players for direct video file URLs. 
  - Supported formats: MP4, WebM, MOV, and OGG.
- **Animated GIF embeds (Giphy & Tenor)** - Posts containing Giphy or Tenor URLs now render animated GIFs inline. 
  - Supported URL formats:
    - Giphy page links: `giphy.com/gifs/{slug}-{id}`
    - Giphy direct media: `media.giphy.com/media/{id}/video.gif`, `i.giphy.com/...`
    - Tenor direct media: `media.tenor.com/video.gif`
    - Other general GIF direct links `media.mywebsite.com/video.gif`
- **Video rendering settings** - New option in Settings > Appearance to control video rendering behavior:
  - **Click to reveal**: Videos initially show as placeholder requiring user action to reveal
  - **Automatic**: Videos are automatically shown to the user  

### Fixed bugs
- Ordering on "Most active users" card
- Long URLs/words no longer overflow the compose box horizontally