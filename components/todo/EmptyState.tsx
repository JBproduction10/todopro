"use client"

import type { Category } from '@/lib/supabase'
import { useTodoStore } from '@/lib/stores/todoStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle,
  Search,
  Plus,
  Inbox,
  Target
} from 'lucide-react'

interface EmptyStateProps {
  searchQuery: string
  filterStatus: 'all' | 'pending' | 'completed'
  selectedCategory?: Category
}

export function EmptyState({
  searchQuery,
  filterStatus,
  selectedCategory
}: EmptyStateProps) {
  const { setSelectedTask, setSearchQuery, setFilterStatus } = useTodoStore()

  const createNewTask = () => {
    const newTask = {
      id: '',
      user_id: '',
      title: '',
      description: '',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: 3,
      order_index: 0,
      category_id: selectedCategory?.id
    }
    setSelectedTask(newTask)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const showAllTasks = () => {
    setFilterStatus('all')
  }

  // Different empty states based on context
  if (searchQuery) {
    return (
      <Card className="py-12">
        <CardContent className="text-center space-y-4">
          <Search className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No tasks found</h3>
            <p className="text-muted-foreground">
              No tasks match your search for "{searchQuery}"
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={clearSearch}>
              Clear search
            </Button>
            <Button onClick={createNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create task
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filterStatus === 'completed') {
    return (
      <Card className="py-12">
        <CardContent className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No completed tasks</h3>
            <p className="text-muted-foreground">
              Tasks you complete will appear here
            </p>
          </div>
          <Button variant="outline" onClick={showAllTasks}>
            View all tasks
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (selectedCategory) {
    return (
      <Card className="py-12">
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedCategory.color + '20' }}
            >
              <Target
                className="h-6 w-6"
                style={{ color: selectedCategory.color }}
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">No tasks in {selectedCategory.name}</h3>
            <p className="text-muted-foreground">
              Create a task in this category to get started
            </p>
          </div>
          <Button onClick={createNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create task
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default empty state (no tasks at all)
  return (
    <Card className="py-16">
      <CardContent className="text-center space-y-6">
        <Inbox className="h-16 w-16 text-muted-foreground mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Welcome to TodoPro!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get organized and boost your productivity. Create your first task to get started.
          </p>
        </div>
        <div className="space-y-3">
          <Button size="lg" onClick={createNewTask}>
            <Plus className="h-5 w-5 mr-2" />
            Create your first task
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Pro tip: Use Ctrl+N to quickly create a new task</p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
          <div className="space-y-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="font-medium">Smart Organization</h4>
            <p className="text-sm text-muted-foreground">
              Categorize tasks, set priorities, and track progress
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <h4 className="font-medium">Due Date Reminders</h4>
            <p className="text-sm text-muted-foreground">
              Never miss a deadline with smart notifications
            </p>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-purple-600" />
            </div>
            <h4 className="font-medium">Powerful Search</h4>
            <p className="text-sm text-muted-foreground">
              Find any task instantly with smart filtering
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
