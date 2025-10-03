import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.k.app',
  appName: 'K',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
