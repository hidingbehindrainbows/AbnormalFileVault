# Abnormal File Vault

A full-stack file management application built with React and Django, designed for efficient file handling and storage.

## 🚀 Technology Stack

### Backend
- Django 4.x (Python web framework)
- Django REST Framework (API development)
- SQLite (Development database)

### Frontend
- React 18 with TypeScript
- TanStack Query (React Query)
- Tailwind CSS for styling

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (18.x or higher)
- Python (3.9 or higher)

## 🛠️ Getting Started

### Clone the Repository

```bash
git clone <repository-url>
cd abnormal-file-hub
```

### Backend Setup

1. **Create and activate virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create necessary directories**
   ```bash
   mkdir -p media staticfiles data
   ```

4. **Database Setup**
   The project uses SQLite as the default database for development. The database configuration can be found in `backend/core/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'data' / 'db.sqlite3',
       }
   }
   ```

   To initialize the database:
   ```bash
   python manage.py migrate
   ```

   For database maintenance:
   ```bash
   # Create new migrations after model changes
   python manage.py makemigrations

   # View SQL for migrations without applying
   python manage.py sqlmigrate files 0001

   # Reset database (if needed)
   rm data/db.sqlite3
   python manage.py migrate
   ```

5. **Start the development server**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file**
   Create `.env.local`:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🌐 Accessing the Application

- Frontend Application: http://localhost:3000
- Backend API: http://localhost:8000/api

## 💾 Database Schema

The application uses the following main database models:

### File Model
```sql
CREATE TABLE files_file (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    size INTEGER NOT NULL,
    content_hash CHAR(64) NOT NULL,
    upload_date DATETIME NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    UNIQUE(content_hash)
);
```

Key fields:
- `name`: Original filename
- `file_type`: MIME type of the file
- `size`: File size in bytes
- `content_hash`: SHA-256 hash of file content (used for deduplication)
- `upload_date`: Timestamp of upload
- `file_path`: Path to stored file in media directory

The database is indexed for optimal performance:
```sql
CREATE INDEX idx_files_upload_date ON files_file(upload_date);
CREATE INDEX idx_files_name ON files_file(name);
CREATE INDEX idx_files_content_hash ON files_file(content_hash);
```

## 🔍 Database Inspection

### Using Django Shell
```bash
# Start Django shell
python manage.py shell

# Import the File model
from files.models import File

# Query examples
File.objects.all()  # List all files
File.objects.filter(file_type='image/jpeg')  # Find all JPEG files
File.objects.order_by('-upload_date')[:5]  # Latest 5 uploads
```

### Using SQLite CLI
You can directly inspect the database using SQLite command-line tool:

```bash
# Open SQLite CLI (from backend directory)
sqlite3 data/db.sqlite3

# Show all tables
.tables

# Show schema for files_file table
.schema files_file

# Enable better formatting
.mode column
.headers on

# Common SQL Queries:

# List all files
SELECT name, file_type, size, upload_date 
FROM files_file;

# Find duplicate files
SELECT content_hash, COUNT(*) as count 
FROM files_file 
GROUP BY content_hash 
HAVING count > 1;

# Get total storage usage
SELECT SUM(size) as total_size 
FROM files_file;

# Files by type
SELECT file_type, COUNT(*) as count 
FROM files_file 
GROUP BY file_type;

# Recent uploads
SELECT name, upload_date 
FROM files_file 
ORDER BY upload_date DESC 
LIMIT 5;

# Search by filename
SELECT * FROM files_file 
WHERE name LIKE '%search_term%';

# Exit SQLite
.exit
```

### Using DB Browser for SQLite
For a graphical interface:

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open `backend/data/db.sqlite3` with DB Browser
3. Features available:
   - Browse data with GUI
   - Execute SQL queries
   - Edit data directly
   - View and modify schema
   - Import/Export data

## ✨ Key Features

### File Deduplication

The system implements intelligent file deduplication to prevent storage of duplicate files:

1. When a file is uploaded, the system calculates its SHA-256 hash based on the file content
2. This hash is stored in the database along with other file metadata
3. If a file with the same hash already exists:
   - The system prevents the duplicate upload
   - Returns a reference to the existing file
   - Saves storage space while maintaining file access

