import type { PropsWithChildren } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function TooltipProviderWrapper({ children }: PropsWithChildren) {
  return (
    <Tooltip.Provider delayDuration={100}>
      {children}
    </Tooltip.Provider>
  );
}
