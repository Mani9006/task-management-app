# Architecture Documentation

## System Overview

The Task Management System is a full-stack application built with React (frontend) and Express (backend). Data persistence is handled via JSON file storage, making it lightweight and easy to deploy without external database dependencies.

## Architecture Diagram

```
                    Client (Browser)
                         |
                         | HTTP
                         v
              +---------------------+
              |   Express Server    |
              |   Port 3001         |
              +---------------------+
                         |
           +-------------+-------------+
           |                           |
    +------------+           +----------------+
    |   Routes   |           |   Middleware   |
    +------------+           +----------------+
    | /api/tasks |           |   Validator    |
    | /api/stats |           |   CORS/Logger  |
    +------------+           +----------------+
           |
    +------------+
    |   Models   |
    +------------+
    | taskStore  |----> data/tasks.json
    +------------+
```

## Directory Structure

```
src/
  server.js          - Entry point, Express app configuration
  routes/
    tasks.js         - Task CRUD, search, filter endpoints
    stats.js         - Statistics and analytics endpoints
  models/
    taskStore.js     - JSON file persistence, data operations
  middleware/
    validator.js     - Input validation and sanitization
  utils/
    dateHelpers.js   - Date formatting and calculations
```

## Backend Architecture

### Request Lifecycle

1. **Request** arrives at Express server
2. **CORS middleware** adds cross-origin headers
3. **JSON body parser** parses request body
4. **Request logger** logs method and URL
5. **Route handler** processes the request
6. **Validator middleware** (on certain routes) validates input
7. **Model function** performs data operations
8. **JSON file** is read/written as needed
9. **JSON response** is returned to client

### Data Flow

```
HTTP Request -> Route -> [Validator] -> taskStore -> tasks.json
                                              |
HTTP Response <------- JSON <-----------------+
```

### Task Model Schema

```json
{
  "id": 1,
  "title": "Task title",
  "description": "Task description",
  "priority": "high|medium|low",
  "status": "todo|in-progress|done",
  "dueDate": "2024-12-31",
  "category": "work",
  "tags": ["urgent", "frontend"],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "completedAt": null
}
```

## Frontend Architecture

### Component Hierarchy

```
App (state management)
|-- StatsPanel (dashboard metrics)
|-- SearchBox (debounced search)
|-- FilterBar (filter controls)
|-- TaskBoard (Kanban columns)
|   |-- TaskCard (draggable task)
|-- TaskForm (create/edit modal)
```

### State Management

State is managed at the App component level and passed down via props:

- `tasks` - Current task list
- `filters` - Active filter/sort parameters
- `showForm` - Modal visibility
- `editingTask` - Task being edited
- `showStats` - Stats panel visibility

### API Integration

The frontend communicates with the backend via REST API calls using the native `fetch` API. The API base URL is configurable via the `REACT_APP_API_URL` environment variable.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/tasks | List tasks (with filters) |
| POST | /api/tasks | Create task |
| GET | /api/tasks/:id | Get single task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PATCH | /api/tasks/:id/status | Quick status update |
| POST | /api/tasks/:id/move | Move with reordering |
| GET | /api/tasks/search | Search tasks |
| GET | /api/tasks/categories | List categories |
| GET | /api/tasks/tags | List tags |
| GET | /api/stats | Overall statistics |
| GET | /api/stats/status | Status breakdown |
| GET | /api/stats/priority | Priority breakdown |
| GET | /api/stats/category | Category breakdown |
| GET | /api/stats/timeline | Timeline data |

## Design Decisions

### JSON File Storage

**Why:** Zero-configuration deployment, no database setup required, human-readable data, easy to version control.

**Trade-offs:** Not suitable for concurrent writes, limited scalability, no ACID transactions.

### No External State Library

**Why:** The application state is relatively simple. React's built-in useState/useEffect is sufficient.

**When to add Redux/Zustand:** If the app grows beyond ~15 components with shared state.

### In-Memory Cache

The taskStore maintains an in-memory cache of tasks to minimize file I/O operations. The cache is invalidated when tasks are modified.

## Security Considerations

- Input sanitization prevents XSS attacks
- Parameter validation prevents injection
- CORS headers control cross-origin access
- No authentication (by design for simplicity)
