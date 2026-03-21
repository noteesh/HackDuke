import { useAuth0 } from '@auth0/auth0-react';

export default function AuthGate({ children }) {
  const { isLoading, error, isAuthenticated, loginWithRedirect } = useAuth0();

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg font-mono">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-400 text-sm font-mono">
          Authentication Error: {error.message}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="max-w-md w-full px-8 py-12 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl text-center">
          <div className="mb-6">
            <div className="text-4xl font-black text-white tracking-tight mb-2">
              ⚡ THE OVERRIDE
            </div>
            <p className="text-gray-500 text-sm">
              Adversarial multi-agent review system
            </p>
          </div>
          
          <p className="text-gray-400 text-sm mb-8">
            Sign in to challenge algorithmic denials with AI agents
          </p>
          
          <button
            onClick={() => loginWithRedirect()}
            className="w-full bg-white text-gray-950 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return children;
}
