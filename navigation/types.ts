/**
 * Navigation Types for TrustEnd
 * Defines all possible routes and navigation params
 */

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  EmployeeTabs: undefined;
  SupervisorTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  CreateOrganization: undefined;
  JoinOrganization: undefined;
  WaitingApproval: undefined;
};

export type EmployeeTabParamList = {
  Home: undefined;
  Attendance: undefined;
  Requests: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type SupervisorTabParamList = {
  Home: undefined;
  AttendanceLogs: undefined;
  RequestReview: undefined;
  ReportReview: undefined;
  Team: undefined;
  Profile: undefined;
};

export type RootNavigation = any;
export type AuthNavigation = any;
export type EmployeeTabNavigation = any;
export type SupervisorTabNavigation = any;
