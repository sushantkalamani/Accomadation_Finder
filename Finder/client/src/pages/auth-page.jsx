import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth.jsx";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = (data) => {
    loginMutation.mutate(data);
  };

  // Register form
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "tenant" // Default role
    },
  });

  const onRegisterSubmit = (data) => {
    // Force the role to be explicitly set to avoid any default value issues
    const roleValue = data.role === 'owner' ? 'owner' : 'tenant';
    
    const submissionData = {
      ...data,
      role: roleValue
    };
    
    console.log("Form data before submission:", submissionData);
    console.log("Explicitly set role to:", roleValue);
    
    // Pass role directly in mutation options to ensure it's properly set
    registerMutation.mutate(submissionData, {
      onSuccess: (userData) => {
        console.log("Registration successful with role:", userData.role);
        // Force a page reload to ensure fresh state
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    });
  };

  if (user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded-none border-b">
            <TabsTrigger value="login" className="py-4 font-medium">Log In</TabsTrigger>
            <TabsTrigger value="signup" className="py-4 font-medium">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="p-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-6">Welcome back</h1>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end mt-1">
                  <a href="#" className="text-sm text-teal-600 hover:text-teal-700">
                    Forgot password?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Log In
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="signup" className="p-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-6">Create your account</h1>
            
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your@email.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Minimum 6 characters" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Re-enter password" 
                          type="password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I want to</FormLabel>
                      <div className="flex space-x-4 mt-1">
                        <div 
                          className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-all ${
                            field.value === 'tenant' 
                              ? 'border-[#FF5A5F] bg-pink-50 text-[#FF5A5F]' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            console.log("Setting role to: tenant");
                            field.onChange('tenant');
                            // Set value directly in form
                            registerForm.setValue('role', 'tenant', { shouldValidate: true });
                          }}
                        >
                          <div className="font-medium">Find Rooms</div>
                          <div className="text-xs mt-1 text-gray-500">Browse available accommodations</div>
                        </div>
                        <div 
                          className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-all ${
                            field.value === 'owner' 
                              ? 'border-[#FF5A5F] bg-pink-50 text-[#FF5A5F]' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            console.log("Setting role to: owner");
                            field.onChange('owner');
                            // Set value directly in form
                            registerForm.setValue('role', 'owner', { shouldValidate: true });
                          }}
                        >
                          <div className="font-medium">List Rooms</div>
                          <div className="text-xs mt-1 text-gray-500">Register my properties</div>
                        </div>
                      </div>
                      <FormMessage />
                      {/* Hidden input to ensure the role value is always submitted */}
                      <input 
                        type="hidden" 
                        name="roleHidden" 
                        value={field.value} 
                      />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#FF5A5F] hover:bg-[#E00B41] text-white"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Sign Up
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
