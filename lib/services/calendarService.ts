import type { Task } from '../supabase'
import { toast } from 'sonner'

interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  status?: 'confirmed' | 'tentative' | 'cancelled'
  colorId?: string
}

export class CalendarService {
  private apiKey: string
  private accessToken: string | null = null
  private tokenClient: any = null
  private calendarId: "primary" = "primary"

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || ''
  }

  // Load the Google Identity Services script
  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
      document.head.appendChild(script)
    })
  }

  // Initialize the token client
  async initializeAuth(): Promise<boolean> {
    try {
      await this.loadGisScript()

      // Initialize the token client
      this.tokenClient = window.google?.accounts?.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: 'https://www.googleapis.com/auth/calendar',
        callback: (tokenResponse: any) => {
          this.accessToken = tokenResponse.access_token
        },
        error_callback: (error: any) => {
          console.error('Google token client error:', error)
        }
      })

      return true
    } catch (error) {
      console.error('Failed to initialize Google Calendar auth:', error)
      return false
    }
  }

  async signIn(): Promise<boolean> {
    if (!this.tokenClient) {
      await this.initializeAuth()
    }

    return new Promise((resolve) => {
      // Set the callback for when the token is received
      const originalCallback = this.tokenClient.callback
      this.tokenClient.callback = (tokenResponse: any) => {
        this.accessToken = tokenResponse.access_token
        originalCallback(tokenResponse)
        resolve(true)
      }

      this.tokenClient.requestAccessToken()
    })
  }

  async signOut(): Promise<void> {
    if (this.accessToken) {
      try {
        // Revoke the access token
        await window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Access token revoked')
        })
      } catch (error) {
        console.error('Failed to revoke token:', error)
      }
      this.accessToken = null
    }
  }

  isSignedIn(): boolean {
    return this.accessToken !== null
  }

  async syncTaskToCalendar(task: Task): Promise<string | null> {
    if (!this.isSignedIn() || !task.due_date) {
      return null
    }

    try {
      const event: GoogleCalendarEvent = {
        summary: `📋 ${task.title}`,
        description: this.formatTaskDescription(task),
        start: this.formatDateTime(task.due_date),
        end: this.formatDateTime(task.due_date, 30), // 30-minute duration
        colorId: this.getColorId(task.priority),
        status: task.completed ? 'cancelled' : 'confirmed'
      }

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: this.calendarId,
        resource: event
      })

      if (response.status === 200) {
        toast.success(`Task synced to calendar: ${task.title}`)
        return response.result.id
      }

      return null
    } catch (error) {
      console.error('Failed to sync task to calendar:', error)
      toast.error('Failed to sync task to calendar')
      return null
    }
  }

  async updateCalendarEvent(task: Task, eventId: string): Promise<boolean> {
    if (!this.isSignedIn()) return false

    try {
      const event: GoogleCalendarEvent = {
        summary: `📋 ${task.title}`,
        description: this.formatTaskDescription(task),
        start: this.formatDateTime(task.due_date!),
        end: this.formatDateTime(task.due_date!, 30),
        colorId: this.getColorId(task.priority),
        status: task.completed ? 'cancelled' : 'confirmed'
      }

      const response = await window.gapi.client.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: event
      })

      return response.status === 200
    } catch (error) {
      console.error('Failed to update calendar event:', error)
      return false
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    if (!this.isSignedIn()) return false

    try {
      const response = await window.gapi.client.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId
      })

      return response.status === 204
    } catch (error) {
      console.error('Failed to delete calendar event:', error)
      return false
    }
  }

  async bulkSyncTasks(tasks: Task[]): Promise<{ success: number; failed: number }> {
    if (!this.isSignedIn()) {
      toast.error('Please sign in to Google Calendar first')
      return { success: 0, failed: tasks.length }
    }

    let success = 0
    let failed = 0

    toast.loading(`Syncing ${tasks.length} tasks to calendar...`)

    for (const task of tasks) {
      if (task.due_date) {
        const eventId = await this.syncTaskToCalendar(task)
        if (eventId) {
          success++
          // Store the event ID for future updates
          localStorage.setItem(`calendar_event_${task.id}`, eventId)
        } else {
          failed++
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    toast.dismiss()

    if (success > 0) {
      toast.success(`Synced ${success} tasks to calendar`)
    }

    if (failed > 0) {
      toast.error(`Failed to sync ${failed} tasks`)
    }

    return { success, failed }
  }

  async getUpcomingEvents(days = 7): Promise<GoogleCalendarEvent[]> {
    if (!this.isSignedIn()) return []

    try {
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      const response = await window.gapi.client.calendar.events.list({
        calendarId: this.calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        q: '📋' // Only get our todo events
      })

      return response.result.items || []
    } catch (error) {
      console.error('Failed to get calendar events:', error)
      return []
    }
  }

  private formatTaskDescription(task: Task): string {
    let description = `Todo Task: ${task.title}\n\n`

    if (task.description) {
      description += `Description: ${task.description}\n\n`
    }

    description += `Priority: ${this.getPriorityLabel(task.priority)}\n`
    description += `Status: ${task.completed ? 'Completed' : 'Pending'}\n\n`
    description += 'Created by TodoPro App'

    return description
  }

  private formatDateTime(dateString: string, durationMinutes = 0): { dateTime: string; timeZone: string } {
    const date = new Date(dateString)
    if (durationMinutes > 0) {
      date.setMinutes(date.getMinutes() + durationMinutes)
    }

    return {
      dateTime: date.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  private getColorId(priority: number): string {
    // Google Calendar color IDs
    switch (priority) {
      case 5: return '11' // Red (Very High)
      case 4: return '6'  // Orange (High)
      case 3: return '5'  // Yellow (Medium)
      case 2: return '7'  // Blue (Low)
      case 1: return '8'  // Gray (Very Low)
      default: return '1' // Blue (default)
    }
  }

  private getPriorityLabel(priority: number): string {
    switch (priority) {
      case 5: return 'Very High'
      case 4: return 'High'
      case 3: return 'Medium'
      case 2: return 'Low'
      case 1: return 'Very Low'
      default: return 'Medium'
    }
  }
}

// Extend window object for Google API
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void
      auth2: {
        init: (config: { client_id: string }) => Promise<any>
        getAuthInstance: () => {
          signIn: (config: { scope: string }) => Promise<any>
          signOut: () => Promise<void>
          isSignedIn: {
            get: () => boolean
          }
        }
      }
      client: {
        init: (config: {
          apiKey: string
          discoveryDocs: string[]
        }) => Promise<void>
        calendar: {
          events: {
            insert: (params: { calendarId: string; resource: GoogleCalendarEvent }) => Promise<any>
            update: (params: { calendarId: string; eventId: string; resource: GoogleCalendarEvent }) => Promise<any>
            delete: (params: { calendarId: string; eventId: string }) => Promise<any>
            list: (params: {
              calendarId: string
              timeMin?: string
              timeMax?: string
              singleEvents?: boolean
              orderBy?: string
              q?: string
            }) => Promise<any>
          }
        }
      }
    }
  }
}

export const calendarService = new CalendarService()

// Type declarations for Google API
declare global {
  interface Window {
    google: any
  }
}
