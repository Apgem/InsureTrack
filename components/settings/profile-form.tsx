"use client";

import { useFormState } from "react-dom";

import {
  updateProfile,
  type SettingsResult,
} from "@/app/(dashboard)/settings/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileValues = {
  full_name: string | null;
  agency_name: string | null;
  phone: string | null;
  timezone: string | null;
  email: string;
};

const initialState: SettingsResult | undefined = undefined;

export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, action] = useFormState(updateProfile, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Your login email can&apos;t be changed here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agency_name">Agency</Label>
          <Input
            id="agency_name"
            name="agency_name"
            defaultValue={profile.agency_name ?? ""}
            placeholder="APGEM Insurance"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={profile.phone ?? ""}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          name="timezone"
          defaultValue={profile.timezone ?? ""}
          placeholder="America/New_York"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}