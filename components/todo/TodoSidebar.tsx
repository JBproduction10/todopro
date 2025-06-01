"use client"

import { useTodoStore } from '@/lib/stores/todoStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Inbox,
  CheckCircle,
  Clock,
  Tag,
  Plus,
  Calendar,
  Image,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodoSidebarProps {
  open: boolean
  onClose: () => void
}

export function TodoSidebar({ open, onClose }: TodoSidebarProps) {
  const {
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    categories,
    getTaskStats,
    getPendingTasks,
    getCompletedTasks,
    getTasksByCategory
  } = useTodoStore()

  const stats = getTaskStats()

  const filterOptions = [
    {
      id: 'all',
      label: 'All Tasks',
      icon: Inbox,
      count: stats.total,
      active: filterStatus === 'all'
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: Clock,
      count: stats.pending,
      active: filterStatus === 'pending'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      count: stats.completed,
      active: filterStatus === 'completed'
    }
  ]

  const SidebarContent = () => (
    <div className="space-y-6 p-4">
      {/* Filter Options */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          FILTERS
        </h3>
        <div className="space-y-1">
          {filterOptions.map((option) => (
            <Button
              key={option.id}
              variant={option.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between h-9",
                option.active && "bg-secondary"
              )}
              onClick={() => {
                setFilterStatus(option.id as any)
                setFilterCategory(null)
                onClose()
              }}
            >
              <div className="flex items-center gap-2">
                <option.icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            CATEGORIES
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {categories.map((category) => {
            const taskCount = getTasksByCategory(category.id).length
            return (
              <Button
                key={category.id}
                variant={filterCategory === category.id ? "secondary" : "ghost"}
                className="w-full justify-between h-9"
                onClick={() => {
                  setFilterCategory(
                    filterCategory === category.id ? null : category.id
                  )
                  setFilterStatus('all')
                  onClose()
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="truncate">{category.name}</span>
                </div>
                <Badge variant="outline">{taskCount}</Badge>
              </Button>
            )
          })}

          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground p-2 text-center">
              No categories yet
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          QUICK ACTIONS
        </h3>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-9"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openSettings', { detail: 'calendar' }))
              onClose()
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar Sync
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openSettings', { detail: 'habits' }))
              onClose()
            }}
          >
            <Target className="h-4 w-4 mr-2" />
            Habit Tracking
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openSettings', { detail: 'notifications' }))
              onClose()
            }}
          >
            <Tag className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
