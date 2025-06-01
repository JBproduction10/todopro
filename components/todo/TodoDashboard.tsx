"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useTodoStore } from '@/lib/stores/todoStore'
import { calendarService } from '@/lib/services/calendarService'
import { TodoHeader } from './TodoHeader'
import { TodoSidebar } from './TodoSidebar'
import { TodoMain } from './TodoMain'
import { TaskDialog } from './TaskDialog'
import { SettingsPage } from '../settings/SettingsManager'
import { BackgroundManager } from '../background/BackgroundManager'
import { NotificationManager } from '../notifications/NotificationManager'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface TodoDashboardProps {
  user: User
}

export function TodoDashboard({ user }: TodoDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('notifications')
  const {
    setTasks,
    setCategories,
    setUserPreferences,
    setIsLoading,
    selectedTask,
    setSelectedTask,
    userPreferences,
    tasks
  } = useTodoStore()

  useEffect(() => {
    loadUserData()
  }, [user.id])

  useEffect(() => {
    // Listen for settings events
    const handleOpenSettings = (event: CustomEvent) => {
      setSettingsTab(event.detail || 'notifications')
      setSettingsOpen(true)
    }

    window.addEventListener('openSettings', handleOpenSettings as EventListener)

    return () => {
      window.removeEventListener('openSettings', handleOpenSettings as EventListener)
    }
  }, [])

  // Auto-sync with calendar when tasks change
  useEffect(() => {
    if (userPreferences && tasks.length > 0) {
      const autoSync = localStorage.getItem('calendar_auto_sync') === 'true'
      if (autoSync && calendarService.isSignedIn()) {
        handleAutoSync()
      }
    }
  }, [tasks, userPreferences])

  const handleAutoSync = async () => {
    try {
      // Only sync tasks with due dates that haven't been synced yet
      const unsyncedTasks = tasks.filter(task =>
        task.due_date &&
        !task.completed &&
        !localStorage.getItem(`calendar_event_${task.id}`)
      )

      if (unsyncedTasks.length > 0) {
        for (const task of unsyncedTasks) {
          const eventId = await calendarService.syncTaskToCalendar(task)
          if (eventId) {
            localStorage.setItem(`calendar_event_${task.id}`, eventId)
          }
        }
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      // Load tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })

      if (tasksError) throw tasksError
      setTasks(tasks || [])

      // Load categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categories || [])

      // Load user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError
      }

      if (preferences) {
        setUserPreferences(preferences)
      } else {
        // Create default preferences
        const { data: newPreferences, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            theme: 'light',
            notification_enabled: true,
            reminder_time: 30,
            auto_background_change: true
          })
          .select()
          .single()

        if (createError) throw createError
        setUserPreferences(newPreferences)
      }
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-background transition-all duration-300"
      style={{
        backgroundImage: userPreferences?.background_image_url
          ? `url(${userPreferences.background_image_url})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay for better readability */}
      {userPreferences?.background_image_url && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />
      )}

      <div className="relative z-10">
        <TodoHeader
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex">
          <TodoSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <TodoMain />
        </div>

        {selectedTask && (
          <TaskDialog
            task={selectedTask}
            open={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <SettingsPage user={user} />
          </DialogContent>
        </Dialog>

        <BackgroundManager user={user} />
        <NotificationManager user={user} />
      </div>
    </div>
  )
}
