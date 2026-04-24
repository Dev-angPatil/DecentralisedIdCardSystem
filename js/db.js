import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TODO: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://zkfjhwyoapjesyqijdsm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2yi6xhTABd9NXR7zULnAvg_SSCbq9bl';

// Initialize the Supabase client conditionally
const isSupabaseConfigured = SUPABASE_URL !== 'https://zkfjhwyoapjesyqijdsm.supabase.co';
export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Utility functions for common database operations with LocalStorage Fallback
 */

export async function fetchUsers() {
  if (!isSupabaseConfigured) {
    console.log('[DB] Using LocalStorage Fallback for Users');
    return JSON.parse(localStorage.getItem('chainCampusUsers') || '[]');
  }
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data || [];
}

export async function getUserByEmail(email) {
  if (!isSupabaseConfigured) {
    const users = JSON.parse(localStorage.getItem('chainCampusUsers') || '[]');
    return users.find(u => u.email === email) || null;
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
}

export async function saveUser(user) {
  if (!isSupabaseConfigured) {
    const users = JSON.parse(localStorage.getItem('chainCampusUsers') || '[]');
    const i = users.findIndex(u => u.email === user.email);
    if (i >= 0) users[i] = user; else users.push(user);
    localStorage.setItem('chainCampusUsers', JSON.stringify(users));
    return user;
  }
  const { data, error } = await supabase
    .from('users')
    .upsert([user], { onConflict: 'email' })
    .select();

  if (error) {
    console.error('Error saving user:', error);
    return null;
  }
  return data?.[0];
}

export async function fetchEvents() {
  if (!isSupabaseConfigured) {
    const state = JSON.parse(localStorage.getItem('chainCampusState') || '{}');
    return state.events || [];
  }
  const { data, error } = await supabase.from('events').select('*');
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data || [];
}

export async function fetchCourses() {
  if (!isSupabaseConfigured) {
    const state = JSON.parse(localStorage.getItem('chainCampusState') || '{}');
    return state.courses || [];
  }
  const { data, error } = await supabase.from('courses').select('*');
  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
  return data || [];
}

export async function fetchAttendance() {
  if (!isSupabaseConfigured) {
    const state = JSON.parse(localStorage.getItem('chainCampusState') || '{}');
    return state.attendanceRecords || [];
  }
  const { data, error } = await supabase.from('attendance').select('*');
  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data || [];
}

