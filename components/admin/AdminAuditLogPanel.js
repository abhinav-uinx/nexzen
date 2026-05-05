'use client'

import { useEffect, useState } from 'react'
import { withAdminHeaders } from '@/lib/admin/client'

export default function AdminAuditLogPanel() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await fetch('/api/admin/audit-logs', {
          headers: withAdminHeaders(),
        })
        const result = await response.json().catch(() => ({ logs: [] }))
        if (response.ok) {
          setLogs(Array.isArray(result.logs) ? result.logs : [])
        }
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-blue-700">Audit Trail</p>
      <h2 className="mt-3 font-heading text-2xl font-semibold text-slate-950">Recent admin activity</h2>
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading audit entries...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <span>{log.adminUsername}</span>
                <span>{log.entityType}</span>
                <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">{log.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
