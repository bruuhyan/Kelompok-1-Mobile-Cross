/**
 * Supabase Service - Authentication and API calls
 */

import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/utils/constants';

// Initialize Supabase client
const supabaseUrl = API_CONFIG.supabaseUrl;
const supabaseAnonKey = API_CONFIG.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      .single();

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
