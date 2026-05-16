/**
 * Supabase Service - Authentication and API calls
 */

import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/utils/constants';

// Initialize Supabase client
const supabaseUrl = API_CONFIG.supabaseUrl;
const supabasePublishableKey = API_CONFIG.supabasePublishableKey;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

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
