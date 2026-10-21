import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happytext.reader',
  appName: 'HappyText',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
