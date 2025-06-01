"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTodoStore } from '@/lib/stores/todoStore'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/services/notificationService'
import { CalendarIntegration } from '../calendar/CalendarIntegration'
import { HabitDashboard } from '../habits/HabitDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  Calendar,
  Target,
  Settings,
  Save,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsPageProps {
  user: User
}

export function SettingsPage({ user }: SettingsPageProps) {
  const { userPreferences, updateUserPreferences } = useTodoStore()
  const [localPreferences, setLocalPreferences] = useState(userPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalPreferences(userPreferences)
  }, [userPreferences])

  const handlePreferenceChange = (key: string, value: any) => {
    if (!localPreferences) return

    const updated = { ...localPreferences, [key]: value }
    setLocalPreferences(updated)
    setHasChanges(true)
  }

  const savePreferences = async () => {
    if (!localPreferences) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          notification_enabled: localPreferences.notification_enabled,
          reminder_time: localPreferences.reminder_time,
          auto_background_change: localPreferences.auto_background_change,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      updateUserPreferences(localPreferences)

      // Update notification service
      notificationService.updateSettings({
        enabled: localPreferences.notification_enabled,
        reminderTime: localPreferences.reminder_time,
        motivationEnabled: true,
        habitTrackingEnabled: true,
        browserNotificationsEnabled: true
      })

      setHasChanges(false)
      toast.success('Settings saved successfully!')
    } catch (error: any) {
      toast.error(`Failed to save settings: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!')
      } else {
        toast.error('Browser notifications denied')
      }
    }
  }

  const getNotificationStatus = () => {
    if (!('Notification' in window)) {
      return { status: 'Not Supported', color: 'bg-gray-100 text-gray-800' }
    }

    switch (Notification.permission) {
      case 'granted':
        return { status: 'Enabled', color: 'bg-green-100 text-green-800' }
      case 'denied':
        return { status: 'Denied', color: 'bg-red-100 text-red-800' }
      default:
        return { status: 'Not Requested', color: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const notificationStatus = getNotificationStatus()

  if (!localPreferences) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your notifications, calendar sync, and habits
          </p>
        </div>

        {hasChanges && (
          <Button onClick={savePreferences} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="habits">
            <Target className="h-4 w-4 mr-2" />
            Habits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main notification toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders and updates for your tasks
                  </p>
                </div>
                <Switch
                  checked={localPreferences.notification_enabled}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange('notification_enabled', checked)
                  }
                />
              </div>

              {localPreferences.notification_enabled && (
                <>
                  {/* Browser notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Browser Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get desktop notifications even when app is closed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={notificationStatus.color}>
                        {notificationStatus.status}
                      </Badge>
                      {Notification.permission !== 'granted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={requestNotificationPermission}
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reminder timing */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium">Reminder Timing</p>
                      <p className="text-sm text-muted-foreground">
                        Get reminded {localPreferences.reminder_time} minutes before tasks are due
                      </p>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[localPreferences.reminder_time]}
                        onValueChange={(value) =>
                          handlePreferenceChange('reminder_time', value[0])
                        }
                        min={5}
                        max={120}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5 min</span>
                        <span>2 hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Motivation messages */}
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        Smart Features Enabled
                      </span>
                    </div>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Motivational messages based on your progress</li>
                      <li>• Habit formation notifications (4+ completions/week)</li>
                      <li>• Overdue task alerts</li>
                      <li>• Productivity insights</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarIntegration user={user} />
        </TabsContent>

        <TabsContent value="habits">
          <HabitDashboard user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
