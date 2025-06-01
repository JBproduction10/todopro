"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { type Task, supabase } from "@/lib/supabase"
import { useTodoStore } from "@/lib/stores/todoStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Badge } from "../ui/badge"

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  category_id: z.union([z.string(), z.literal("none")]).optional(),
  priority: z.number().min(1).max(5),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskDialogProps {
  task?: Task | null
  open: boolean
  onClose: () => void
}

const COMMON_TAGS = [
  'important', 'quick', 'deadline', 'recurring', 'waiting-for', 'follow-up',
  'research', 'call', 'email', 'meeting', 'review', 'planning',
  'creative', 'learning', 'habit', 'goal'
]

export function TaskDialog({ task, open, onClose }: TaskDialogProps) {
  const { addTask, updateTask, categories } = useTodoStore()
  const [isLoading, setIsLoading] = useState(false)
  const [newTag, setNewTag] = useState('')
  const isEditing = task?.id

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: 3,
      tags: task?.tags|| []
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        category_id: task.category_id || "none",
        tags: task?.tags || [],
        priority: task.priority,
      })
    } else {
      form.reset({
        title: "",
        description: "",
        priority: 3,
        category_id: "none",
        tags: [],
      })
    }
  }, [task, form])

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues('tags') || []
      if (!currentTags.includes(newTag.trim())) {
        form.setValue('tags', [...currentTags, newTag.trim()])
      }
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue('tags', currentTags.filter(t => t !== tag))
  }

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true)
    try {
      const categoryValue = data.category_id === "none" ? undefined : data.category_id

      const taskData = {
        title: data.title,
        description: data.description || undefined,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        category_id: categoryValue,
        tags: data.tags,
        priority: data.priority,
        updated_at: new Date().toISOString(),
      }

      if (isEditing) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id)

        if (error) throw error

        updateTask(task.id, {
          ...taskData,
          due_date: taskData.due_date || undefined,
        })
        toast.success("Task updated successfully")
      } else {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error("Not authenticated")

        const { data: existingTasks } = await supabase
          .from("tasks")
          .select("order_index")
          .eq("user_id", user.user.id)
          .order("order_index", { ascending: false })
          .limit(1)

        const nextOrderIndex =
          existingTasks && existingTasks.length > 0
            ? existingTasks[0].order_index + 1
            : 0

        const newTaskData = {
          ...taskData,
          user_id: user.user.id,
          completed: false,
          created_at: new Date().toISOString(),
          order_index: nextOrderIndex,
        }

        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert(newTaskData)
          .select(`*, category:categories(*)`)
          .single()

        if (error) throw error

        addTask(newTask)
        toast.success("Task created successfully")
      }

      onClose()
    } catch (error: any) {
      toast.error("Error saving task: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = [
    { value: 1, label: "Very Low", color: "text-gray-500" },
    { value: 2, label: "Low", color: "text-blue-500" },
    { value: 3, label: "Medium", color: "text-yellow-500" },
    { value: 4, label: "High", color: "text-orange-500" },
    { value: 5, label: "Very High", color: "text-red-500" },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="What needs to be done?" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            <div className="flex items-center gap-2">
                              <Flag className={cn("h-3 w-3", option.color)} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className='space-y-2'>
              <FormLabel>Tags</FormLabel>
              <div className='flex gap-2 flex-wrap'>
                {form.watch('tags')?.map((tag) => (
                  <Badge key={tag} className='text-xs'>
                    {tag}
                    <button
                      type='button'
                      onClick={() => removeTag(tag)}
                      className='ml-1 text-red-500'
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>

              <div className='flex flex-col sm:flex-row gap-2'>
                <Input
                  placeholder='Add a tag'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type='button' onClick={addTag} size='sm'>
                  Add
                </Button>
              </div>

              <div className='text-xs text-muted-foreground'>Quick Add:</div>
              <div className='flex flex-wrap gap-2'>
                {COMMON_TAGS.map(tag => (
                  <Button
                    key={tag}
                    type='button'
                    size='sm'
                    variant='outline'
                    className='text-xs h-6 px-2'
                    onClick={() => {
                      const currentTags = form.getValues('tags') || []
                      if (!currentTags.includes(tag)) {
                        form.setValue('tags', [...currentTags, tag])
                      }
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
