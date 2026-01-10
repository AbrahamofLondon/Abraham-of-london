import { FC, ReactNode } from "react";

interface VerseProps {
  children: ReactNode;
  reference?: string;
}

export const Verse: FC<VerseProps> = ({ children, reference }) => {
  return (
    <div className="verse">
      <div className="verse-content">{children}</div>
      {reference && <div className="verse-reference">{reference}</div>}
    </div>
  );
};

