import { Stack } from 'expo-router';

export default function UploadLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Upload Records', presentation: 'formSheet' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Records' }} />
      <Stack.Screen name="insights" options={{ title: 'AI Insights', headerLeft: () => null, gestureEnabled: false }} />
    </Stack>
  );
}
