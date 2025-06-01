# Advanced Todo App Setup Guide

## Database Setup (Required)

Since you haven't connected your Supabase account through the chat interface yet, you'll need to manually set up the database schema:

### Option 1: Connect Supabase Account (Recommended)
1. Click the "Add" button in the chat interface
2. Log in to your Supabase account
3. The database schema will be automatically created

### Option 2: Manual Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL to create all tables, indexes, and policies

## Authentication Setup

The app uses Supabase Auth with the following providers:
- Email/Password authentication
- Google OAuth (optional)

### Configure Google OAuth (Optional)
1. Go to your Supabase dashboard → Authentication → Settings
2. Add Google as an OAuth provider
3. Configure your Google OAuth credentials

## Environment Variables

The following environment variables are already configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY=your_google_calendar_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
```

## Features Implemented

### ✅ Core Features
- [x] User authentication (email/password + Google OAuth)
- [x] Task CRUD operations
- [x] Task categories and tagging
- [x] Due dates and priorities
- [x] Task completion tracking
- [x] Search and filtering
- [x] Dark/light mode toggle
- [x] Drag and drop task reordering
- [x] Responsive design

### 🚧 Advanced Features (Coming Soon)
- [ ] Background image management with DALLE integration
- [ ] Calendar sync with Google Calendar
- [ ] Smart notifications and reminders
- [ ] Habit tracking (4+ completions per week)
- [ ] Automatic background rotation
- [ ] Motivation notifications

## How to Use

1. **Sign up/Sign in**: Create an account or sign in with Google
2. **Create tasks**: Click "New Task" or use Ctrl+N
3. **Organize**: Use categories, priorities, and due dates
4. **Search**: Use the search bar to find specific tasks
5. **Filter**: Use the sidebar to filter by status or category
6. **Reorder**: Drag and drop tasks to reorder them
7. **Complete**: Check off tasks as you complete them

## Database Schema

The app uses the following main tables:
- `tasks` - Store all todo items
- `categories` - User-defined task categories
- `user_preferences` - User settings (theme, notifications, etc.)
- `background_images` - AI-generated background images
- `task_logs` - Track task completion for habit analysis

## Development

To run the development server:
```bash
cd supado_v5
bun run dev
```

The app will be available at http://localhost:3000

## Next Steps

1. Set up the database schema using one of the methods above
2. Test the basic todo functionality
3. We'll implement the advanced features (background management, calendar sync, etc.) in the next phases
