"use client"

import { useTodoStore } from '@/lib/stores/todoStore'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react'

export function TaskStats() {
  const { getTaskStats, getFilteredTasks } = useTodoStore()
  const stats = getTaskStats()
  const filteredTasks = getFilteredTasks()

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
  const progressValue = Math.round(completionRate)

  // Calculate tasks due today/this week
  const today = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(today.getDate() + 7)

  const dueToday = filteredTasks.filter(task => {
    if (!task.due_date || task.completed) return false
    const dueDate = new Date(task.due_date)
    return dueDate.toDateString() === today.toDateString()
  }).length

  const dueThisWeek = filteredTasks.filter(task => {
    if (!task.due_date || task.completed) return false
    const dueDate = new Date(task.due_date)
    return dueDate >= today && dueDate <= weekFromNow
  }).length

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    },
    {
      title: 'Due This Week',
      value: dueThisWeek,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {progressValue}% complete
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.total} tasks completed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Due Today Alert */}
      {dueToday > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/50 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800 dark:text-orange-200">
                {dueToday} task{dueToday !== 1 ? 's' : ''} due today
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
