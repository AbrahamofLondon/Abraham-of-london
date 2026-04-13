import * as React from "react";

import { cn } from "@/lib/utils";

type TooltipContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(componentName: string): TooltipContextValue {
  const context = React.useContext(TooltipContext);

  if (!context) {
    throw new Error(`${componentName} must be used within <Tooltip>`);
  }

  return context;
}

export type TooltipProviderProps = {
  children: React.ReactNode;
};

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export type TooltipProps = {
  children: React.ReactNode;
};

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const contentId = React.useId();

  const value = React.useMemo<TooltipContextValue>(
    () => ({ contentId, open, setOpen }),
    [contentId, open],
  );

  return (
    <TooltipContext.Provider value={value}>
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
}

export type TooltipTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

type TriggerElementProps = React.HTMLAttributes<Element> & {
  ref?: React.Ref<unknown>;
};

export function TooltipTrigger({ children, asChild = false }: TooltipTriggerProps) {
  const { contentId, open, setOpen } = useTooltipContext("TooltipTrigger");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const triggerProps = {
    "aria-describedby": open ? contentId : undefined,
    onMouseEnter: handleOpen,
    onMouseLeave: handleClose,
    onFocus: handleOpen,
    onBlur: handleClose,
  };

  if (asChild && React.isValidElement<TriggerElementProps>(children)) {
    const child = children as React.ReactElement<TriggerElementProps>;
    const childProps = child.props;

    return React.cloneElement(child, {
      ...triggerProps,
      onMouseEnter: (event: React.MouseEvent) => {
        childProps.onMouseEnter?.(event);
        handleOpen();
      },
      onMouseLeave: (event: React.MouseEvent) => {
        childProps.onMouseLeave?.(event);
        handleClose();
      },
      onFocus: (event: React.FocusEvent) => {
        childProps.onFocus?.(event);
        handleOpen();
      },
      onBlur: (event: React.FocusEvent) => {
        childProps.onBlur?.(event);
        handleClose();
      },
    });
  }

  return (
    <span tabIndex={0} {...triggerProps}>
      {children}
    </span>
  );
}

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent({ className, sideOffset = 8, children, style, ...props }, ref) {
    const { contentId, open, setOpen } = useTooltipContext("TooltipContent");

    if (!open) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={contentId}
        role="tooltip"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={cn(
          "absolute left-1/2 top-full z-50 mt-2 w-max max-w-xs -translate-x-1/2 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white shadow-xl",
          className,
        )}
        style={{ marginTop: sideOffset, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
