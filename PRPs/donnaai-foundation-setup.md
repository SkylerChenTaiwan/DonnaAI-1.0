name: "DonnaAI Foundation Setup - Expo + Firebase + Auth"
description: |

## Purpose
Set up the foundational infrastructure for DonnaAI business AI assistant platform, including Expo project initialization, Firebase configuration, and tree-based authentication system.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Create a production-ready foundation for DonnaAI with Expo + React Native + TypeScript + Firebase, including:
- Cross-platform app (iOS/Android/Web) with Expo
- Firebase backend services (Auth, Firestore, Storage, Functions)
- Tree-based hierarchical permission system
- Notion-style UI with NativeBase
- TypeScript for type safety
- Zustand for state management with Firestore real-time sync

## Why
- **Business value**: Enable sales teams to focus on communication/strategy instead of admin work
- **User impact**: Reduce administrative burden by 70% for 200+ initial users
- **Integration**: Foundation for AI meeting recording, analytics dashboard, business tools
- **Problems solved**: Manual data entry, complex reporting, scattered business tools

## What
A cross-platform business app with:
- Secure authentication with role-based access (salesperson/manager/admin)
- Tree-structured organization permissions
- Real-time data synchronization
- Offline-first architecture
- Notion-inspired clean UI

### Success Criteria
- [ ] Expo project runs on iOS/Android/Web
- [ ] Firebase Auth working with email/password
- [ ] Firestore connected with Security Rules
- [ ] Tree-based permissions system functional
- [ ] Notion-style UI theme applied
- [ ] TypeScript strict mode with no errors
- [ ] Basic navigation structure in place

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://docs.expo.dev/get-started/create-a-new-app/
  why: Official Expo setup guide with TypeScript template
  
- url: https://docs.expo.dev/guides/using-firebase/
  why: Firebase integration with Expo - critical for web compatibility
  
- url: https://firebase.google.com/docs/firestore/security/rules-structure
  why: Security rules for tree-based permissions
  
- url: https://docs.nativebase.io/setup-provider
  why: NativeBase setup and theming for Notion-style UI
  
- url: https://github.com/pmndrs/zustand
  why: State management setup and Firebase integration patterns
  
- url: https://reactnavigation.org/docs/getting-started
  why: Navigation structure for multi-platform app

- docfile: ARCHITECTURE.md
  why: Complete technical architecture and folder structure

- docfile: INITIAL.md
  why: Feature requirements and business logic
```

### Current Codebase Structure
```bash
DonnaAI-1.0/
├── ARCHITECTURE.md      # Technical specifications
├── CLAUDE.md           # AI development guidelines  
├── INITIAL.md          # Project requirements
├── TASK.md             # Task tracking
├── PRPs/               # Product requirement prompts
└── use-cases/          # Example implementations
```

### Desired Codebase Structure
```bash
DonnaAI-1.0/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Layout, LoadingSpinner, ErrorBoundary
│   │   └── auth/       # LoginForm, RoleSelector
│   ├── screens/        # Screen components
│   │   ├── auth/       # LoginScreen, RegisterScreen
│   │   └── dashboard/  # SalespersonDashboard, ManagerDashboard
│   ├── services/       # External service integrations
│   │   ├── firebase/   # config.ts, auth.ts, firestore.ts
│   │   └── api/        # API abstraction layer
│   ├── stores/         # Zustand stores
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   ├── types/          # TypeScript type definitions
│   │   ├── user.ts     # User, Role, Organization types
│   │   └── firebase.ts # Firestore document types
│   ├── navigation/     # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── theme/          # Notion-style theming
│   │   └── index.ts
│   └── utils/          # Helper functions
├── assets/             # Images, fonts, icons
├── app.json           # Expo configuration
├── firebase.json      # Firebase configuration
├── .env.example       # Environment variables template
└── package.json       # Dependencies
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Firebase JS SDK works with Expo but requires specific setup
// Use Firebase JS SDK (not React Native Firebase) for Expo compatibility
// Example: import { initializeApp } from 'firebase/app' NOT @react-native-firebase/app

// CRITICAL: NativeBase requires wrapping app with NativeBaseProvider
// Must configure SSR for web platform support

// CRITICAL: Expo Web requires specific metro.config.js for Firebase
// See: https://github.com/expo/expo/issues/17270

// CRITICAL: TypeScript paths need both tsconfig and babel.config.js
// Expo doesn't support tsconfig paths out of the box

// CRITICAL: Zustand + Firebase Realtime requires careful unsubscribe handling
// Memory leaks if listeners aren't cleaned up properly
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// types/user.ts - Core user and organization types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
  organizationId: string;
  teamIds: string[]; // Can belong to multiple teams
  managedTeamIds?: string[]; // Teams they manage
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'enterprise';
  aiMinutesQuota: number; // Monthly AI processing minutes
  aiMinutesUsed: number;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  organizationId: string;
  parentTeamId?: string; // For tree structure
  managerIds: string[];
  memberIds: string[];
}

