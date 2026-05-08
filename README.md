# Task Management System

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-4.x-404040?logo=express" alt="Express" />
</p>

A full-stack **Task Management System** built with **React** (frontend) and **Express.js** (backend). Features a Kanban-style board with drag-and-drop, priority-based task management, filtering, search, and a real-time productivity dashboard. All data is persisted to a JSON file — no database setup required.

---

## Features

- **Kanban Board** — Three-column layout (To Do / In Progress / Done) with drag-and-drop
- **Create & Edit Tasks** — Full task form with title, description, priority, due date, category, and tags
- **Priority Levels** — High, Medium, Low with color-coded indicators
- **Due Dates** — Visual overdue/today indicators
- **Categories & Tags** — Organize tasks with custom categories and multiple tags
- **Search** — Real-time debounced search across titles and descriptions
- **Filtering & Sorting** — Filter by status, priority, category, tag; sort by date, priority, title
- **Statistics Dashboard** — Completion rate, productivity score, overdue count, average completion time
- **Drag & Drop** — Move tasks between columns with native HTML5 drag API
- **JSON Persistence** — Zero-config data storage, human-readable, no database needed
- **RESTful API** — Clean, well-documented API endpoints
- **Input Validation** — Comprehensive server-side validation with sanitization
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, CSS3 (custom design system) |
| **Backend** | Node.js, Express 4 |
| **Storage** | JSON file (zero-config) |
| **Testing** | Jest |
| **Linting** | ESLint |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- npm >= 9.0.0 (comes with Node.js)

### Installation

```bash
# 1. Clone or download the project
git clone <repository-url>
cd project_09_task_manager

# 2. Install server dependencies
npm install

# 3. Install client dependencies (optional — only for React dev server)
cd client
npm install
cd ..

# 4. Start the server
npm start
```

The API server will start on `http://localhost:3001`.

### Client Development

To run the React development server:

```bash
cd client
npm start
```

The React app will start on `http://localhost:3000` with proxy to the backend.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### View Simulated Commit History

```bash
```

---

## API Usage Examples

### Create a Task

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add login and registration flow",
    "priority": "high",
    "dueDate": "2024-02-15",
    "category": "backend",
    "tags": ["auth", "security"]
  }'
```

### List Tasks with Filters

```bash
# All tasks
curl http://localhost:3001/api/tasks

# Filter by status
curl "http://localhost:3001/api/tasks?status=todo"

# Filter by priority and sort
curl "http://localhost:3001/api/tasks?priority=high&sortBy=dueDate&sortOrder=asc"

# Search
curl "http://localhost:3001/api/tasks/search?q=authentication"

# Overdue only
curl "http://localhost:3001/api/tasks?overdue=true"
```

### Update Task Status

```bash
# Quick status update (for drag-and-drop)
curl -X PATCH http://localhost:3001/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'

# Full update
curl -X PUT http://localhost:3001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "priority": "medium"}'
```

### Delete a Task

```bash
curl -X DELETE http://localhost:3001/api/tasks/1
```

### Get Statistics

```bash
curl http://localhost:3001/api/stats
curl http://localhost:3001/api/stats/priority
curl http://localhost:3001/api/stats/timeline?days=7
```

---

## Project Structure

```
project_09_task_manager/
 src/
   server.js              # Express entry point
   routes/
     tasks.js             # Task CRUD routes
     stats.js             # Statistics routes
   models/
     taskStore.js         # JSON file persistence layer
   middleware/
     validator.js         # Input validation
   utils/
     dateHelpers.js       # Date utilities
 client/
   src/
     components/
       TaskBoard.js       # Kanban board with columns
       TaskCard.js        # Individual task card (draggable)
       TaskForm.js        # Create/edit modal form
       FilterBar.js       # Filter and sort controls
       SearchBox.js       # Search with debounce
       StatsPanel.js      # Dashboard statistics
     App.js               # Root component
     index.js             # Client entry point
   public/
     index.html           # HTML template
     styles.css           # Global styles
 tests/
   test_taskStore.js      # Model unit tests
   test_dateHelpers.js    # Date utility tests
   test_validator.js      # Validator tests
 data/
   tasks.json             # Persistent task data
docs/
   architecture.md        # System architecture docs
 package.json             # Project configuration
 README.md                # This file
 LICENSE                  # MIT License
 .gitignore               # Git ignore rules
```

---

## Architecture

The application follows a **layered architecture** with clear separation of concerns:

1. **Routes** handle HTTP requests and responses
2. **Middleware** validates and sanitizes inputs
3. **Models** contain all data access logic
4. **Utils** provide reusable helper functions

Data flows through the system as:

```
HTTP Request -> Route -> [Validator] -> Model -> JSON File
                                     -> Model -> [Cache]
HTTP Response <- JSON <- Model <--------------+
```

See [docs/architecture.md](docs/architecture.md) for detailed documentation.

---

## Screenshots

> *Screenshots are placeholders — run the application to see the actual UI.*

### Kanban Board
```
+------------------------------------------+
|  To Do        | In Progress  | Done      |
|  (3)          | (2)          | (5)       |
|               |              |           |
| [Task Card]   | [Task Card]  | [Task]    |
| [Task Card]   | [Task Card]  | [Task]    |
| [Task Card]   |              | [Task]    |
|               |              | [Task]    |
|               |              | [Task]    |
+------------------------------------------+
```

### Statistics Dashboard
```
+--------------------------------------------------+
|  Dashboard                                       |
|  [12]Total  [5]ToDo  [3]InProg  [4]Done [2]Over |
|  Completion Rate: 60% [====------]               |
|  Productivity Score: 75% [=======---]            |
+--------------------------------------------------+
```

---

## Validation Rules

| Field | Rules |
|-------|-------|
| **Title** | Required, max 200 characters |
| **Description** | Optional, max 5000 characters |
| **Priority** | `low`, `medium`, or `high` |
| **Status** | `todo`, `in-progress`, or `done` |
| **Due Date** | `YYYY-MM-DD` format |
| **Category** | Optional, max 50 characters |
| **Tags** | Max 10 tags, max 30 chars each, lowercase, unique |

---

## Future Improvements

- **User Authentication** — Add login/signup with JWT tokens
- **Due Date Notifications** — Browser notifications for approaching deadlines
- **Recurring Tasks** — Support for daily, weekly, monthly recurring tasks
- **Task Templates** — Save and reuse task templates
- **Time Tracking** — Log time spent on each task
- **Calendar View** — Month/week calendar view of tasks
- **Export/Import** — CSV, JSON, PDF export
- **Dark Mode** — Toggle between light and dark themes
- **Offline Support** — Service worker for offline functionality
- **Database Migration** — Optional MongoDB/PostgreSQL support

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit using conventional commits (`feat:`, `fix:`, `test:`, etc.)
4. Push to your branch
5. Open a Pull Request

---

## License

[MIT](LICENSE) &copy; 2024 Task Management System

---

<p align="center">Built with care for productive developers everywhere.</p>
