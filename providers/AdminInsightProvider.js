'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import AdminInsightViewer from '@/components/admin/AdminInsightViewer'

const InsightContext = createContext({
  activeInsight: null,
  showInsight: (key) => {},
  hideInsight: () => {},
  toggleInsight: (key) => {},
})

export function AdminInsightProvider({ children }) {
  const [activeInsightKey, setActiveInsightKey] = useState(null)
  const timerRef = useRef(null)

  const showInsight = useCallback((key) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setActiveInsightKey(key)
  }, [])

  const hideInsight = useCallback(() => {
    // Small delay to allow moving from badge to window if needed, 
    // though PiP typically just stays until closed or another opens
    timerRef.current = setTimeout(() => {
      setActiveInsightKey(null)
    }, 100)
  }, [])

  const toggleInsight = useCallback((key) => {
    setActiveInsightKey(prev => prev === key ? null : key)
  }, [])

  return (
    <InsightContext.Provider value={{ activeInsight: activeInsightKey, showInsight, hideInsight, toggleInsight }}>
      {children}
      <AdminInsightViewer />
    </InsightContext.Provider>
  )
}

export const useAdminInsight = () => useContext(InsightContext)
