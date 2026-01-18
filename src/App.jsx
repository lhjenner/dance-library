import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Playlists from './components/playlists'
import TokenExpiryModal from './components/TokenExpiryModal'

function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TokenExpiryModal />
      <nav className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Dance Library</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">
              {user.displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="bg-gray-700 hover:bg-gray-600 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Playlists />
      </main>
    </div>
  )
}

export default App

