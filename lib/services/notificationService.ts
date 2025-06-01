import { type Task, TaskLog, supabase } from '../supabase'
import { toast } from 'sonner'

export interface NotificationSettings {
  enabled: boolean
  reminderTime: number // minutes before due date
  motivationEnabled: boolean
  habitTrackingEnabled: boolean
  browserNotificationsEnabled: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private settings: NotificationSettings = {
    enabled: true,
    reminderTime: 30,
    motivationEnabled: true,
    habitTrackingEnabled: true,
    browserNotificationsEnabled: false
  }
  private reminderCheckInterval: NodeJS.Timeout | null = null
  private motivationInterval: NodeJS.Timeout | null = null
  private habitCheckInterval: NodeJS.Timeout | null = null

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async initialize(settings: NotificationSettings) {
    this.settings = settings

    if (this.settings.enabled) {
      // Request browser notification permission
      if (this.settings.browserNotificationsEnabled && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        this.settings.browserNotificationsEnabled = permission === 'granted'
      }

      this.startReminderChecks()
      this.startMotivationMessages()
      this.startHabitTracking()
    }
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }

    if (!this.settings.enabled) {
      this.stopAllNotifications()
    } else {
      this.initialize(this.settings)
    }
  }

  private startReminderChecks() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval)
    }

    // Check every 5 minutes for due reminders
    this.reminderCheckInterval = setInterval(() => {
      this.checkDueReminders()
    }, 5 * 60 * 1000)

    // Initial check
    this.checkDueReminders()
  }

  private async checkDueReminders() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('completed', false)
        .not('due_date', 'is', null)

      if (!tasks) return

      const now = new Date()
      const reminderThreshold = new Date(now.getTime() + this.settings.reminderTime * 60 * 1000)

      for (const task of tasks) {
        const dueDate = new Date(task.due_date!)

        // Check if task is due within reminder time
        if (dueDate <= reminderThreshold && dueDate > now) {
          const minutesUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60))

          // Avoid duplicate notifications by checking if we already sent one
          const notificationKey = `reminder_${task.id}_${dueDate.getTime()}`
          if (localStorage.getItem(notificationKey)) continue

          this.sendDueReminder(task, minutesUntilDue)
          localStorage.setItem(notificationKey, 'sent')
        }

        // Check for overdue tasks
        if (dueDate < now) {
          const overdueKey = `overdue_${task.id}_${dueDate.toDateString()}`
          if (localStorage.getItem(overdueKey)) continue

          this.sendOverdueNotification(task)
          localStorage.setItem(overdueKey, 'sent')
        }
      }
    } catch (error) {
      console.error('Error checking due reminders:', error)
    }
  }

  private sendDueReminder(task: Task, minutesUntilDue: number) {
    const message = minutesUntilDue > 0
      ? `"${task.title}" is due in ${minutesUntilDue} minutes!`
      : `"${task.title}" is due now!`

    // Toast notification
    toast(message, {
      description: task.description || 'Click to view details',
      action: {
        label: 'View Task',
        onClick: () => {
          // Dispatch custom event to open task
          window.dispatchEvent(new CustomEvent('openTask', { detail: task }))
        }
      },
      duration: 10000
    })

    // Browser notification
    if (this.settings.browserNotificationsEnabled) {
      this.sendBrowserNotification(
        'Task Reminder',
        message,
        task.description || ''
      )
    }
  }

  private sendOverdueNotification(task: Task) {
    const message = `"${task.title}" is overdue!`

    toast.error(message, {
      description: task.description || 'This task needs your attention',
      action: {
        label: 'Complete Now',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('openTask', { detail: task }))
        }
      },
      duration: 15000
    })

    if (this.settings.browserNotificationsEnabled) {
      this.sendBrowserNotification(
        'Overdue Task',
        message,
        task.description || 'This task needs your attention'
      )
    }
  }

  private startMotivationMessages() {
    if (!this.settings.motivationEnabled) return

    if (this.motivationInterval) {
      clearInterval(this.motivationInterval)
    }

    // Send motivation message every 2 hours during work hours (9 AM - 6 PM)
    this.motivationInterval = setInterval(() => {
      const hour = new Date().getHours()
      if (hour >= 9 && hour <= 18) {
        this.sendMotivationMessage()
      }
    }, 2 * 60 * 60 * 1000)
  }

  private async sendMotivationMessage() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get recent completion stats
      const { data: recentLogs } = await supabase
        .from('task_logs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('action', 'completed')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const completedToday = recentLogs?.length || 0
      const motivationMessages = this.getMotivationMessages(completedToday)
      const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)]

      toast.success(randomMessage, {
        description: `You've completed ${completedToday} tasks today!`,
        duration: 5000
      })
    } catch (error) {
      console.error('Error sending motivation message:', error)
    }
  }

  private getMotivationMessages(completedToday: number): string[] {
    if (completedToday === 0) {
      return [
        "Every journey begins with a single step! Start your first task today.",
        "The best time to start was yesterday. The second best time is now!",
        "Small progress is still progress. Begin with one task!",
        "Your future self will thank you for starting today.",
        "Productivity is about progress, not perfection. Let's begin!"
      ]
    }

    if (completedToday <= 2) {
      return [
        "Great start! You're building momentum.",
        "Every completed task is a victory! Keep going!",
        "You're on the right track. What's next on your list?",
        "Consistency is key. You're doing amazing!",
        "Small wins lead to big achievements!"
      ]
    }

    if (completedToday <= 5) {
      return [
        "You're on fire today! Amazing progress!",
        "Look at you being productive! Keep it up!",
        "You're crushing your goals today!",
        "This is what success looks like! Well done!",
        "Your dedication is inspiring!"
      ]
    }

    return [
      "Incredible productivity today! You're unstoppable!",
      "You're a productivity machine! Outstanding work!",
      "Today you're showing what excellence looks like!",
      "Your commitment to getting things done is remarkable!",
      "You've turned productivity into an art form today!"
    ]
  }

  private startHabitTracking() {
    if (!this.settings.habitTrackingEnabled) return

    if (this.habitCheckInterval) {
      clearInterval(this.habitCheckInterval)
    }

    // Check for habits daily at 8 PM
    this.habitCheckInterval = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        this.checkHabits()
      }
    }, 60 * 1000) // Check every minute, but only trigger at 8:00 PM
  }

  private async checkHabits() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get task completion data for the past week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: logs } = await supabase
        .from('task_logs')
        .select(`
          *,
          task:tasks(title, description)
        `)
        .eq('user_id', user.user.id)
        .eq('action', 'completed')
        .gte('completed_at', weekAgo.toISOString())

      if (!logs) return

      // Group by task and count completions
      const taskCompletions = new Map<string, { count: number; task: Task }>()

      logs.forEach(log => {
        const taskId = log.task_id
        const existing = taskCompletions.get(taskId)
        if (existing) {
          existing.count++
        } else {
          taskCompletions.set(taskId, {
            count: 1,
            task: log.task as any
          })
        }
      })

      // Find tasks completed 4+ times this week (habit candidates)
      taskCompletions.forEach(({ count, task }) => {
        if (count >= 4) {
          this.sendHabitFormationNotification(task, count)
        }
      })

    } catch (error) {
      console.error('Error checking habits:', error)
    }
  }

  private sendHabitFormationNotification(task: Task, completionCount: number) {
    const habitKey = `habit_${task.id}_${new Date().getISOWeek()}`
    if (localStorage.getItem(habitKey)) return

    const message = `🎉 "${task.title}" is becoming a habit!`
    const description = `You've completed this task ${completionCount} times this week!`

    toast.success(message, {
      description,
      action: {
        label: 'View Streak',
        onClick: () => {
          window.dispatchEvent(new CustomEvent('viewHabits', { detail: task }))
        }
      },
      duration: 8000
    })

    if (this.settings.browserNotificationsEnabled) {
      this.sendBrowserNotification('Habit Formed!', message, description)
    }

    localStorage.setItem(habitKey, 'sent')
  }

  private sendBrowserNotification(title: string, body: string, tag?: string) {
    if (!this.settings.browserNotificationsEnabled || !('Notification' in window)) {
      return
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        tag: tag || 'todo-app',
        icon: '/favicon.ico',
        requireInteraction: false
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)
    }
  }

  stopAllNotifications() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval)
      this.reminderCheckInterval = null
    }

    if (this.motivationInterval) {
      clearInterval(this.motivationInterval)
      this.motivationInterval = null
    }

    if (this.habitCheckInterval) {
      clearInterval(this.habitCheckInterval)
      this.habitCheckInterval = null
    }
  }

  destroy() {
    this.stopAllNotifications()
  }
}

// Extend Date prototype to get ISO week number
declare global {
  interface Date {
    getISOWeek(): number
  }
}

Date.prototype.getISOWeek = function() {
  const date = new Date(this.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

export const notificationService = NotificationService.getInstance()
