/**
 * Electron Main Process for K Application
 *
 * SECURITY CONFIGURATION NOTES:
 * This app is configured with permissive security settings to allow connections
 * to both secure (HTTPS) and insecure (HTTP) servers.
 *
 * Key Security Configurations:
 *
 * 1. WEB SECURITY (webPreferences):
 *    - webSecurity: false
 *      Disables web security to allow mixed content (HTTP/HTTPS on same page)
 *      Allows connecting to insecure HTTP servers like http://123.123.123.123:3001
 *
 *    - allowRunningInsecureContent: true
 *      Permits loading and running insecure (HTTP) content within HTTPS pages
 *
 * 2. CONTENT SECURITY POLICY (CSP):
 *    - Configured via onHeadersReceived hook (see below)
 *    - Permissive policy: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:;"
 *    - Allows connections to any HTTP/HTTPS endpoint, WebSocket connections, and inline scripts
 *
 * 3. CERTIFICATE VALIDATION:
 *    - app.commandLine.appendSwitch('ignore-certificate-errors')
 *      Bypasses SSL certificate validation (allows self-signed certificates)
 *
 *    - app.commandLine.appendSwitch('allow-insecure-localhost', 'true')
 *      Specifically allows insecure localhost connections
 *
 * 4. DEVELOPMENT vs PRODUCTION MODE:
 *    - Development: Connects to Vite dev server (http://localhost:5173) + opens DevTools
 *      To use: Set NODE_ENV=development and run: npm run electron:dev
 *
 *    - Production: Loads built files from dist/index.html
 *      To build: npm run electron:build (creates .deb and AppImage for Linux)
 *
 * IMPORTANT: These permissive settings are necessary for this app's requirements
 * but should be reviewed if security requirements change.
 */

const { app, BrowserWindow, session, nativeImage } = require('electron');
const path = require('path');

let mainWindow;

//frame: false, // Hide the top bar (title bar and menu) 
function createWindow() {
  const iconPath = path.join(__dirname, '../public/pwa-512x512.png');
  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width:  1728,
    height: 972,
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // [SECURITY CONFIG 1] Disable web security for HTTP/HTTPS mixed content
      webSecurity: false,
      // [SECURITY CONFIG 1] Allow insecure content to run
      allowRunningInsecureContent: true,
      // Enable persistent storage for localStorage/sessionStorage
      partition: 'persist:k-app',
    },
    icon: icon,
  });

  // [SECURITY CONFIG 1] Configure session to allow mixed content
  // This intercepts outgoing requests and passes headers through unchanged
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  // [SECURITY CONFIG 2] Set permissive CSP to allow HTTP and HTTPS connections
  // This intercepts incoming responses and injects a permissive Content-Security-Policy
  // The policy allows: all sources (*), inline scripts/styles, eval, data URIs,
  // blob URIs, WebSocket connections (ws/wss), and both http/https protocols
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:;"
        ]
      }
    });
  });

  // [SECURITY CONFIG 4] Load the app based on environment
  // Development mode: connects to Vite dev server with hot reload
  // Production mode: loads static files from the build output
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Auto-open DevTools in dev mode
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Enable DevTools in production via Ctrl+Shift+I or F12
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// [SECURITY CONFIG 3] Certificate and localhost security bypasses
// These command-line switches must be set before the app is ready

// Ignore all certificate errors (including self-signed certificates)
// This allows the app to connect to servers with invalid/expired SSL certificates
app.commandLine.appendSwitch('ignore-certificate-errors');

// Allow insecure connections to localhost
// Useful for connecting to local development servers without HTTPS
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
