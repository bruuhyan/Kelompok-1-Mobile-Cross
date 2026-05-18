/**
 * TypeScript Type Definitions for TrustEnd
 */

// Enums
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum UserRole {
  EMPLOYEE = 'employee',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'supervisor' | 'admin';
  organization_id: string;
  trust_score: number;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  phone?: string;
  avatar_url?: string;
  image_url?: string;
  department?: string;
  position?: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  address: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  gps_lat: number;
  gps_lng: number;
  gps_radius_meters: number;
  wifi_ssid?: string;
  wifi_bssid?: string;
  ip_range?: string;
  work_start_time?: string;
  work_end_time?: string;
  created_at: string;
  updated_at: string;
}

// Attendance Types
export interface AttendanceLog {
  id: string;
  user_id: string;
  organization_id: string;
  type: 'check_in' | 'check_out';
  timestamp: string;
  gps_lat: number;
  gps_lng: number;
  wifi_ssid?: string;
  wifi_bssid?: string;
  ip_address?: string;
  is_synced: boolean;
  created_at: string;
}

export interface AttendanceValidation {
  gps_valid: boolean;
  wifi_valid: boolean;
  ip_valid: boolean;
  errors: string[];
}

// Request Types
export interface Request {
  id: string;
  user_id: string;
  organization_id: string;
  type: 'holiday' | 'overtime';
  start_date: string;
  end_date?: string;
  hours?: number;
  reason: string;
  status: 'pending' | 'approved' | 'disapproved';
  reviewer_id?: string;
  reviewer_note?: string;
  created_at: string;
  updated_at: string;
}

export interface HolidayRequest extends Request {
  type: 'holiday';
  end_date: string;
}

export interface OvertimeRequest extends Request {
  type: 'overtime';
  hours: number;
}

// Report Types
export interface Report {
  id: string;
  user_id: string;
  organization_id: string;
  content: string;
  photo_url?: string;
  status: 'submitted' | 'reviewed';
  created_at: string;
  updated_at: string;
}

// Trust Score Types
export interface TrustScoreBreakdown {
  punctuality: number;
  location_consistency: number;
  activity_score: number;
  total: number;
}

export interface TrustScoreTier {
  min: number;
  max: number;
  color: string;
  label: string;
}

// Sync Types
export interface SyncQueueItem {
  id: string;
  type: 'attendance' | 'request' | 'report';
  data: any;
  timestamp: string;
  retry_count: number;
}

export interface SyncStatus {
  is_syncing: boolean;
  pending_count: number;
  last_sync: string | null;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  organization_code: string;
}

export interface CreateOrgFormData {
  name: string;
  address: string;
  email: string;
  password: string;
}

export interface HolidayRequestFormData {
  start_date: string;
  end_date: string;
  reason: string;
}

export interface OvertimeRequestFormData {
  date: string;
  hours: number;
  reason: string;
}

export interface ReportFormData {
  content: string;
  photo?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Navigation Types
export interface NavigationParams {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  reportId?: string;
  from?: string;
}

// Component Props Types
export interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  disabled?: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
