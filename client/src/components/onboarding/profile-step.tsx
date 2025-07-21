import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingData } from "@/pages/onboarding";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  bodyType: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function ProfileStep({ data, updateData, onNext }: ProfileStepProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: data.username,
      gender: data.gender,
      birthday: data.birthday,
      height: data.height,
      weight: data.weight,
      bodyType: data.bodyType,
    },
  });

  const onSubmit = (formData: ProfileFormData) => {
    updateData(formData);
    onNext();
  };

  return (
    <Card className="card-shadow slide-in">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create Your Profile</h2>
        <p className="text-gray-600 text-center mb-8">Tell us about yourself to personalize your journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Placeholder */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-300 to-lavender-300 flex items-center justify-center">
                <i className="fas fa-user text-3xl text-white"></i>
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 bg-secondary-300 text-white p-2 rounded-full text-sm hover:bg-secondary-400 transition-colors"
              >
                <i className="fas fa-camera"></i>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Optional profile picture</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="Choose a username"
                className="mt-2"
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => setValue("gender", value)} defaultValue={data.gender}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select" />
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
                <Select onValueChange={(value) => setValue("bodyType", value)} defaultValue={data.bodyType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ectomorph">Ectomorph</SelectItem>
                    <SelectItem value="mesomorph">Mesomorph</SelectItem>
                    <SelectItem value="endomorph">Endomorph</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary-300 to-lavender-300 hover:from-primary-400 hover:to-lavender-400 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
