'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { TaskItem } from './TaskItem'
import { useTodoStore } from '@/lib/stores/todoStore'

export function TaskList() {
  const { tasks, setTasks, updateTask } = useTodoStore()

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const reorderedTasks = Array.from(tasks)
    const [movedTask] = reorderedTasks.splice(result.source.index, 1)
    reorderedTasks.splice(result.destination.index, 0, movedTask)

    // Update global state
    setTasks(reorderedTasks)

    // Persist updated order_index in Supabase
    reorderedTasks.forEach((task, index) => {
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
