/**
 * Supabase Service - Authentication and API calls
 */

import 'react-native-url-polyfill/auto';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/utils/constants';

// Initialize Supabase client
const supabaseUrl = API_CONFIG.supabaseUrl;
const supabasePublishableKey = API_CONFIG.supabasePublishableKey;

// Create a custom storage that safely handles SSR (Server-Side Rendering)
const customStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
/**
 * Authentication Service
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Get user session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /**
   * Update password
   */
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
  },
};

/**
 * Profile Service
 */
export const profileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Create user profile
   */
  async createProfile(profile: {
    id: string;
    name: string;
    email: string;
    organization_id: string;
    role: string;
    status: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upload profile image to Supabase Storage and return its public URL
   */
  async uploadProfileImage(userId: string, image: ArrayBuffer, fileExt: string, contentType: string) {
    const sanitizedExt = fileExt.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const filePath = `${userId}/${Date.now()}.${sanitizedExt}`;

    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, image, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};

/**
 * Organization Service
 */
export const organizationService = {
  /**
   * Get organization by code
   */
  async getOrganizationByCode(code: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('code', code)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Create organization
   */
  async createOrganization(org: {
    name: string;
    address: string;
    code: string;
  }) {
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Securely create an organization and the current user's admin profile.
   * Requires the matching SQL RPC in supabase/rls_policies.sql.
   */
  async createOrganizationWithAdmin(org: {
    name: string;
    address: string;
    code: string;
    adminName: string;
    adminEmail: string;
  }) {
    const { data, error } = await supabase.rpc('create_organization_with_admin', {
      p_name: org.name,
      p_address: org.address,
      p_code: org.code,
      p_admin_name: org.adminName,
      p_admin_email: org.adminEmail,
    });

    if (error) throw error;
    return data;
  },
};

/**
 * Supervisor Service
 */
export const supervisorService = {
  async getTeamMembers(organizationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPendingRegistrations(organizationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateRegistrationStatus(userId: string, status: 'active' | 'suspended') {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingRequests(organizationId: string) {
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles:user_id(id, name, email, trust_score, status)')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTeamAttendanceToday(organizationId: string) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*, profiles:user_id(id, name, email)')
      .eq('organization_id', organizationId)
      .gte('check_in_time', start.toISOString())
      .lte('check_in_time', end.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAssignableEmployees(organizationId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, trust_score, status')
      .eq('organization_id', organizationId)
      .eq('role', 'employee')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTasks(organizationId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, trust_score), creator:profiles!tasks_created_by_fkey(id, name, email), reviewer:profiles!tasks_reviewed_by_fkey(id, name, email)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTask(task: {
    organization_id: string;
    assigned_to: string;
    created_by: string;
    title: string;
    description: string;
    due_date?: string | null;
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, trust_score)')
      .single();

    if (error) throw error;
    return data;
  },

  async reviewTask(taskId: string, reviewerId: string, status: 'approved' | 'rejected', reviewNotes?: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq('id', taskId)
      .select('*, assignee:profiles!tasks_assigned_to_fkey(id, name, email, trust_score), reviewer:profiles!tasks_reviewed_by_fkey(id, name, email)')
      .single();

    if (error) throw error;
    return data;
  },

  async reviewRequest(
    requestId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
  ) {
    const { data, error } = await supabase
      .from('requests')
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDashboardSummary(organizationId: string) {
    const [pendingProfiles, activeEmployees, pendingRequests, pendingReports] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('role', 'employee')
        .eq('status', 'active'),
      supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
    ]);

    const errors = [pendingProfiles.error, activeEmployees.error, pendingRequests.error, pendingReports.error]
      .filter(Boolean);

    if (errors.length > 0) throw errors[0];

    return {
      pendingRegistrations: pendingProfiles.count || 0,
      activeEmployees: activeEmployees.count || 0,
      pendingRequests: pendingRequests.count || 0,
      pendingReports: pendingReports.count || 0,
    };
  },
};
