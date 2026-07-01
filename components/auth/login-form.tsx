"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { login, requestMagicLink, type AuthState } from "@/app/(auth)/actions";
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

export function LoginForm({ message }: { message?: string }) {
  const [loginState, loginAction] = useFormState(login, initialState);
  const [magicState, magicAction] = useFormState(
    requestMagicLink,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your InsureTrack account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
            {message}
          </p>
        )}

        <form action={loginAction} className="space-y-4">
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
              autoComplete="current-password"
              required
            />
          </div>

          {loginState?.error && (
            <p className="text-sm text-destructive">{loginState.error}</p>
          )}

          <SubmitButton className="w-full">Sign in</SubmitButton>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form action={magicAction} className="space-y-2">
          <Label htmlFor="magic-email">Email me a magic link</Label>
          <div className="flex gap-2">
            <Input
              id="magic-email"
              name="email"
              type="email"
              placeholder="you@agency.com"
              required
            />
            <SubmitButton variant="outline">Send</SubmitButton>
          </div>
          {magicState?.error && (
            <p className="text-sm text-destructive">{magicState.error}</p>
          )}
          {magicState?.message && (
            <p className="text-sm text-muted-foreground">
              {magicState.message}
            </p>
          )}
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Start free trial
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
