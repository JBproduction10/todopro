"use client"

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Task } from '@/lib/supabase'
import { TaskItem } from './TaskItem'
import { useTodoStore } from '@/lib/stores/todoStore'

// interface TaskListProps {
//   tasks: Task[]
// }

export function TaskList() {
  const tasks = useTodoStore((state) => state.tasks)
  const setTasks = useTodoStore((state) => state.setTasks)
  const updateTask = useTodoStore((state) => state.updateTask)
  // const { updateTask } = useTodoStore()

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(tasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Reassign order_index and update store
    const updatedTasks = items.map((task, index) => ({
      ...task,
      order_index: index
    }))

    setTasks(updatedTasks)

    // Update order indices
    updatedTasks.forEach(task => {
      updateTask(task.id, { order_index: task.order_index })
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
