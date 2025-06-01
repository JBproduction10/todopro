"use client"

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Task } from '@/lib/supabase'
import { TaskItem } from './TaskItem'
import { useTodoStore } from '@/lib/stores/todoStore'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const { updateTask } = useTodoStore()

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(tasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order indices
    items.forEach((task, index) => {
      if (task.order_index !== index) {
        updateTask(task.id, { order_index: index })
      }
    })
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tasks">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-transform ${
                      snapshot.isDragging ? 'rotate-2 scale-105' : ''
                    }`}
                  >
                    <TaskItem task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
