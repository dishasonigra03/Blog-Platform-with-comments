# InkSphere – Community Blogging Platform

InkSphere is a modern full-stack blogging web application that empowers users to discover, write, and engage with articles through an interactive, nested comments system. The database is hosted on **Supabase (PostgreSQL)**, and the user interface features a highly polished, responsive Vanilla CSS design system supporting real-time theme toggles (dark/light mode).

---

## 🚀 Key Features

* **Real-time WebSockets (Socket.io)**: Instant notifications for new blog posts, live-updating likes count, and instant comments/nested replies synchronization across all active readers without page refreshes.
* **Authentication**: JWT-based user login & registration, password hashing (bcrypt), custom avatar file upload, and "Remember Me" session persistence.
* **Content Management (CRUD)**: Create, read, update, and delete blog posts. Custom category tags, and tags lists.
* **Writing Suite**: Sleek custom Markdown Editor with a live side-by-side preview panel.
* **Likes & Shares**: Toggle article liking, share posts via Web Share API or Clipboard copying, and discover recommended related articles.
* **Discussion Panel**: Nestable (recursive) comment threads supporting instant state updates, comment editing, and comment deletions.
* **Performance Indicators**: Reading time estimation, likes count, comment counters, and card loading skeletons.
* **User Dashboard**: Metric cards (posts, likes, comments count), personal profile editing, and blog management panel.
* **Moderation (Admin Panel)**: System-wide analytics counters, user moderation (change roles / delete accounts), and post deletions.
* **Rich UI Styling**: 100% custom **Vanilla CSS** supporting dark and light modes, CSS variables, glassmorphism, responsive grids, and micro-animations.

---

## 📁 Project Structure

```
workspace/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable widgets (Navbar, BlogCard, MarkdownEditor, etc.)
│   │   ├── context/            # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/              # Page layouts (Home, Login, Dashboard, Admin, Details, etc.)
│   │   ├── styles/             # design system variables.css and global.css
│   │   ├── App.jsx             # Main router configurations
│   │   └── main.jsx            # React root mount
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # Supabase client connector
│   ├── controllers/            # Business controllers (Auth, Posts, Comments, Admin)
│   ├── middleware/             # JWT authentications and Multer file uploads
│   ├── uploads/                # Local directory for user uploaded avatars & cover images
│   ├── index.js                # App entry point
│   └── package.json
```

---

## 🗄️ Database Schemas (Supabase PostgreSQL)

The database utilizes three relational tables in the public schema:

### 1. `users` Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  bio VARCHAR(500) DEFAULT '',
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `posts` Table
```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100) NOT NULL DEFAULT 'General',
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  likes UUID[] DEFAULT '{}',
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. `comments` Table
```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_comment UUID REFERENCES public.comments(id) ON DELETE CASCADE DEFAULT null,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 🔌 API Documentation

### 🔐 Authentication
* `POST /api/auth/register` — Registers a new user account. Supports multipart/form-data for uploading an `avatar`.
* `POST /api/auth/login` — Logins a user and issues a JWT token. Expects `{ email, password, rememberMe }`.
* `GET /api/auth/me` — Fetches current user profile. (Requires JWT Header).
* `PUT /api/auth/profile` — Updates user profile (name, bio, password, avatar file). (Requires JWT Header).

### 📝 Blog Posts
* `GET /api/posts` — Lists all posts. Optional parameters: `?q=searchQuery`, `?category=Name`, `?tag=Name`, `?author=userId`, `?sort=latest|popular|oldest`, `?page=1`, `?limit=6`.
* `GET /api/posts/trending` — Returns the top 4 posts calculated by community likes and comments engagement score.
* `GET /api/posts/:idOrSlug` — Fetches post details by slug or UUID.
* `GET /api/posts/:id/related` — Recommends up to 3 posts in the same category.
* `POST /api/posts` — Publishes a new article. Supports multipart/form-data for `coverImage`. (Requires JWT Header).
* `PUT /api/posts/:id` — Updates an existing post. Restricted to author/admin. (Requires JWT Header).
* `DELETE /api/posts/:id` — Deletes post and cascades comment removals. (Requires JWT Header).
* `PUT /api/posts/:id/like` — Toggles post liking (likes/unlikes) for authenticated user. (Requires JWT Header).

### 💬 Comments
* `GET /api/comments/post/:postId` — Fetches all comments for a post, formatted into a nested replies tree.
* `POST /api/comments` — Publishes a comment or a nested reply. Expects `{ postId, comment, parentComment }`. (Requires JWT Header).
* `PUT /api/comments/:id` — Edits user's own comment text. (Requires JWT Header).
* `DELETE /api/comments/:id` — Deletes comment and recursively deletes all nested replies via PG cascade. (Requires JWT Header).

### 🛡️ Administrative Panel
* `GET /api/admin/analytics` — Fetches totals metrics and recent activity feeds. (Requires JWT Admin Header).
* `GET /api/admin/users` — Lists all user accounts paginated. (Requires JWT Admin Header).
* `PUT /api/admin/users/:id/role` — Modifies user role (`'user'` or `'admin'`). (Requires JWT Admin Header).
* `DELETE /api/admin/users/:id` — Deletes user and cascades all posts/comments they wrote. (Requires JWT Admin Header).

---

## 🛠️ Local Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your computer.
* A Supabase project set up. (The tables are already created in your active project `fkkbbfrklazqdipbiaxq`).

### Setup Steps
1. Open the project root folder:
   ```bash
   cd "Thiranex Internship Platform Task Blog Platform with Comments"
   ```
2. Setup environment variables. Rename `server/.env.example` to `server/.env` and verify the values:
   ```env
   PORT=5000
   SUPABASE_URL=https://fkkbbfrklazqdipbiaxq.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZra2JiZnJrbGF6cWRpcGJpYXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzM3MDMsImV4cCI6MjA5NTEwOTcwM30.Q3UVHk96vqM4u-YNKCzqlwSFdaFP-wjO3zZo9U2MMe8
   JWT_SECRET=supersecretkeyforinkspherebloggingplatform2026
   JWT_EXPIRES_IN=7d
   ```
3. Install all package dependencies (root, backend, and frontend Vite client) with:
   ```bash
   npm run install:all
   ```
4. Start both the frontend client and the backend API server concurrently with:
   ```bash
   npm start
   ```
   *This starts the frontend on `http://localhost:5173` and the backend on `http://localhost:5000`.*

---

## 🌐 Deployment Instructions

### 1. Backend (Render Deployment)
1. Commit the project to a GitHub repository.
2. Sign in to [Render](https://render.com/).
3. Click **New +** and select **Web Service**.
4. Link your GitHub repository.
5. Configure settings:
   * **Root Directory**: `server`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
6. Add environment variables in Render's configuration dashboard:
   * `SUPABASE_URL` — *Your Supabase project URL.*
   * `SUPABASE_ANON_KEY` — *Your Supabase anon API key.*
   * `JWT_SECRET` — *A secure random string.*
   * `JWT_EXPIRES_IN` — `7d`
7. Click **Deploy Web Service**. Render provides a URL (e.g., `https://inksphere-api.onrender.com`).

### 2. Frontend (Vercel Deployment)
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Select your linked GitHub repository.
4. Configure build settings:
   * **Root Directory**: `client`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. In `/client/src/context/AuthContext.jsx` and other files calling backend, ensure the base `API_URL` variable references your Render backend URL (e.g. `https://inksphere-api.onrender.com/api`).
6. Click **Deploy**. Vercel launches the client to a production website!
