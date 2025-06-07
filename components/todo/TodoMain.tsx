"use client"

import { useTodoStore } from '@/lib/stores/todoStore'
import { TaskList } from './TaskList'
import { EmptyState } from './EmptyState'
import { TaskStats } from './TaskStats'

export function TodoMain() {
  const {
    getFilteredTasks,
    isLoading,
    searchQuery,
    filterStatus,
    filterCategory,
    categories
  } = useTodoStore()

  const filteredTasks = getFilteredTasks()
  const selectedCategory = categories.find(cat => cat.id === filterCategory)

  const getTitle = () => {
    if (searchQuery) {
      return `Search results for "${searchQuery}"`
    }
    if (selectedCategory) {
      return selectedCategory.name
    }
    switch (filterStatus) {
      case 'pending':
        return 'Pending Tasks'
      case 'completed':
        return 'Completed Tasks'
      default:
        return 'All Tasks'
    }
  }

  const getDescription = () => {
    if (searchQuery) {
      return `Found ${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`
    }
    if (selectedCategory) {
      return `Tasks in ${selectedCategory.name} category`
    }
    switch (filterStatus) {
      case 'pending':
        return 'Tasks that need to be completed'
      case 'completed':
        return 'Tasks that have been completed'
      default:
        return 'All your tasks in one place'
    }
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{getTitle()}</h2>
          <p className="text-muted-foreground">{getDescription()}</p>
        </div>

        {/* Stats */}
        <TaskStats />

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            filterStatus={filterStatus}
            selectedCategory={selectedCategory}
          />
        ) : (
          <TaskList/>
        )}
      </div>
    </main>
  )
}
