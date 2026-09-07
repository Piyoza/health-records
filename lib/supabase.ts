import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

declare const process: {
  env: Record<string, string | undefined>;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log(
  'SUPABASE URL:',
  supabaseUrl
);

console.log(
  'SUPABASE KEY EXISTS:',
  !!supabaseAnonKey
);

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is missing'
  );
}

if (
  !supabaseUrl.startsWith('https://') &&
  !supabaseUrl.startsWith('http://')
) {
  throw new Error(
    `Invalid Supabase URL format: ${supabaseUrl}`
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing'
  );
}

// Supabase's auth client hangs on web when AsyncStorage is used directly.
// Use localStorage on web and AsyncStorage on native.
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => {
          if (
            typeof localStorage ===
            'undefined'
          ) {
            return Promise.resolve(null);
          }

          return Promise.resolve(
            localStorage.getItem(key)
          );
        },

        setItem: (
          key: string,
          value: string
        ) => {
          if (
            typeof localStorage ===
            'undefined'
          ) {
            return Promise.resolve();
          }

          localStorage.setItem(
            key,
            value
          );

          return Promise.resolve();
        },

        removeItem: (key: string) => {
          if (
            typeof localStorage ===
            'undefined'
          ) {
            return Promise.resolve();
          }

          localStorage.removeItem(key);

          return Promise.resolve();
        },
      }
    : AsyncStorage;

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,

        // Required so Supabase can process
        // the password-recovery URL on web.
        detectSessionInUrl: true,
      },
    }
  );