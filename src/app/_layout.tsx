import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/AppTabs';
import { ErrorBoundary } from '@/components/error-boundary';
import * as Database from '@/database';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

type DatabaseState = 'loading' | 'ready' | 'error';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [dbState, setDbState] = useState<DatabaseState>('loading');

  useEffect(() => {
    let active = true;
    Database.createTables()
      .then(() => {
        if (active) setDbState('ready');
      })
      .catch((err) => {
        console.error('Error initializing database:', err);
        if (active) setDbState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="auto" />
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <ErrorBoundary>
            <AnimatedSplashOverlay />
            {dbState === 'error' && <DatabaseErrorScreen />}
            {dbState === 'ready' && (
              <Suspense fallback={null}>
                <AppTabs />
              </Suspense>
            )}
          </ErrorBoundary>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function DatabaseErrorScreen() {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>No se pudo inicializar la base de datos</Text>
      <Text style={styles.errorMessage}>
        Reinicia la aplicación. Si el problema persiste, revisa el espacio de almacenamiento del
        dispositivo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4a5568',
  },
});
