import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';

/** Route-level error boundary. Deliberately theme-free (it may render above the providers). */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps): ReactNode {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#F2F5F3' }} testID="error-boundary">
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#B3261E' }}>Something went wrong</Text>
      <Text selectable style={{ fontSize: 13, color: '#10201A' }}>{String(error?.message ?? error)}</Text>
      <Pressable accessibilityRole="button" onPress={() => void retry()} style={{ minHeight: 44, borderRadius: 12, backgroundColor: '#0B6B3A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try again</Text>
      </Pressable>
    </View>
  );
}
