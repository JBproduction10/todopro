import { create } from 'zustand'
import type { Task, Category, UserPreferences } from '../supabase'

interface TodoState {
  // Data
  tasks: Task[]
  categories: Category[]
  userPreferences: UserPreferences | null

  // UI State
  isLoading: boolean
  searchQuery: string
  filterStatus: 'all' | 'pending' | 'completed'
  filterCategory: string | null
  selectedTask: Task | null

  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void

  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  setUserPreferences: (preferences: UserPreferences) => void
  updateUserPreferences: (updates: Partial<UserPreferences>) => void

  setIsLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  setFilterStatus: (status: 'all' | 'pending' | 'completed') => void
  setFilterCategory: (categoryId: string | null) => void
  setSelectedTask: (task: Task | null) => void

  // Computed getters
  getPendingTasks: () => Task[]
  getCompletedTasks: () => Task[]
  getFilteredTasks: () => Task[]
  getTasksByCategory: (categoryId: string) => Task[]
  getTaskStats: () => { total: number; pending: number; completed: number }
}

export const useTodoStore = create<TodoState>((set, get) => ({
  // Initial state
  tasks: [],
  categories: [],
  userPreferences: null,
  isLoading: false,
  searchQuery: '',
  filterStatus: 'all',
  filterCategory: null,
  selectedTask: null,

  // Task actions
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),

  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    )
  })),

  // Category actions
  setCategories: (categories) => set({ categories }),

  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category]
  })),

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map(category =>
      category.id === id ? { ...category, ...updates } : category
    )
  })),

  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(category => category.id !== id)
  })),

  // User preferences actions
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),

  updateUserPreferences: (updates) => set((state) => ({
    userPreferences: state.userPreferences
      ? { ...state.userPreferences, ...updates }
      : null
  })),

  // UI actions
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (categoryId) => set({ filterCategory: categoryId }),
  setSelectedTask: (task) => set({ selectedTask: task }),

  // Computed getters
  getPendingTasks: () => get().tasks.filter(task => !task.completed),

  getCompletedTasks: () => get().tasks.filter(task => task.completed),

  getFilteredTasks: () => {
    const { tasks, searchQuery, filterStatus, filterCategory } = get()

    return tasks.filter(task => {
      // Search filter
      const matchesSearch = !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'pending' && !task.completed) ||
        (filterStatus === 'completed' && task.completed)

      // Category filter
      const matchesCategory = !filterCategory || task.category_id === filterCategory

      return matchesSearch && matchesStatus && matchesCategory
    })
  },

  getTasksByCategory: (categoryId) =>
    get().tasks.filter(task => task.category_id === categoryId),

  getTaskStats: () => {
    const tasks = get().tasks
    return {
      total: tasks.length,
      pending: tasks.filter(task => !task.completed).length,
      completed: tasks.filter(task => task.completed).length
    }
  }
}))