// types/firebase.ts - Firestore document types
export interface FirestoreDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CustomerDoc extends FirestoreDoc {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: string; // salesperson ID
  teamId: string;
  notes?: string;
}
```

### List of Tasks to Complete

```yaml
Task 1: Initialize Expo Project with TypeScript
CREATE project root:
  - RUN: npx create-expo-app@latest DonnaAI --template blank-typescript
  - VERIFY: App runs with: npx expo start
  - TEST: Open in web browser, iOS simulator, Android emulator

Task 2: Install Core Dependencies
MODIFY package.json:
  - ADD dependencies:
    - firebase: ^10.7.0
    - native-base: ^3.4.0
    - react-native-svg: (expo install)
    - zustand: ^4.4.0
    - react-navigation packages
    - react-hook-form: ^7.48.0
    - zod: ^3.22.0
  - RUN: npm install
  - RUN: npx expo install react-native-svg react-native-safe-area-context

Task 3: Configure Firebase Project
CREATE firebase.json:
  - ADD Firestore indexes
  - ADD Security rules
CREATE .env.example:
  - ADD Firebase config keys template
  - ADD API keys placeholders
CREATE src/services/firebase/config.ts:
  - SETUP Firebase initialization
  - HANDLE Web/Native platform differences

Task 4: Setup NativeBase with Notion Theme
CREATE src/theme/index.ts:
  - COPY theme config from ARCHITECTURE.md
  - CUSTOMIZE colors, fonts, components
MODIFY App.tsx:
  - WRAP with NativeBaseProvider
  - ADD SSR configuration for web

Task 5: Implement Authentication Service
CREATE src/services/firebase/auth.ts:
  - IMPLEMENT signIn, signUp, signOut
  - ADD role-based authentication
  - HANDLE auth state persistence
CREATE src/stores/authStore.ts:
  - SETUP Zustand store for auth state
  - INTEGRATE Firebase auth listener
  - ADD user profile management

Task 6: Setup Tree-based Permissions
CREATE src/services/firebase/permissions.ts:
  - IMPLEMENT isManagerOfTeam function
  - ADD hierarchical permission checks
  - CREATE permission helper functions
CREATE firestore.rules:
  - ADD Security Rules from ARCHITECTURE.md
  - TEST rules in Firebase console

Task 7: Create Authentication Screens
CREATE src/screens/auth/LoginScreen.tsx:
  - USE Notion-style form design
  - INTEGRATE with authStore
  - ADD form validation with react-hook-form + zod
CREATE src/screens/auth/RegisterScreen.tsx:
  - IMPLEMENT organization setup flow
  - ADD role selection
  - HANDLE initial team creation

Task 8: Setup Navigation Structure
CREATE src/navigation/AppNavigator.tsx:
  - SETUP authenticated/unauthenticated stacks
  - ADD role-based navigation
  - CONFIGURE deep linking for web
CREATE src/navigation/TabNavigator.tsx:
  - ADD bottom tabs for main sections
  - IMPLEMENT role-specific tabs

Task 9: Create Dashboard Screens
CREATE src/screens/dashboard/SalespersonDashboard.tsx:
  - ADD placeholder for meeting recordings
  - SHOW customer list preview
  - ADD quick actions
CREATE src/screens/dashboard/ManagerDashboard.tsx:
  - ADD team overview
  - SHOW analytics preview
  - ADD team management options

Task 10: Setup Development Environment
CREATE .env.example:
  - DOCUMENT all required environment variables
CREATE README.md:
  - ADD setup instructions
  - INCLUDE Firebase project setup guide
  - ADD development workflow
MODIFY app.json:
  - CONFIGURE app name, bundle ID
  - ADD Firebase plugin configuration
  - SETUP notification icons
```

### Task Implementation Details

```typescript
// Task 3: Firebase Configuration
// src/services/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Task 5: Auth Store with Zustand
// src/stores/authStore.ts
import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/config';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => () => void; // Returns unsubscribe function
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  initializeAuth: () => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ firebaseUser, isLoading: true });
      
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            set({ 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
          } else {
            // User authenticated but no profile
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: 'User profile not found' 
            });
          }
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: error.message 
          });
        }
      } else {
        // Not authenticated
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      }
    });
    
    return unsubscribe;
  },
}));
```

### Integration Points
```yaml
FIREBASE:
  - project: Create new Firebase project in console
  - auth: Enable Email/Password authentication
  - firestore: Create database in production mode
  - storage: Enable for audio file storage later
  - functions: Initialize for AI processing
  
