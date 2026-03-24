import * as React from "react";

type ProviderElement = React.ReactElement<{ children?: React.ReactNode }>;

type ProviderComposerProps = {
  providers: ProviderElement[];
  children: React.ReactNode;
};

export function ProviderComposer({
  providers,
  children,
}: ProviderComposerProps) {
  return providers.reduceRight<React.ReactNode>((acc, provider) => {
    return React.cloneElement(provider, {
      children: acc,
    });
  }, children) as React.ReactElement;
}

export default ProviderComposer;