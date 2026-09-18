# React Native Navigation Structure - Hustle

**Created**: 2025-12-13
**Last Updated**: 2025-12-13
**Platform**: React Native + React Navigation v6
**Target**: iOS 14+ | Android 8.0+

---

## Overview

This document defines the complete navigation architecture for the Hustle React Native app using React Navigation v6. The structure supports:
- Workspace-based multi-player profiles
- Activity logging (Practice, Game, Private Training, Skills)
- Subscription-aware routing with plan limits
- Deep linking for push notifications
- Smooth authentication flows

---

## Navigation Architecture

### High-Level Structure

```
Root Stack Navigator (RootStackParamList)
├─ Auth Stack (unauthenticated)
│  ├─ Login
│  ├─ Register
│  └─ ForgotPassword
│
└─ App Stack (authenticated, email verified)
   ├─ Main Tabs (BottomTabParamList)
   │  ├─ Dashboard Tab
   │  ├─ Athletes Tab → Athlete Stack
   │  ├─ Log Game (Modal on Android, Tab on iOS)
   │  ├─ Games Tab → Games Stack
   │  └─ Profile Tab → Settings Stack
   │
   └─ Modal Screens (presented over tabs)
      ├─ AddAthlete
      ├─ EditAthlete
      ├─ LogActivity (Game/Practice/Training/Skills)
      ├─ VerifyGames
      ├─ BillingUpgrade
      └─ WorkspaceInvite

```

---

## TypeScript Navigation Types

### 1. Root Stack (Entry Point)

```typescript
// src/navigation/types.ts

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/**
 * Root Stack Navigator
 * Handles authentication state and email verification
 */
export type RootStackParamList = {
  // Auth flow (unauthenticated users)
  Auth: NavigatorScreenParams<AuthStackParamList>;

  // Email verification required screen
  VerifyEmail: {
    email: string;
  };

  // Main app (authenticated + verified users)
  App: NavigatorScreenParams<AppStackParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Auth Stack Navigator
 * Screens shown to unauthenticated users
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: {
    email?: string; // Pre-fill from waitlist deep link
  };
  ForgotPassword: undefined;
  ResetPassword: {
    oobCode: string; // Firebase action code from email link
  };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;
```

---

### 2. App Stack (Authenticated Users)

```typescript
/**
 * App Stack Navigator
 * Contains main tab navigator and modal screens
 */
export type AppStackParamList = {
  // Main bottom tabs
  MainTabs: NavigatorScreenParams<MainTabsParamList>;

  // Modal screens (presented over tabs)
  AddAthlete: undefined;
  EditAthlete: {
    playerId: string;
  };
  LogActivity: {
    playerId: string;
    activityType?: 'game' | 'practice' | 'training' | 'skills'; // Pre-select activity
  };
  VerifyGames: {
    playerId?: string; // Optional: focus on specific player's games
  };
  BillingUpgrade: {
    source: 'player_limit' | 'game_limit' | 'settings' | 'onboarding';
    currentPlan: 'starter' | 'plus';
    targetPlan?: 'plus' | 'pro';
  };
  WorkspaceInvite: {
    inviteId: string; // From deep link
  };

  // Game details (can navigate from various screens)
  GameDetails: {
    gameId: string;
    playerId: string;
  };
};

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;
```

---

### 3. Main Tabs (Bottom Navigation)

```typescript
/**
 * Main Tab Navigator
 * Bottom tab bar for primary app navigation
 */
export type MainTabsParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  AthletesTab: NavigatorScreenParams<AthletesStackParamList>;
  LogGameTab: undefined; // On Android: opens modal. On iOS: inline tab
  GamesTab: NavigatorScreenParams<GamesStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type MainTabsScreenProps<T extends keyof MainTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabsParamList, T>,
    AppStackScreenProps<keyof AppStackParamList>
  >;
```

---

### 4. Dashboard Stack

```typescript
/**
 * Dashboard Stack Navigator
 * Home screen with stats, quick actions, limit warnings
 */
export type DashboardStackParamList = {
  Dashboard: undefined;
  // Future: could add DashboardFilters, SeasonOverview, etc.
};

export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<DashboardStackParamList, T>,
    MainTabsScreenProps<keyof MainTabsParamList>
  >;
```

