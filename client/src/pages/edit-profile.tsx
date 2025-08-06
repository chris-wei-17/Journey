import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Header } from "@/components/ui/header";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function EditProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch user profile data
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/profile');
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty }, reset } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      gender: "",
      birthday: "",
      height: "",
      weight: "",
      bodyType: "",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (user && userProfile) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        gender: userProfile.gender || "",
        birthday: userProfile.birthday || "",
        height: userProfile.height || "",
        weight: userProfile.weight || "",
        bodyType: userProfile.bodyType || "",
      });
    }
  }, [user, userProfile, reset]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { user: Partial<EditProfileFormData>, profile: Partial<EditProfileFormData> }) => {
      const userUpdate = await apiRequest('PUT', '/api/profile/user', data.user);
      const profileUpdate = await apiRequest('PUT', '/api/profile/profile', data.profile);
      return { user: userUpdate, profile: profileUpdate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setLocation('/profile');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      return await apiRequest('POST', '/api/profile/avatar', formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      await uploadImageMutation.mutateAsync(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = (formData: EditProfileFormData) => {
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
    };

    const profileData = {
      gender: formData.gender,
      birthday: formData.birthday,
      height: formData.height,
      weight: formData.weight,
      bodyType: formData.bodyType,
    };

    updateUserMutation.mutate({ user: userData, profile: profileData });
  };

  const handleBack = () => {
    setLocation('/profile');
  };

  if (isLoading) {
    return (
      <div className="app-gradient-bg min-h-screen">
        <Header 
          title="Edit Profile"
          showBackButton={true}
          onBack={handleBack}
          showHomeButton={true}
        />
        <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-white">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-gradient-bg min-h-screen">
              <Header 
          title="Edit Profile"
          showBackButton={true}
          onBack={handleBack}
          showHomeButton={true}
        />
      
              <main className="pt-[calc(env(safe-area-inset-top)+5rem)] p-4 max-w-2xl mx-auto">
        <Card className="bg-white/75 backdrop-blur-sm shadow-xl border-0 mb-8" style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 text-center">
              Update Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  profileImageUrl={user?.profileImageUrl}
                  size="xl"
                  onImageUpload={handleImageUpload}
                  editable={true}
                />
                <p className="text-sm text-gray-500 mt-2">
                  {uploadingImage ? "Uploading..." : "Click to change your profile picture"}
                </p>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      className="mt-2"
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      className="mt-2"
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    {...register("username")}
                    className="mt-2"
                    placeholder="Username"
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-2"
                    placeholder="Email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={(value) => setValue("gender", value)} value={watch("gender")}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      {...register("birthday")}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      {...register("height")}
                      placeholder="5'6&quot;"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      {...register("weight")}
                      placeholder="150 lbs"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bodyType">Body Type</Label>
                    <Select onValueChange={(value) => setValue("bodyType", value)} value={watch("bodyType")}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value="petite">Petite</SelectItem>
                    <SelectItem value="lean">Lean</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="athletic">Athletic</SelectItem>
                    <SelectItem value="muscular">Muscular</SelectItem>
                    <SelectItem value="pear">Pear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending || uploadingImage || !isDirty}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-accent-400 hover:from-primary-700 hover:to-accent-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? "Updating..." : !isDirty ? "No Changes" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}