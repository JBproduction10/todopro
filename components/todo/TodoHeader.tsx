"use client"

import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useTodoStore } from '@/lib/stores/todoStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  Search,
  Sun,
  Moon,
  LogOut,
  Settings,
  Plus,
  Bell
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface TodoHeaderProps {
  user: User
  onMenuClick: () => void
}

export function TodoHeader({ user, onMenuClick }: TodoHeaderProps) {
  const { theme, setTheme } = useTheme()
  const {
    searchQuery,
    setSearchQuery,
    getTaskStats,
    selectedTask,
    setSelectedTask
  } = useTodoStore()

  const stats = getTaskStats()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const createNewTask = () => {
    // Create a new task template
    const newTask = {
      id: '',
      user_id: user.id,
      title: '',
      description: '',
      tags: [],
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: 3,
      order_index: 0
    }
    setSelectedTask(newTask)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">TodoPro</h1>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary">
                {stats.pending} pending
              </Badge>
              <Badge variant="outline">
                {stats.completed} completed
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-lg mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={createNewTask}
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={createNewTask}
            className="sm:hidden"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.user_metadata?.full_name || 'User'}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                window.dispatchEvent(new CustomEvent('openSettings', { detail: 'notifications' }))
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
