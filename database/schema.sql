-- Advanced Todo App Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    order_index INTEGER DEFAULT 0
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    background_image_url TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE,
    reminder_time INTEGER DEFAULT 30, -- minutes before due date
    auto_background_change BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Background images table
CREATE TABLE background_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    prompt TEXT, -- DALLE prompt used to generate the image
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task logs table (for habit tracking)
CREATE TABLE task_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action TEXT NOT NULL CHECK (action IN ('completed', 'created', 'updated'))
);

-- Indexes for better performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_order_index ON tasks(order_index);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_completed_at ON task_logs(completed_at);

-- Triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Background images policies
CREATE POLICY "Users can view their own background images" ON background_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own background images" ON background_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own background images" ON background_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own background images" ON background_images
    FOR DELETE USING (auth.uid() = user_id);

-- Task logs policies
CREATE POLICY "Users can view their own task logs" ON task_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task logs" ON task_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create user preferences on user creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user preferences when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_preferences();

-- Function to log task completion for habit tracking
CREATE OR REPLACE FUNCTION log_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when a task is marked as completed
    IF OLD.completed = FALSE AND NEW.completed = TRUE THEN
        INSERT INTO task_logs (task_id, user_id, action)
        VALUES (NEW.id, NEW.user_id, 'completed');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log task completions
CREATE TRIGGER log_task_completion_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_completion();

-- Insert some default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO categories (user_id, name, color) VALUES
        (NEW.user_id, 'Work', '#3B82F6'),
        (NEW.user_id, 'Personal', '#10B981'),
        (NEW.user_id, 'Health', '#F59E0B'),
        (NEW.user_id, 'Learning', '#8B5CF6');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default categories when user preferences are created
CREATE TRIGGER create_default_categories_trigger
    AFTER INSERT ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories();