This means that even if files have different names but identical content, they will be stored only once.

### Advanced Search Capabilities

The application provides a powerful search system with multiple filtering options:

1. **Basic Search**
   - Search by filename
   - Filter by file type

2. **Advanced Filters**
   - File size range (min/max)
   - Upload date range
   - File type categories

3. **Search Features**
   - Real-time search results
   - Combine multiple search criteria
   - Clear filters option
   - Responsive search interface

The search system is optimized with database indexes for fast query execution and supports partial matching for filenames.

## 📝 API Documentation

### File Management Endpoints

#### List Files
- **GET** `/api/files/`
- Returns a list of all uploaded files
- Response includes file metadata (name, size, type, upload date)

#### Upload File
- **POST** `/api/files/`
- Upload a new file
- Request: Multipart form data with 'file' field
- Returns: File metadata including ID and upload status

#### Get File Details
- **GET** `/api/files/<file_id>/`
- Retrieve details of a specific file
- Returns: Complete file metadata

#### Delete File
- **DELETE** `/api/files/<file_id>/`
- Remove a file from the system
- Returns: 204 No Content on success

#### Download File
- Access file directly through the file URL provided in metadata

## 🗄️ Project Structure

```
file-hub/
├── backend/                # Django backend
│   ├── files/             # Main application
│   │   ├── models.py      # Data models
│   │   ├── views.py       # API views
│   │   ├── urls.py        # URL routing
│   │   └── serializers.py # Data serialization
│   ├── core/              # Project settings
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json      # Node.js dependencies
└── docker-compose.yml    # Docker composition
```

## 🔧 Development Features

- Hot reloading for both frontend and backend
- React Query DevTools for debugging data fetching
- TypeScript for better development experience
- Tailwind CSS for rapid UI development

## 🐛 Troubleshooting

1. **Port Conflicts**
   ```bash
   # If ports 3000 or 8000 are in use, modify docker-compose.yml or use:
   # Frontend: npm start -- --port 3001
   # Backend: python manage.py runserver 8001
   ```

2. **File Upload Issues**
   - Maximum file size: 10MB
   - Ensure proper permissions on media directory
   - Check network tab for detailed error messages

3. **Database Issues**
   ```bash
   # Reset database
   rm backend/data/db.sqlite3
   python manage.py migrate
   ```

# Project Submission Instructions

## Preparing Your Submission

1. Before creating your submission zip file, ensure:
   - All features are implemented and working as expected
   - All tests are passing
   - The application runs successfully locally
   - Remove any unnecessary files or dependencies
   - Clean up any debug/console logs

2. Create the submission zip file:
   ```bash
   # Activate your backend virtual environment first
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Run the submission script from the project root
   cd ..
   python create_submission_zip.py
   ```

   The script will:
   - Create a zip file named `username_YYYYMMDD.zip` (e.g., `johndoe_20240224.zip`)
   - Respect .gitignore rules to exclude unnecessary files
   - Preserve file timestamps
   - Show you a list of included files and total size
   - Warn you if the zip is unusually large

3. Verify your submission zip file:
   - Extract the zip file to a new directory
   - Ensure all necessary files are included
   - Verify that no unnecessary files (like node_modules, __pycache__, etc.) are included
   - Test the application from the extracted files to ensure everything works

## Video Documentation Requirement

**Video Guidance** - Record a screen share demonstrating:
- How you leveraged Gen AI to help build the features
- Your prompting techniques and strategies
- Any challenges you faced and how you overcame them
- Your thought process in using AI effectively

**IMPORTANT**: Please do not provide a demo of the application functionality. Focus only on your Gen AI usage and approach.

## Submission Process

1. Submit your project through this Google Form:
   [Project Submission Form](https://forms.gle/nr6DZAX3nv6r7bru9)

2. The form will require:
   - Your project zip file (named `username_YYYYMMDD.zip`)
   - Your video documentation
   - Any additional notes or comments about your implementation

Make sure to test the zip file and video before submitting to ensure they are complete and working as expected.

