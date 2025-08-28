import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.academia.app',
    appName: 'AcademIA',
    webDir: 'dist',
    plugins: {
        LiveUpdates: {
            appId: '60f83a8a',
            channel: 'Production',
            autoUpdateMethod: 'background',
        },
    },
};

export default config;