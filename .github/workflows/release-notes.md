### Release notes
- ⚠️ **IMPORTANT: This release is configured by default to work on Kaspa MAINNET**
- This release uses **real KAS coins**. Please be aware that any transactions will involve actual cryptocurrency. Make sure you understand the implications before using this version
- This release requires K-indexer 0.1.14

### New features
- Added following/followers/blocked count in "Profile" page
- Added access to "Following/Followers" page in "Profile" page and "User" page; removed "Followed" page
- Moved access to "Blocked users" page from left sidebar to "Profile" page
- Added total number of users in "Users" page
- Added "Follow" button in "Users" page
- Added "Search user" in "Users" page
- Cleaned all users lists by removing timestamp (useless)
- Added back button on all pages

### Fixed bugs
- Address visualization on "User's details" dialog, when opened from "Notifications" page
- Quoted content truncation in posts (now limited to 250 characters)
- Closing RPC connection to Kaspa node after every single interaction