"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { signup, type AuthState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = undefined;

export function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Start your free trial</CardTitle>
        <CardDescription>
          14 days free. No credit card required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Agent"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input
              id="agencyName"
              name="agencyName"
              type="text"
              autoComplete="organization"
              placeholder="Agent Insurance Group"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@agency.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <SubmitButton className="w-full">Create account</SubmitButton>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
