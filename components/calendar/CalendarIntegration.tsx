"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTodoStore } from '@/lib/stores/todoStore'
import { calendarService } from '@/lib/services/calendarService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  CalendarCheck,
  RefreshCw,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface CalendarIntegrationProps {
  user: User
}

export function CalendarIntegration({ user }: CalendarIntegrationProps) {
  const { tasks, getPendingTasks } = useTodoStore()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const [syncStats, setSyncStats] = useState({ synced: 0, pending: 0 })

  useEffect(() => {
    checkConnectionStatus()
    loadSyncPreferences()
  }, [])

  useEffect(() => {
    updateSyncStats()
  }, [tasks])

  const checkConnectionStatus = async () => {
    const initialized = await calendarService
    if (initialized) {
      setIsConnected(calendarService.isSignedIn())
    }
  }

  const loadSyncPreferences = () => {
    const savedAutoSync = localStorage.getItem('calendar_auto_sync')
    setAutoSync(savedAutoSync === 'true')
  }

  const updateSyncStats = () => {
    const pendingTasks = getPendingTasks().filter(task => task.due_date)
    const syncedCount = pendingTasks.filter(task =>
      localStorage.getItem(`calendar_event_${task.id}`)
    ).length

    setSyncStats({
      synced: syncedCount,
      pending: pendingTasks.length - syncedCount
    })
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const success = await calendarService.signIn()
      setIsConnected(success)

      if (success && autoSync) {
        await handleSyncAll()
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await calendarService.signOut()
      setIsConnected(false)

      // Clear stored event IDs
      tasks.forEach(task => {
        localStorage.removeItem(`calendar_event_${task.id}`)
      })

      updateSyncStats()
    } catch (error) {
      console.error('Failed to disconnect calendar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncAll = async () => {
    if (!isConnected) {
      toast.error('Please connect to Google Calendar first')
      return
    }

    setIsLoading(true)
    try {
      const pendingTasks = getPendingTasks().filter(task =>
        task.due_date && !localStorage.getItem(`calendar_event_${task.id}`)
      )

      const result = await calendarService.bulkSyncTasks(pendingTasks)
      updateSyncStats()

      if (result.success > 0) {
        toast.success(`Synced ${result.success} tasks to calendar`)
      }
    } catch (error) {
      console.error('Failed to sync tasks:', error)
      toast.error('Failed to sync tasks to calendar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled)
    localStorage.setItem('calendar_auto_sync', enabled.toString())

    if (enabled && isConnected && syncStats.pending > 0) {
      toast.success('Auto-sync enabled! New tasks will be automatically synced.')
    }
  }

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        status: 'Connected',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <CalendarCheck className="h-4 w-4" />
      }
    }
    return {
      status: 'Not Connected',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      icon: <Calendar className="h-4 w-4" />
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Google Calendar</CardTitle>
          </div>
          <Badge className={connectionStatus.color}>
            {connectionStatus.icon}
            {connectionStatus.status}
          </Badge>
        </div>
        <CardDescription>
          Sync your tasks with Google Calendar to never miss a deadline
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Calendar Connection</p>
            <p className="text-sm text-muted-foreground">
              {isConnected
                ? 'Your tasks can be synced to Google Calendar'
                : 'Connect to sync tasks with your Google Calendar'
              }
            </p>
          </div>
          <Button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isLoading}
            variant={isConnected ? 'outline' : 'default'}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              connectionStatus.icon
            )}
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>

        {isConnected && (
          <>
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Auto Sync</p>
                <p className="text-sm text-muted-foreground">
                  Automatically sync new tasks with due dates
                </p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={handleAutoSyncToggle}
              />
            </div>

            {/* Sync Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Synced
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {syncStats.synced}
                </div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Pending
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {syncStats.pending}
                </div>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Total
                </div>
                <div className="text-2xl font-bold">
                  {syncStats.synced + syncStats.pending}
                </div>
              </div>
            </div>

            {/* Sync Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSyncAll}
                disabled={isLoading || syncStats.pending === 0}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CalendarCheck className="h-4 w-4 mr-2" />
                )}
                Sync {syncStats.pending} Pending Tasks
              </Button>

              {syncStats.pending === 0 && syncStats.synced > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  ✅ All tasks with due dates are synced
                </p>
              )}
            </div>
          </>
        )}

        {/* Help Text */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Why connect Google Calendar?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• View your tasks alongside other events</li>
              <li>• Get calendar notifications for due dates</li>
              <li>• Better time management and planning</li>
              <li>• Access tasks from any calendar app</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
