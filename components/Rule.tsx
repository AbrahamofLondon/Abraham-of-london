import { FC } from "react";

interface RuleProps {
  className?: string;
}

export const Rule: FC<RuleProps> = ({ className = "" }) => {
  return <hr className={`rule ${className}`} />;
};
