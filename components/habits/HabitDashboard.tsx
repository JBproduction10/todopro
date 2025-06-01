"use client"

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Task } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// import {
//   Target,
//   TrendingUp,
//   Calendar,
//   Award,
//   Fire
// } from 'lucide-react'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { Target, Award, TrendingUp, Calendar, Flame } from 'lucide-react'

interface HabitData {
  task: Task
  completionsThisWeek: number
  streak: number
  weeklyCompletions: { [key: string]: number }
  isHabit: boolean
}

interface HabitDashboardProps {
  user: User
}

export function HabitDashboard({ user }: HabitDashboardProps) {
  const [habits, setHabits] = useState<HabitData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weekStats, setWeekStats] = useState({
    totalHabits: 0,
    activeHabits: 0,
    perfectWeeks: 0,
    averageCompletions: 0
  })

  useEffect(() => {
    loadHabitData()
  }, [user.id])

  const loadHabitData = async () => {
    setIsLoading(true)
    try {
      // Get all task completion logs for the past 8 weeks
      const eightWeeksAgo = new Date()
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

      const { data: logs, error } = await supabase
        .from('task_logs')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('user_id', user.id)
        .eq('action', 'completed')
        .gte('completed_at', eightWeeksAgo.toISOString())
        .order('completed_at', { ascending: false })

      if (error) throw error

      const habitData = analyzeHabits(logs || [])
      setHabits(habitData)
      calculateWeekStats(habitData)
    } catch (error) {
      console.error('Error loading habit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeHabits = (logs: any[]): HabitData[] => {
    const taskCompletions = new Map<string, any[]>()

    // Group completions by task
    logs.forEach(log => {
      if (!log.task) return

      const taskId = log.task.id
      if (!taskCompletions.has(taskId)) {
        taskCompletions.set(taskId, [])
      }
      taskCompletions.get(taskId)!.push(log)
    })

    const habitData: HabitData[] = []
    const currentWeekStart = startOfWeek(new Date())
    const currentWeekEnd = endOfWeek(new Date())

    taskCompletions.forEach((completions, taskId) => {
      const task = completions[0].task

      // Count completions this week
      const thisWeekCompletions = completions.filter(log => {
        const completedAt = parseISO(log.completed_at)
        return completedAt >= currentWeekStart && completedAt <= currentWeekEnd
      }).length

      // Calculate weekly completion pattern
      const weeklyCompletions = calculateWeeklyPattern(completions)

      // Calculate streak
      const streak = calculateStreak(completions)

      // Determine if this is a habit (completed 4+ times in any week)
      const maxWeeklyCompletions = Math.max(...Object.values(weeklyCompletions))
      const isHabit = maxWeeklyCompletions >= 4

      if (isHabit || thisWeekCompletions >= 3) {
        habitData.push({
          task,
          completionsThisWeek: thisWeekCompletions,
          streak,
          weeklyCompletions,
          isHabit
        })
      }
    })

    // Sort by habit strength (combinations of frequency and streak)
    return habitData.sort((a, b) => {
      const scoreA = a.completionsThisWeek * 2 + a.streak
      const scoreB = b.completionsThisWeek * 2 + b.streak
      return scoreB - scoreA
    })
  }

  const calculateWeeklyPattern = (completions: any[]): { [key: string]: number } => {
    const weeklyPattern: { [key: string]: number } = {}

    // Last 8 weeks
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(new Date())
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = endOfWeek(weekStart)

      const weekKey = format(weekStart, 'yyyy-MM-dd')
      const weekCompletions = completions.filter(log => {
        const completedAt = parseISO(log.completed_at)
        return completedAt >= weekStart && completedAt <= weekEnd
      }).length

      weeklyPattern[weekKey] = weekCompletions
    }

    return weeklyPattern
  }

  const calculateStreak = (completions: any[]): number => {
    if (completions.length === 0) return 0

    // Sort by completion date
    const sortedCompletions = completions.sort((a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )

    let streak = 0
    const currentDate = new Date()

    // Start from today and count backwards
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(currentDate)
      checkDate.setDate(checkDate.getDate() - i)

      const hasCompletion = sortedCompletions.some(log => {
        const completedDate = new Date(log.completed_at)
        return completedDate.toDateString() === checkDate.toDateString()
      })

      if (hasCompletion) {
        streak++
      } else if (streak > 0) {
        break // Streak broken
      }
    }

    return streak
  }

  const calculateWeekStats = (habitData: HabitData[]) => {
    const totalHabits = habitData.filter(h => h.isHabit).length
    const activeHabits = habitData.filter(h => h.completionsThisWeek >= 4).length
    const perfectWeeks = habitData.filter(h => h.completionsThisWeek >= 7).length
    const averageCompletions = habitData.length > 0
      ? habitData.reduce((sum, h) => sum + h.completionsThisWeek, 0) / habitData.length
      : 0

    setWeekStats({
      totalHabits,
      activeHabits,
      perfectWeeks,
      averageCompletions: Math.round(averageCompletions * 10) / 10
    })
  }

  const getHabitStrength = (habit: HabitData): { label: string; color: string; progress: number } => {
    const score = habit.completionsThisWeek

    if (score >= 7) {
      return { label: 'Perfect', color: 'text-green-600', progress: 100 }
    } else if (score >= 5) {
      return { label: 'Strong', color: 'text-blue-600', progress: 80 }
    } else if (score >= 3) {
      return { label: 'Building', color: 'text-yellow-600', progress: 60 }
    } else {
      return { label: 'Weak', color: 'text-red-600', progress: 30 }
    }
  }

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { icon: '🏆', label: 'Champion', color: 'bg-yellow-100 text-yellow-800' }
    if (streak >= 14) return { icon: '🔥', label: 'On Fire', color: 'bg-red-100 text-red-800' }
    if (streak >= 7) return { icon: '⭐', label: 'Strong', color: 'bg-blue-100 text-blue-800' }
    if (streak >= 3) return { icon: '📈', label: 'Building', color: 'bg-green-100 text-green-800' }
    return { icon: '🌱', label: 'Starting', color: 'bg-gray-100 text-gray-800' }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habit Tracking</CardTitle>
          <CardDescription>Loading your habit data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{weekStats.totalHabits}</div>
            <div className="text-sm text-muted-foreground">Total Habits</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{weekStats.activeHabits}</div>
            <div className="text-sm text-muted-foreground">Active This Week</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{weekStats.perfectWeeks}</div>
            <div className="text-sm text-muted-foreground">Perfect Habits</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{weekStats.averageCompletions}</div>
            <div className="text-sm text-muted-foreground">Avg. Per Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Habit List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Habits This Week
          </CardTitle>
          <CardDescription>
            Tasks you've completed multiple times recently
          </CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No habits detected yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete tasks multiple times per week to build habits
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => {
                const strength = getHabitStrength(habit)
                const streakBadge = getStreakBadge(habit.streak)

                return (
                  <div key={habit.task.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{habit.task.title}</h4>
                        {habit.task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {habit.task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={streakBadge.color}>
                          {streakBadge.icon} {habit.streak}d streak
                        </Badge>
                        {habit.isHabit && (
                          <Badge variant="secondary">
                            🎯 Habit
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>This week: {habit.completionsThisWeek}/7 days</span>
                        <span className={`font-medium ${strength.color}`}>
                          {strength.label}
                        </span>
                      </div>
                      <Progress value={strength.progress} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
