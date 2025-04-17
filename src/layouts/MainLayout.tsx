
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  const { session } = useAuth()
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <div className="flex flex-1">
        {session && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}