import { createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema.js";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient.js";
import { useToast } from "@/hooks/use-toast.js";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  role: z.enum(["tenant", "owner"]).default("tenant"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  phone: z.string().trim()
         .regex(/^[0-9]{10}$/, { message: "Phone must be exactly 10 digits" })
         .refine((value) => /^[6-9][0-9]{9}$/.test(value), {
           message: "Phone number must be a valid Indian mobile number starting with 6, 7, 8, or 9"
         }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    onSuccess: (userData) => {
      if (userData) {
        // If no role in user data, check localStorage
        if (userData && !userData.role) {
          try {
            const savedRole = localStorage.getItem('userRole');
            if (savedRole && (savedRole === 'owner' || savedRole === 'tenant')) {
              console.log("Retrieved role from localStorage:", savedRole);
              // Update the user data with the saved role
              queryClient.setQueryData(["/api/user"], {
                ...userData,
                role: savedRole
              });
            }
          } catch (e) {
            console.error("Failed to get role from localStorage", e);
          }
        }
      }
    }
  });

  const refreshUserData = async () => {
    try {
      await refetchUser();
      console.log("User data refreshed from server");
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      // Remove confirmPassword as it's not needed on the server
      const { confirmPassword, roleHidden, ...userData } = data;
      console.log("Registering user with data:", JSON.stringify(userData));
      console.log("Selected role in mutation:", userData.role, typeof userData.role);
      
      // Create a copy with explicit role to ensure it's sent properly
      const submissionData = {
        ...userData,
        role: userData.role === 'owner' ? 'owner' : 'tenant'
      };
      
      const res = await apiRequest("POST", "/api/register", submissionData);
      const responseData = await res.json();
      console.log("Registration API response:", JSON.stringify(responseData));
      
      // Ensure role is properly set in the response
      if (responseData && !responseData.role && submissionData.role) {
        console.warn("Role missing in response, using submitted role:", submissionData.role);
        responseData.role = submissionData.role;
      }
      
      return responseData;
    },
    onSuccess: (user) => {
      console.log("Registration successful with user:", JSON.stringify(user));
      console.log("User role:", user.role, typeof user.role);
      
      // Force clear any existing user data before setting new data
      queryClient.removeQueries({ queryKey: ["/api/user"] });
      
      // Ensure we're storing the complete user data with correct role
      const userData = {
        ...user,
        role: user.role || "tenant" // Fallback to tenant if still missing
      };
      
      // Save explicitly to local storage as backup
      try {
        localStorage.setItem('userRole', userData.role);
        console.log("Saved user role to localStorage:", userData.role);
      } catch (e) {
        console.error("Failed to save role to localStorage", e);
      }
      
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}! ${userData.role === 'owner' ? 'You can now list your properties.' : 'You can now browse available accommodations.'}`,
      });
      
      // Force a refetch to ensure data consistency
      setTimeout(() => refreshUserData(), 200);
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      console.log("Submitting profile update:", profileData);
      const res = await apiRequest("PUT", "/api/user/profile", profileData);
      try {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to update profile");
        }
        
        // Clone the response since we can only read it once
        const resClone = res.clone();
        
        try {
          // Try to parse the response as JSON
          const userData = await res.json();
          console.log("Profile update successful, received:", userData);
          return userData;
        } catch (parseError) {
          // If JSON parsing fails, log the actual response content for debugging
          console.error("JSON parsing error:", parseError);
          const textContent = await resClone.text();
          console.error("Actual response content:", textContent);
          throw new Error("Server returned an invalid response. Please try again.");
        }
      } catch (error) {
        console.error("Profile update error:", error);
        // If there's an error parsing JSON, throw a more specific error
        if (error.name === "SyntaxError") {
          throw new Error("Server returned an invalid response. Please try again.");
        }
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      // Invalidate accommodations to refresh if phone was updated
      queryClient.invalidateQueries({ queryKey: ["/api/accommodations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-accommodations"] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error) => {
      console.error("Profile update mutation error:", error);
      toast({
        title: "Profile update failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