---

### 5. Athletes Stack

```typescript
/**
 * Athletes Stack Navigator
 * Athlete list and individual athlete details
 */
export type AthletesStackParamList = {
  AthletesList: undefined;
  AthleteDetails: {
    playerId: string;
  };
  AthleteStats: {
    playerId: string;
    season?: string; // e.g., "2024-2025"
  };
};

export type AthletesStackScreenProps<T extends keyof AthletesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AthletesStackParamList, T>,
    MainTabsScreenProps<keyof MainTabsParamList>
  >;
```

---

### 6. Games Stack

```typescript
/**
 * Games Stack Navigator
 * Game history, filtering, and bulk verification
 */
export type GamesStackParamList = {
  GamesList: {
    playerId?: string; // Optional: filter by player
    status?: 'all' | 'verified' | 'pending';
  };
  GameDetails: {
    gameId: string;
    playerId: string;
  };
};

export type GamesStackScreenProps<T extends keyof GamesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<GamesStackParamList, T>,
    MainTabsScreenProps<keyof MainTabsParamList>
  >;
```

---

### 7. Profile/Settings Stack

```typescript
/**
 * Profile Stack Navigator
 * User account, workspace settings, billing
 */
export type ProfileStackParamList = {
  ProfileHome: undefined;
  AccountSettings: undefined;
  WorkspaceSettings: undefined;
  BillingSettings: undefined;
  NotificationSettings: undefined;
  PinSettings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  ContactSupport: undefined;
  WorkspaceCollaborators: undefined; // Phase 6 Task 6
};

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabsScreenProps<keyof MainTabsParamList>
  >;
```

---

## Navigator Implementation

### Root Navigator (src/navigation/RootNavigator.tsx)

```typescript
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { RootStackParamList } from './types';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import VerifyEmailScreen from '@/screens/auth/VerifyEmailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#18181B" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // User not authenticated
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !user.emailVerified ? (
        // User authenticated but email not verified
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          initialParams={{ email: user.email }}
        />
      ) : (
        // User authenticated and verified
        <Stack.Screen name="App" component={AppNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

---

### Auth Navigator (src/navigation/AuthNavigator.tsx)

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
```

---

### App Navigator (src/navigation/AppNavigator.tsx)

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';