EXPO:
  - app.json: Configure with Firebase plugin
  - eas.json: Setup for EAS Build (native builds)
  - metro.config.js: Configure for Firebase web support
  
NAVIGATION:
  - Deep linking: Configure for web URLs
  - Tab navigation: Different tabs for roles
  - Stack navigation: Auth flow vs main app
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript compilation check
npx tsc --noEmit

# ESLint check (after setting up)
npm run lint

# Prettier format check
npm run format:check

# Expected: No errors. If errors, READ and fix TypeScript/ESLint errors
```

### Level 2: Component Testing
```bash
# Install testing dependencies first
npm install --save-dev @testing-library/react-native jest-expo jest @types/jest

# Create test for auth store
# src/stores/__tests__/authStore.test.ts
```

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../authStore';

describe('AuthStore', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
  
  it('should set user and update auth state', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'salesperson' as const,
      organizationId: 'org123',
      teamIds: ['team1'],
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Level 3: Integration Testing
```bash
# Start Expo development server
npx expo start

# For web testing
# 1. Press 'w' to open in web browser
# 2. Check console for any errors
# 3. Verify login screen appears

# For iOS testing (Mac only)
# 1. Press 'i' to open iOS simulator
# 2. Verify app loads without crashes

# For Android testing  
# 1. Press 'a' to open Android emulator
# 2. Verify app loads without crashes

# Test Firebase connection
# 1. Check browser console for Firebase initialization
# 2. Try creating a test account
# 3. Verify Firestore creates user document
```

### Level 4: Firebase Security Rules Testing
```javascript
// Test in Firebase Console Rules Playground
// Test 1: User can read own profile
// Simulation: 
//   - Auth: uid = "user123"
//   - Operation: get
//   - Path: /users/user123
// Expected: ALLOW

// Test 2: User cannot read other's profile  
// Simulation:
//   - Auth: uid = "user123"
//   - Operation: get
//   - Path: /users/other456
// Expected: DENY

// Test 3: Manager can read team members
// Simulation:
//   - Auth: uid = "manager123", token.role = "manager"
//   - Operation: get
//   - Path: /users/member456 (where member456.teamId in manager's teams)
// Expected: ALLOW
```

## Final Validation Checklist
- [ ] Expo app runs on Web: `npx expo start --web`
- [ ] Expo app runs on iOS: `npx expo start --ios`
- [ ] Expo app runs on Android: `npx expo start --android`
- [ ] TypeScript has no errors: `npx tsc --noEmit`
- [ ] Firebase Auth works: Can create account and sign in
- [ ] Firestore connected: User document created on signup
- [ ] Navigation works: Auth flow redirects properly
- [ ] Notion theme applied: UI matches design
- [ ] Tree permissions: Manager can see team members
- [ ] Environment variables: .env.example documents all vars

---

## Anti-Patterns to Avoid
- ❌ Don't use @react-native-firebase packages (incompatible with Expo Go)
- ❌ Don't skip Firebase emulator setup for development
- ❌ Don't hardcode Firebase config values
- ❌ Don't create flat permission structure (must be hierarchical)
- ❌ Don't skip TypeScript strict mode
- ❌ Don't use synchronous storage for auth tokens
- ❌ Don't forget to handle offline states
- ❌ Don't skip Security Rules testing

## Common Issues & Solutions

### Issue: Firebase not connecting on Web
```javascript
// Solution: Add this to metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
module.exports = config;
```

### Issue: NativeBase SSR warnings on Web
```tsx
// Solution: Configure SSR in App.tsx
import { NativeBaseProvider, SSRProvider } from 'native-base';

export default function App() {
  return (
    <SSRProvider>
      <NativeBaseProvider>
        {/* Your app */}
      </NativeBaseProvider>
    </SSRProvider>
  );
}
```

### Issue: TypeScript path aliases not working
```json
// Solution: Install babel-plugin-module-resolver
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@stores': './src/stores',
          '@types': './src/types',
        }
      }]
    ]
  };
};
```

## Next Steps After Foundation
1. Implement meeting recording feature with expo-av
2. Add AI transcription via Cloud Functions
3. Build analytics dashboard with Victory Native
4. Create business tools marketplace
5. Add push notifications
6. Implement offline sync
7. Add CSV import functionality
8. Setup subscription billing

---

## Confidence Score: 8.5/10

### Why 8.5?
- ✅ Comprehensive documentation links provided
- ✅ Clear implementation blueprint with code examples
- ✅ Validation steps at multiple levels
- ✅ Common gotchas documented
- ✅ Progressive implementation approach
- ⚠️ Minor deduction for complex Firebase + Expo setup
- ⚠️ Tree-based permissions may need iteration

This PRP provides everything needed for one-pass implementation of the DonnaAI foundation with proper validation gates to ensure success.