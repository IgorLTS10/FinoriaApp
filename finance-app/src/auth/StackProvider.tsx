import type { PropsWithChildren } from "react";           // <- type-only
import { StackProvider } from "@stackframe/react";
import { stackClientApp } from "./stack";

export default function AuthRootProvider({ children }: PropsWithChildren) {
  return (
    <StackProvider app={stackClientApp} lang="fr-FR">
      {children}
    </StackProvider>
  );
}
