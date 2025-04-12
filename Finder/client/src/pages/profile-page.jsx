import { useState, useEffect } from "react";
import { useAuth, profileUpdateSchema } from "@/hooks/use-auth.jsx";
import { Navbar } from "@/components/ui/navbar.jsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { InfoIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Redirect } from "wouter";

export default function ProfilePage() {
  const { user, isLoading, updateProfileMutation } = useAuth();
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Initialize form with user data
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);
  
  const onSubmit = async (data) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setSuccessMessage("Profile updated successfully");
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      // Error is already handled by the mutation
    }
  };
  
  // If not logged in, redirect to login page
  if (!isLoading && !user) {
    return <Redirect to="/auth" />;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      
      <main className="flex-1 container max-w-md p-4 mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details here
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  {...register("name")} 
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Your email" 
                  {...register("email")} 
                  disabled={true} // Email cannot be changed
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="10-digit mobile number" 
                  {...register("phone")} 
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              
              {successMessage && (
                <Alert className="bg-green-50 border-green-500 text-green-800">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}
              
              {updateProfileMutation.isError && (
                <Alert className="bg-red-50 border-red-500 text-red-800">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {updateProfileMutation.error?.message || "Failed to update profile. Please try again."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Update Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
} 