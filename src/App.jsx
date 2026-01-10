import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Dance Library</h1>
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-gray-400 text-center">
          Tailwind CSS is working! 🎉
        </p>
      </div>
    </div>
  )
}

export default App

