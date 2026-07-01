import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · InsureTrack",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  return <LoginForm message={searchParams.message} />;
}
