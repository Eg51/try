// app/dashboard/settings/WebAuthnSetup.tsx
"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { getRegistrationOptions, verifyRegistration } from "@/app/actions/webauthn";
import { Button } from "@/components/ui/Button";
import { Fingerprint, CheckCircle2 } from "lucide-react";

export function WebAuthnSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Get challenge from server
      const options = await getRegistrationOptions();

      // 2. FIX: Wrap options in { optionsJSON: options }
      const attestationResponse = await startRegistration({ optionsJSON: options as any });

      // 3. Send back to server to verify and save to MongoDB
      const verification = await verifyRegistration(attestationResponse);

      if (verification.success) {
        setSuccess(true);
      } else {
        setError("Failed to register biometrics.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === "InvalidStateError") {
        setError("A passkey is already registered on this device.");
      } else if (err.name === "NotAllowedError") {
        setError("Biometric prompt was cancelled.");
      } else {
        setError("An error occurred during setup.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg text-success">
        <CheckCircle2 size={24} />
        <div>
          <p className="font-semibold">Biometrics Enabled</p>
          <p className="text-sm opacity-80">You can now log in using FaceID or TouchID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">{error}</div>}
      <div className="flex items-center justify-between p-4 bg-surface-900 border border-surface-700 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
            <Fingerprint size={24} />
          </div>
          <div>
            <p className="font-semibold text-text-primary">Biometric Login</p>
            <p className="text-sm text-text-muted">Use FaceID or TouchID to sign in faster.</p>
          </div>
        </div>
        <Button onClick={handleRegister} disabled={isLoading} variant="secondary" className="border-surface-700">
          {isLoading ? "Setting up..." : "Enable"}
        </Button>
      </div>
    </div>
  );
}