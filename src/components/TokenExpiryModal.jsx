import { useYouTube } from '../contexts/YouTubeContext';

export default function TokenExpiryModal() {
  const { showTokenExpiryWarning, refreshToken } = useYouTube();

  if (!showTokenExpiryWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              YouTube Token Expiring Soon
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Your YouTube access token will expire in less than 5 minutes. Click below to get a fresh token and continue working without interruption.
            </p>
            <button
              onClick={refreshToken}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get Fresh Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