import MainTabsNavigator from './MainTabsNavigator';
import AddAthleteScreen from '@/screens/athletes/AddAthleteScreen';
import EditAthleteScreen from '@/screens/athletes/EditAthleteScreen';
import LogActivityScreen from '@/screens/games/LogActivityScreen';
import VerifyGamesScreen from '@/screens/games/VerifyGamesScreen';
import GameDetailsScreen from '@/screens/games/GameDetailsScreen';
import BillingUpgradeScreen from '@/screens/billing/BillingUpgradeScreen';
import WorkspaceInviteScreen from '@/screens/workspace/WorkspaceInviteScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{ headerShown: false }}
      />

      {/* Modal Screens */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen
          name="AddAthlete"
          component={AddAthleteScreen}
          options={{ title: 'Add Athlete' }}
        />
        <Stack.Screen
          name="EditAthlete"
          component={EditAthleteScreen}
          options={{ title: 'Edit Athlete' }}
        />
        <Stack.Screen
          name="LogActivity"
          component={LogActivityScreen}
          options={{ title: 'Log Activity' }}
        />
        <Stack.Screen
          name="VerifyGames"
          component={VerifyGamesScreen}
          options={{ title: 'Verify Games' }}
        />
        <Stack.Screen
          name="BillingUpgrade"
          component={BillingUpgradeScreen}
          options={{ title: 'Upgrade Plan' }}
        />
        <Stack.Screen
          name="WorkspaceInvite"
          component={WorkspaceInviteScreen}
          options={{ title: 'Workspace Invitation' }}
        />
      </Stack.Group>

      {/* Full-screen modal (not grouped for custom animation) */}
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{
          title: 'Game Details',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}
```

---

### Main Tabs Navigator (src/navigation/MainTabsNavigator.tsx)

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Home, Users, PlusCircle, Calendar, Settings } from 'lucide-react-native';
import type { MainTabsParamList } from './types';

import DashboardStackNavigator from './DashboardStackNavigator';
import AthletesStackNavigator from './AthletesStackNavigator';
import GamesStackNavigator from './GamesStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import LogGameTabScreen from '@/screens/games/LogGameTabScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#18181B', // zinc-900
        tabBarInactiveTintColor: '#71717A', // zinc-500
        tabBarStyle: {
          borderTopColor: '#E4E4E7', // zinc-200
          backgroundColor: '#FFFFFF',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AthletesTab"
        component={AthletesStackNavigator}
        options={{
          tabBarLabel: 'Athletes',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LogGameTab"
        component={LogGameTabScreen}
        options={{
          tabBarLabel: 'Log Game',
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // On Android, open modal instead of inline tab
            if (Platform.OS === 'android') {
              e.preventDefault();
              navigation.navigate('LogActivity', { playerId: '' });
            }
          },
        })}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesStackNavigator}
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

### Stack Navigators (src/navigation/)

```typescript
// DashboardStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from './types';
import DashboardScreen from '@/screens/dashboard/DashboardScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
```

```typescript
// AthletesStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AthletesStackParamList } from './types';

import AthletesListScreen from '@/screens/athletes/AthletesListScreen';
import AthleteDetailsScreen from '@/screens/athletes/AthleteDetailsScreen';
import AthleteStatsScreen from '@/screens/athletes/AthleteStatsScreen';

const Stack = createNativeStackNavigator<AthletesStackParamList>();

export default function AthletesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AthletesList"
        component={AthletesListScreen}
        options={{ title: 'Athletes' }}
      />
      <Stack.Screen
        name="AthleteDetails"
        component={AthleteDetailsScreen}
        options={{ title: 'Athlete Profile' }}
      />
      <Stack.Screen
        name="AthleteStats"
        component={AthleteStatsScreen}
        options={{ title: 'Season Stats' }}
      />
    </Stack.Navigator>
  );
}
```

```typescript
// GamesStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GamesStackParamList } from './types';

import GamesListScreen from '@/screens/games/GamesListScreen';
import GameDetailsScreen from '@/screens/games/GameDetailsScreen';

const Stack = createNativeStackNavigator<GamesStackParamList>();

export default function GamesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GamesList"
        component={GamesListScreen}
        options={{ title: 'Games' }}
      />
      <Stack.Screen
        name="GameDetails"
        component={GameDetailsScreen}
        options={{ title: 'Game Details' }}
      />
    </Stack.Navigator>
  );
}
```

```typescript
// ProfileStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';

