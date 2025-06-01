"use client"

import { useState } from 'react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import type { Task } from '@/lib/supabase'
import { useTodoStore } from '@/lib/stores/todoStore'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Calendar,
  Flag,
  Edit,
  Trash2,
  GripVertical,
  TagIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const { toggleTask, deleteTask, setSelectedTask, categories } = useTodoStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const category = categories.find(cat => cat.id === task.category_id)

  const handleToggle = () => {
    toggleTask(task.id)
  }

  const handleEdit = () => {
    setSelectedTask(task)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    // Add a small delay for better UX
    // setTimeout(() => {
    //   deleteTask(task.id)
    // }, 200)
    deleteTask(task.id);
  }

  const getDueDateInfo = () => {
    if (!task.due_date) return null

    const dueDate = new Date(task.due_date)
    const isPastDue = isPast(dueDate) && !isToday(dueDate)

    let label = format(dueDate, 'MMM d')
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

    if (isToday(dueDate)) {
      label = 'Today'
      variant = 'default'
    } else if (isTomorrow(dueDate)) {
      label = 'Tomorrow'
      variant = 'secondary'
    } else if (isPastDue) {
      label = 'Overdue'
      variant = 'destructive'
    }

    return { label, variant, isPastDue }
  }
  // console.log('task tags:', task?.tags)
  const dueDateInfo = getDueDateInfo()

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'text-red-500'
      case 4: return 'text-orange-500'
      case 3: return 'text-yellow-500'
      case 2: return 'text-blue-500'
      case 1: return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        task.completed && "opacity-75",
        isDeleting && "scale-95 opacity-50",
        dueDateInfo?.isPastDue && !task.completed && "ring-1 ring-red-200"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-grab" />

          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggle}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "font-medium leading-tight cursor-pointer hover:text-primary transition-colors",
                    task.completed && "line-through text-muted-foreground"
                  )}
                  onClick={handleEdit}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p
                    className={cn(
                      "text-sm text-muted-foreground mt-1 line-clamp-2 cursor-pointer",
                      task.completed && "line-through"
                    )}
                    onClick={handleEdit}
                  >
                    {task.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {category && (
                <Badge variant="outline" className="text-xs">
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </Badge>
              )}

              {dueDateInfo && (
                <Badge variant={dueDateInfo.variant} className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {dueDateInfo.label}
                </Badge>
              )}

              {task.priority > 3 && (
                <Flag className={cn("w-3 h-3", getPriorityColor(task.priority))} />
              )}

              {/* {task.tags && task.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <TagIcon className="h-3 w-3 text-muted-foreground" />
                  <div className="flex space-x-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
