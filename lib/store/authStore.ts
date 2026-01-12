import { create } from "zustand";
import { User } from "firebase/auth";
import { publicSupabase, getAuthenticatedSupabaseClient } from "../supabase"; // Import supabase client

interface AuthState {
  user: User | null;
  role: string | null;
  idToken: string | null; // Add idToken to the state
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUserRole: (uid: string, idToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  idToken: null, // Initialize idToken
  loading: true, // Initial loading state
  setUser: async (user) => {
    set({ user, loading: false });
    if (user) {
      const token = await user.getIdToken();
      set({ idToken: token }); // Store the idToken
      await get().fetchUserRole(user.uid, token);
    } else {
      set({ idToken: null, role: null }); // Clear token and role on logout
    }
  },
  setLoading: (loading) => set({ loading }),
  fetchUserRole: async (uid: string, idToken: string) => {
    try {
      const response = await fetch('/api/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }

      const data = await response.json();
      if (data.role) {
        set({ role: data.role });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      set({ role: null });
    }
  },
}));