import ProfileHomeScreen from '@/screens/profile/ProfileHomeScreen';
import AccountSettingsScreen from '@/screens/profile/AccountSettingsScreen';
import WorkspaceSettingsScreen from '@/screens/profile/WorkspaceSettingsScreen';
import BillingSettingsScreen from '@/screens/profile/BillingSettingsScreen';
import NotificationSettingsScreen from '@/screens/profile/NotificationSettingsScreen';
import PinSettingsScreen from '@/screens/profile/PinSettingsScreen';
import PrivacyPolicyScreen from '@/screens/profile/PrivacyPolicyScreen';
import TermsOfServiceScreen from '@/screens/profile/TermsOfServiceScreen';
import ContactSupportScreen from '@/screens/profile/ContactSupportScreen';
import WorkspaceCollaboratorsScreen from '@/screens/profile/WorkspaceCollaboratorsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHomeScreen}
        options={{ title: 'Profile & Settings' }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: 'Account Settings' }}
      />
      <Stack.Screen
        name="WorkspaceSettings"
        component={WorkspaceSettingsScreen}
        options={{ title: 'Workspace Settings' }}
      />
      <Stack.Screen
        name="BillingSettings"
        component={BillingSettingsScreen}
        options={{ title: 'Billing' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="PinSettings"
        component={PinSettingsScreen}
        options={{ title: 'Verification PIN' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy' }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service' }}
      />
      <Stack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: 'Contact Support' }}
      />
      <Stack.Screen
        name="WorkspaceCollaborators"
        component={WorkspaceCollaboratorsScreen}
        options={{ title: 'Team Members' }}
      />
    </Stack.Navigator>
  );
}
```

---

## Deep Linking Configuration

### Linking Config (src/navigation/linking.ts)

```typescript
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    'hustlestats://', // Custom URL scheme
    'https://hustlestats.io', // Universal links (iOS)
    'https://*.hustlestats.io', // Subdomains
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: {
            path: 'register',
            parse: {
              email: (email: string) => decodeURIComponent(email),
            },
          },
          ForgotPassword: 'forgot-password',
          ResetPassword: {
            path: 'reset-password/:oobCode',
          },
        },
      },
      VerifyEmail: 'verify-email',
      App: {
        screens: {
          MainTabs: {
            screens: {
              DashboardTab: {
                screens: {
                  Dashboard: 'dashboard',
                },
              },
              AthletesTab: {
                screens: {
                  AthletesList: 'athletes',
                  AthleteDetails: 'athletes/:playerId',
                  AthleteStats: 'athletes/:playerId/stats',
                },
              },
              GamesTab: {
                screens: {
                  GamesList: 'games',
                  GameDetails: 'games/:gameId',
                },
              },
              ProfileTab: {
                screens: {
                  ProfileHome: 'profile',
                  AccountSettings: 'profile/account',
                  WorkspaceSettings: 'profile/workspace',
                  BillingSettings: 'profile/billing',
                  NotificationSettings: 'profile/notifications',
                  PinSettings: 'profile/pin',
                  WorkspaceCollaborators: 'profile/collaborators',
                },
              },
            },
          },
          AddAthlete: 'athletes/add',
          EditAthlete: 'athletes/:playerId/edit',
          LogActivity: {
            path: 'log-activity/:playerId',
            parse: {
              activityType: (type: string) => type as 'game' | 'practice' | 'training' | 'skills',
            },
          },
          VerifyGames: 'verify-games',
          BillingUpgrade: 'billing/upgrade',
          WorkspaceInvite: 'workspace/invite/:inviteId',
          GameDetails: 'games/:gameId',
        },
      },
    },
  },
};

/**
 * Deep Link Examples:
 *
 * hustlestats://register?email=user@example.com
 * hustlestats://athletes/abc123
 * hustlestats://athletes/abc123/stats?season=2024-2025
 * hustlestats://log-activity/abc123?activityType=game
 * hustlestats://verify-games?playerId=abc123
 * hustlestats://workspace/invite/def456
 * hustlestats://billing/upgrade?source=player_limit
 * hustlestats://games/xyz789
 */
```

---

## Push Notification Deep Links

### Notification Handler (src/lib/notifications/handler.ts)

```typescript
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';

export type NotificationType =
  | 'trial_reminder'
  | 'game_verified'
  | 'workspace_invite'
  | 'payment_failed'
  | 'subscription_renewed';

export interface NotificationPayload {
  type: NotificationType;
  data?: Record<string, string>;
}

/**
 * Handle notification tap and navigate to appropriate screen
 */
export function handleNotificationTap(
  notification: Notifications.Notification,
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>
) {
  const payload = notification.request.content.data as NotificationPayload;

  if (!navigationRef.current) return;

  switch (payload.type) {
    case 'trial_reminder':
      navigationRef.current.navigate('App', {
        screen: 'BillingUpgrade',
        params: {
          source: 'onboarding',
          currentPlan: 'starter',
        },
      });
      break;

    case 'game_verified':
      if (payload.data?.gameId && payload.data?.playerId) {
        navigationRef.current.navigate('App', {
          screen: 'GameDetails',
          params: {
            gameId: payload.data.gameId,
            playerId: payload.data.playerId,
          },
        });
      }
      break;

    case 'workspace_invite':
      if (payload.data?.inviteId) {
        navigationRef.current.navigate('App', {
          screen: 'WorkspaceInvite',
          params: {
            inviteId: payload.data.inviteId,
          },
        });
      }
      break;

    case 'payment_failed':
    case 'subscription_renewed':
      navigationRef.current.navigate('App', {
        screen: 'MainTabs',
        params: {
          screen: 'ProfileTab',
          params: {
            screen: 'BillingSettings',
          },
        },
      });
      break;

    default:
      // Unknown notification type, navigate to dashboard
      navigationRef.current.navigate('App', {
        screen: 'MainTabs',
        params: {
          screen: 'DashboardTab',
          params: {
            screen: 'Dashboard',
          },
        },
      });
  }
}

