import { FC, ReactNode } from 'react';

interface NoteProps {
  children: ReactNode;
  className?: string;
}

export const Note: FC<NoteProps> = ({ children, className = '' }) => {
  return (
    <div className={`note-container ${className}`}>
      {children}
    </div>
  );
};