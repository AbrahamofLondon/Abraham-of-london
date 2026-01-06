interface ConnectionStatusProps {
  isConnected: boolean;
  connectionId?: string;
  lastUpdate?: string;
  theme: 'light' | 'dark';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionId,
  lastUpdate,
  theme,
}) => {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <div className="text-sm">
        <div className="font-medium">
          {isConnected ? 'Live Connected' : 'Disconnected'}
        </div>
        <div className={`text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {isConnected
            ? lastUpdate
              ? `Updated ${new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Receiving data...'
            : 'Reconnecting...'
          }
        </div>
      </div>
    </div>
  );
};