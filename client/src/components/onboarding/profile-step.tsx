import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { OnboardingData } from "@/pages/onboarding";
import { useAuth } from "@/hooks/useAuth";

const profileSchema = z.object({
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
  const { user } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      gender: data.gender,
      birthday: data.birthday,
      height: data.height,
      weight: data.weight,
      bodyType: data.bodyType,
    },
  });

  const handleImageUpload = (file: File) => {
    // TODO: Implement image upload to server
    console.log("Image uploaded:", file);
  };

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
            <p className="text-sm text-gray-500 mt-2">Upload a photo or use your initials</p>
          </div>

          <div className="space-y-4">
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

          <Button 
            type="submit"
                            className="w-full bg-gradient-to-r from-primary-500 to-lavender-500 hover:from-primary-600 hover:to-lavender-600 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-center"
          >
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
