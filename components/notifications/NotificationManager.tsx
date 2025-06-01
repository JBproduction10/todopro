"use client"

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTodoStore } from '@/lib/stores/todoStore'
import { notificationService } from '@/lib/services/notificationService'

interface NotificationManagerProps {
  user: User
}

export function NotificationManager({ user }: NotificationManagerProps) {
  const { userPreferences, selectedTask, setSelectedTask } = useTodoStore()

  useEffect(() => {
    if (!userPreferences) return

    // Initialize notification service with user preferences
    notificationService.initialize({
      enabled: userPreferences.notification_enabled,
      reminderTime: userPreferences.reminder_time,
      motivationEnabled: true, // Could be added to user preferences
      habitTrackingEnabled: true, // Could be added to user preferences
      browserNotificationsEnabled: true // Could be added to user preferences
    })

    // Listen for custom events from notification service
    const handleOpenTask = (event: CustomEvent) => {
      setSelectedTask(event.detail)
    }

    const handleViewHabits = (event: CustomEvent) => {
      // TODO: Implement habit viewing functionality
      console.log('View habits for task:', event.detail)
    }

    window.addEventListener('openTask', handleOpenTask as EventListener)
    window.addEventListener('viewHabits', handleViewHabits as EventListener)

    // Cleanup function
    return () => {
      window.removeEventListener('openTask', handleOpenTask as EventListener)
      window.removeEventListener('viewHabits', handleViewHabits as EventListener)
    }
  }, [userPreferences, setSelectedTask])

  // Update notification settings when user preferences change
  useEffect(() => {
    if (userPreferences) {
      notificationService.updateSettings({
        enabled: userPreferences.notification_enabled,
        reminderTime: userPreferences.reminder_time
      })
    }
  }, [userPreferences?.notification_enabled, userPreferences?.reminder_time])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationService.destroy()
    }
  }, [])

  // This component manages notifications but doesn't render anything visible
  return null
}
