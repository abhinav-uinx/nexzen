import { AdminInsightProvider } from '@/providers/AdminInsightProvider'

export default function AdminLayout({ children }) {
  return (
    <AdminInsightProvider>
      <div className="min-h-screen bg-slate-50/50">
        {children}
      </div>
    </AdminInsightProvider>
  )
}
