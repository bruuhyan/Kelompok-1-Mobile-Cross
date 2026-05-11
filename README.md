# TrustEnd

A React Native mobile app for smart employee attendance tracking with trust scoring, GPS/WiFi validation, and multi-tenant organization support.

## Features

- **Role-Based Access**: Employee and Supervisor dashboards
- **Trust Score System**: Calculate employee trust based on punctuality, location consistency, and activity
- **Security Validation**: GPS, WiFi, and IP address verification on check-in
- **Offline Mode**: Local storage with automatic sync when online
- **Multi-Tenant**: Organization-based data isolation
- **Request Management**: Holiday and overtime request submission and approval
- **Report System**: Daily/weekly report submission and review

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: Expo Router v6
- **State Management**: Zustand
- **Backend/DB**: Supabase (auth, Postgres, real-time)
- **Location**: expo-location
- **Network**: @react-native-community/netinfo
- **UI**: Custom components with React Native Reanimated

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your Supabase credentials in `.env`

### Running the App

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for web

## Project Structure

```
/app
  /(auth)          - Authentication screens
  /(employee)      - Employee dashboard tabs
  /(supervisor)    - Supervisor dashboard tabs
  splash.tsx       - Splash screen
  _layout.tsx      - Root layout

/components       - Reusable UI components
/hooks            - Custom hooks
/services         - API services
/store            - State management (Zustand)
/navigation       - Navigation types
/utils            - Helpers, constants, types
/assets           - Fonts, images
/constants         - Theme and font configuration
```

## Build Phases

The app is built incrementally across 16 phases:

1. ✅ Project setup, folder structure, navigation skeleton, theme/fonts
2. ✅ Auth screens – Login, Register, Create Organization, Join Organization
3. ⏳ Waiting Approval screen + Supabase auth & profiles DB setup
4. ⏳ Employee Dashboard shell + Bottom Tab navigation
5. ⏳ Check-in / Check-out flow with GPS + WiFi + IP validation
6. ⏳ Offline mode – local storage, sync queue, online/offline banner
7. ⏳ Holiday & Overtime request submission (Employee)
8. ⏳ Report submission (Employee)
9. ⏳ Trust Score calculation logic + Trust Score badge component
10. ⏳ Supervisor Dashboard shell + Bottom Tab navigation
11. ⏳ Supervisor – Attendance log viewer
12. ⏳ Supervisor – Request approval / disapproval flow
13. ⏳ Supervisor – Report review flow
14. ⏳ Supervisor – Team management (approve users, promote to supervisor)
15. ⏳ Multi-tenant org settings (GPS radius, WiFi registration)
16. ⏳ Polish – animations, loading states, error handling, empty states

## Database Schema

### Tables

- `organizations` - Organization details
- `profiles` - User profiles linked to organizations
- `attendance_logs` - Check-in/check-out records
- `requests` - Holiday and overtime requests
- `reports` - Employee reports
- `org_settings` - Organization-specific settings

See `PROJECT_STRUCTURE.md` for detailed schema.

## License

MIT
