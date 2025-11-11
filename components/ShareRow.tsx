import { FC } from 'react';

interface ShareRowProps {
  url: string;
  title: string;
}

export const ShareRow: FC<ShareRowProps> = ({ url, title }) => {
  return (
    <div className="share-row">
      <span>Share this content:</span>
      {/* Add share buttons here */}
    </div>
  );
};