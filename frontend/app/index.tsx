import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to splash
    router.replace('/splash');
  }, []);

  return null;
}