/**
 * Setup notification handlers
 */
export function setupNotifications(
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>
) {
  // Handle notification received while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Handle notification tap
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationTap(response.notification, navigationRef);
  });

  return () => subscription.remove();
}
```

---

## Navigation Utilities

### Navigation Helpers (src/navigation/utils.ts)

```typescript
import { CommonActions, StackActions } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Reset navigation to Dashboard (e.g., after logout)
 */
export function resetToDashboard(
  navigation: NavigationContainerRef<RootStackParamList>
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'App',
          state: {
            routes: [
              {
                name: 'MainTabs',
                state: {
                  routes: [{ name: 'DashboardTab' }],
                  index: 0,
                },
              },
            ],
          },
        },
      ],
    })
  );
}

/**
 * Reset navigation to Login (e.g., after logout)
 */
export function resetToLogin(
  navigation: NavigationContainerRef<RootStackParamList>
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
    })
  );
}

/**
 * Navigate to Add Athlete with limit check
 */
export function navigateToAddAthlete(
  navigation: NavigationContainerRef<RootStackParamList>,
  playerCount: number,
  playerLimit: number | null
) {
  if (playerLimit !== null && playerCount >= playerLimit) {
    // Hit player limit, show upgrade screen
    navigation.navigate('App', {
      screen: 'BillingUpgrade',
      params: {
        source: 'player_limit',
        currentPlan: playerLimit === 2 ? 'starter' : 'plus',
        targetPlan: playerLimit === 2 ? 'plus' : 'pro',
      },
    });
  } else {
    // Can add athlete
    navigation.navigate('App', {
      screen: 'AddAthlete',
    });
  }
}

/**
 * Navigate to Log Activity with limit check
 */
export function navigateToLogActivity(
  navigation: NavigationContainerRef<RootStackParamList>,
  playerId: string,
  gamesThisMonth: number,
  gamesLimit: number | null
) {
  if (gamesLimit !== null && gamesThisMonth >= gamesLimit) {
    // Hit games limit, show upgrade screen
    navigation.navigate('App', {
      screen: 'BillingUpgrade',
      params: {
        source: 'game_limit',
        currentPlan: gamesLimit === 10 ? 'starter' : 'plus',
        targetPlan: gamesLimit === 10 ? 'plus' : 'pro',
      },
    });
  } else {
    // Can log game
    navigation.navigate('App', {
      screen: 'LogActivity',
      params: { playerId },
    });
  }
}
```

---

## Screen Naming Convention

All screen components follow this pattern:

```
src/screens/
├── auth/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── ResetPasswordScreen.tsx
│   └── VerifyEmailScreen.tsx
├── dashboard/
│   └── DashboardScreen.tsx
├── athletes/
│   ├── AthletesListScreen.tsx
│   ├── AthleteDetailsScreen.tsx
│   ├── AthleteStatsScreen.tsx
│   ├── AddAthleteScreen.tsx
│   └── EditAthleteScreen.tsx
├── games/
│   ├── GamesListScreen.tsx
│   ├── GameDetailsScreen.tsx
│   ├── LogActivityScreen.tsx
│   ├── LogGameTabScreen.tsx
│   └── VerifyGamesScreen.tsx
├── billing/
│   └── BillingUpgradeScreen.tsx
├── workspace/
│   └── WorkspaceInviteScreen.tsx
└── profile/
    ├── ProfileHomeScreen.tsx
    ├── AccountSettingsScreen.tsx
    ├── WorkspaceSettingsScreen.tsx
    ├── BillingSettingsScreen.tsx
    ├── NotificationSettingsScreen.tsx
    ├── PinSettingsScreen.tsx
    ├── PrivacyPolicyScreen.tsx
    ├── TermsOfServiceScreen.tsx
    ├── ContactSupportScreen.tsx
    └── WorkspaceCollaboratorsScreen.tsx
