import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.journey.app',
  appName: 'Journey',
  webDir: 'public',
  server: {
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
