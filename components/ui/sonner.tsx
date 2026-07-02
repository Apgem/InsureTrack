"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast host. Colors per type are applied in globals.css via the
 * [data-sonner-toast][data-type="…"] selectors; base shape/typography here.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 500,
        },
      }}
    />
  );
}