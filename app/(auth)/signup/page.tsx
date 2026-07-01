import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Start free trial · InsureTrack",
};

export default function SignupPage() {
  return <SignupForm />;
}
