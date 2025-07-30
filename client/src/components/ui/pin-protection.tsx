import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PinProtectionProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'setup' | 'verify' | 'update';
  onSuccess?: () => void;
}

export function PinProtection({ isOpen, onClose, mode, onSuccess }: PinProtectionProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'ask' | 'enter' | 'confirm'>('ask');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setupPinMutation = useMutation({
    mutationFn: async (pinData: { pin?: string; enabled: boolean }) => {
      return await apiRequest('PUT', '/api/user/photos-pin', pinData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      if (onSuccess) onSuccess();
      resetAndClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update PIN settings",
        variant: "destructive",
      });
    },
  });

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      return await apiRequest('POST', '/api/user/verify-photos-pin', { pin });
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
      resetAndClose();
    },
    onError: () => {
      toast({
        title: "Incorrect PIN",
        description: "Please try again",
        variant: "destructive",
      });
      setPin('');
    },
  });

  const resetAndClose = () => {
    setPin('');
    setConfirmPin('');
    setStep('ask');
    onClose();
  };

  const handleAskResponse = (enable: boolean) => {
    if (enable) {
      setStep('enter');
    } else {
      setupPinMutation.mutate({ enabled: false });
    }
  };

  const handlePinSubmit = () => {
    if (mode === 'verify') {
      verifyPinMutation.mutate(pin);
      return;
    }

    if (step === 'enter') {
      if (pin.length !== 4) {
        toast({
          title: "Invalid PIN",
          description: "PIN must be 4 digits",
          variant: "destructive",
        });
        return;
      }
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (pin !== confirmPin) {
        toast({
          title: "PINs don't match",
          description: "Please try again",
          variant: "destructive",
        });
        setPin('');
        setConfirmPin('');
        setStep('enter');
        return;
      }
      setupPinMutation.mutate({ pin, enabled: true });
    }
  };

  const renderContent = () => {
    if (mode === 'verify') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Enter PIN</h3>
          <p className="text-gray-600">Please enter your 4-digit PIN to access photos</p>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="text-center text-2xl tracking-widest"
            maxLength={4}
          />
          <Button 
            onClick={handlePinSubmit}
            disabled={pin.length !== 4 || verifyPinMutation.isPending}
            className="w-full"
          >
            {verifyPinMutation.isPending ? 'Verifying...' : 'Unlock'}
          </Button>
        </div>
      );
    }

    if (step === 'ask') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Protect Your Photos</h3>
          <p className="text-gray-600">
            We know your progress can be personal, so we securely store your photos here in the app instead of your camera roll.  Would you like to set up a 4 digit PIN to access the photos page? If you opt out now and change your mind, you can always create one in the settings.
          </p>
          <div className="space-y-2">
            <Button onClick={() => handleAskResponse(true)} className="w-full">
              Yes, Set PIN
            </Button>
            <Button onClick={() => handleAskResponse(false)} variant="outline" className="w-full">
              No Thanks
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            You can always enable PIN protection later in Settings
          </p>
        </div>
      );
    }

    if (step === 'enter') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Set Your PIN</h3>
          <p className="text-gray-600">Choose a 4-digit PIN</p>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="text-center text-2xl tracking-widest"
            maxLength={4}
          />
          <Button 
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      );
    }

    if (step === 'confirm') {
      return (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Confirm Your PIN</h3>
          <p className="text-gray-600">Enter your PIN again to confirm</p>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="****"
            className="text-center text-2xl tracking-widest"
            maxLength={4}
          />
          <Button 
            onClick={handlePinSubmit}
            disabled={confirmPin.length !== 4 || setupPinMutation.isPending}
            className="w-full"
          >
            {setupPinMutation.isPending ? 'Setting up...' : 'Set PIN'}
          </Button>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'setup' ? 'Photo Protection' : mode === 'update' ? 'Update PIN' : 'Photos Protected'}
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}