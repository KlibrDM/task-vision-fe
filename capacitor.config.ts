import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.patrickcc.taskvision',
  appName: 'Task Vision',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