```

---

## Platform-Specific Considerations

### iOS Specifics

1. **Safe Area Insets**: All screens must respect `SafeAreaView` for notch/home indicator
2. **Navigation Bar**: Use native iOS navigation bar styling (large titles on list screens)
3. **Swipe Back Gesture**: Enabled by default on all stack navigators
4. **Modal Presentation**: Use `presentation: 'formSheet'` for upgrade screens on iPad

### Android Specifics

1. **Status Bar**: Configure `StatusBar` component per screen (dark/light content)
2. **Hardware Back Button**: Custom back handlers for verification flows (prevent accidental exit)
3. **Material Design**: Use Material-themed tab bar icons and transitions
4. **Deep Links**: Configure `android:autoVerify="true"` for App Links

---

## Navigation Performance

### Optimization Strategies

1. **Lazy Loading**: Use `React.lazy()` for heavy screens (Analytics, Billing)
2. **Memoization**: Wrap navigator components with `React.memo()`
3. **Freeze on Blur**: Enable `freezeOnBlur` for screens with heavy animations
4. **Preload Data**: Prefetch athlete/game data on tab focus

```typescript
// Example: Lazy load Analytics screen
const AthleteStatsScreen = React.lazy(() => import('@/screens/athletes/AthleteStatsScreen'));

<Stack.Screen
  name="AthleteStats"
  component={AthleteStatsScreen}
  options={{
    freezeOnBlur: true, // Freeze screen when navigating away
  }}
/>
```

---

## Testing Navigation

### Unit Tests (Vitest + React Navigation Testing Library)

```typescript
// src/navigation/__tests__/RootNavigator.test.tsx
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../RootNavigator';

jest.mock('@/lib/firebase/config', () => ({
  auth: { currentUser: null },
}));

describe('RootNavigator', () => {
  it('shows Login screen when user is not authenticated', () => {
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText(/Sign In/i)).toBeTruthy();
  });
});
```

### E2E Tests (Detox)

```typescript
// e2e/navigation.e2e.ts
describe('Navigation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should navigate from Dashboard to Add Athlete', async () => {
    await element(by.id('dashboard-add-athlete-button')).tap();
    await expect(element(by.text('Add Athlete'))).toBeVisible();
  });

  it('should navigate from Athletes tab to Athlete Details', async () => {
    await element(by.id('tab-athletes')).tap();
    await element(by.id('athlete-item-0')).tap();
    await expect(element(by.text('Athlete Profile'))).toBeVisible();
  });
});
```

---

## Future Enhancements

### Phase 2 Additions

1. **Onboarding Flow**: Add `OnboardingStack` after registration
2. **Offline Support**: Add "Offline" badge in tab bar when network unavailable
3. **Multi-Workspace Switcher**: Add workspace picker in profile
4. **Advanced Analytics**: Add Analytics tab with Charts library

### Phase 3 Additions

1. **Video Upload**: Add Camera/Gallery integration in `LogActivity`
2. **Social Features**: Add `SocialTab` with team sharing
3. **Achievements**: Add `AchievementsScreen` in Profile stack
4. **Coach Portal**: Separate `CoachNavigator` with team management

---

## Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "expo-notifications": "~0.25.0",
    "expo-linking": "~6.0.0",
    "lucide-react-native": "^0.344.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.2",
    "detox": "^20.14.8"
  }
}
```

---

## File Structure Summary

```
src/
├── navigation/
│   ├── types.ts                     # TypeScript param lists
│   ├── linking.ts                   # Deep linking config
│   ├── utils.ts                     # Navigation helpers
│   ├── RootNavigator.tsx            # Root entry point
│   ├── AuthNavigator.tsx            # Auth stack
│   ├── AppNavigator.tsx             # App stack
│   ├── MainTabsNavigator.tsx        # Bottom tabs
│   ├── DashboardStackNavigator.tsx  # Dashboard stack
│   ├── AthletesStackNavigator.tsx   # Athletes stack
│   ├── GamesStackNavigator.tsx      # Games stack
│   ├── ProfileStackNavigator.tsx    # Profile stack
│   └── __tests__/
│       └── RootNavigator.test.tsx
├── screens/
│   └── [organized by feature]
└── lib/
    └── notifications/
        └── handler.ts               # Push notification routing
```

---

**End of Document**

---

**Created**: 2025-12-13
**Last Updated**: 2025-12-13
