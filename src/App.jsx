import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'

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
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dance Library</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {user.displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Welcome to Dance Library! 🎉</h2>
          <p className="text-gray-400">
            Firebase Authentication is working. Ready to start building features!
          </p>
        </div>
      </main>
    </div>
  )
}

export default App

