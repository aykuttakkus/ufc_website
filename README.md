UFC Fighters App
Türkçe: Bu proje, UFC dövüşçülerini listelemenize, detaylarını görüntülemenize ve kendi favori dövüşçüler listenizi oluşturmanıza olanak tanıyan tam kapsamlı bir web uygulamasıdır. Dövüşçü bilgileri hem Türkçe hem İngilizce olarak saklanır ve REST API ile yönetilir.

Project Overview
The UFC Fighters App is a full-stack web application that allows users to browse UFC fighters, view detailed fighter profiles, and manage their own personalized list of favorite fighters. The application features a comprehensive REST API backend with full CRUD operations and stores all fighter and favorite data in its own database.
Key highlights include:

Bilingual support with Turkish and English fields for all fighter data
Complete fighter management system with detailed profiles
Personal favorites system with custom notes
Advanced filtering by name, weight class, and country
RESTful API architecture with POST, GET, PUT, and DELETE operations


Key Features
Fighter Management

Comprehensive Fighter List: Browse all UFC fighters with advanced filtering options

Filter by fighter name
Filter by weight class (Flyweight, Bantamweight, Featherweight, Lightweight, Welterweight, Middleweight, Light Heavyweight, Heavyweight)
Filter by country/nationality


Detailed Fighter Profiles: View complete fighter information including stats, biography, and fight record
Bilingual Data: All fighter information available in both Turkish and English

Favorites System

Personal Favorites List: Create and manage your own list of favorite fighters
Custom Notes: Add bilingual notes (Turkish and English) to each favorite fighter
Easy Management: Add, update, and remove favorites with simple interactions

Technical Features

Full REST API: Complete CRUD operations for fighters and favorites
Bilingual Database: Turkish and English fields stored directly in the database
Responsive Design: Works seamlessly on desktop and mobile devices
Real-time Updates: Changes reflect immediately across the application


Technology Stack
Backend

Runtime: Node.js (v18+)
Framework: Express.js
Database: MongoDB with Mongoose ODM
Validation: Joi / Express Validator
Environment Management: dotenv

Frontend

Framework: React (v18+)
State Management: React Context API / Redux Toolkit
Routing: React Router v6
HTTP Client: Axios
UI Framework: Tailwind CSS
Icons: Lucide React

Development Tools

Language: TypeScript
Build Tool: Vite
Code Quality: ESLint, Prettier
Version Control: Git


Data Model / Database Schema
Fighters Collection
javascript{
  _id: ObjectId,
  nameEn: String,              // Fighter name in English
  nameTr: String,              // Fighter name in Turkish
  nicknameEn: String,          // Nickname in English
  nicknameTr: String,          // Nickname in Turkish
  weightClass: String,         // e.g., "Lightweight", "Welterweight"
  country: String,             // Country code or full name
  wins: Number,                // Total wins
  losses: Number,              // Total losses
  draws: Number,               // Total draws
  stance: String,              // e.g., "Orthodox", "Southpaw"
  reach: Number,               // Reach in inches
  height: String,              // e.g., "5'10\""
  imageUrl: String,            // Profile image URL
  bioEn: String,               // Biography in English
  bioTr: String,               // Biography in Turkish
  createdAt: Date,
  updatedAt: Date
}
Favorites Collection
javascript{
  _id: ObjectId,
  fighterId: ObjectId,         // Reference to Fighters collection
  noteEn: String,              // User's note in English
  noteTr: String,              // User's note in Turkish
  createdAt: Date
}
Relationship: Each favorite document references a fighter through fighterId. When fetching favorites, the API performs a population/join to include the complete fighter details alongside the favorite entry.

API Endpoints
Fighters Endpoints
GET /api/fighters
Retrieve all fighters with optional filtering.
Query Parameters:

name (optional): Filter by fighter name (partial match, case-insensitive)
weightClass (optional): Filter by weight class
country (optional): Filter by country

Example Request:
httpGET /api/fighters?weightClass=Lightweight&country=USA
Example Response:
json{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nameEn": "Conor McGregor",
      "nameTr": "Conor McGregor",
      "nicknameEn": "The Notorious",
      "nicknameTr": "The Notorious",
      "weightClass": "Lightweight",
      "country": "Ireland",
      "wins": 22,
      "losses": 6,
      "draws": 0,
      "stance": "Southpaw",
      "reach": 74,
      "imageUrl": "/images/fighters/conor.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
GET /api/fighters/:id
Retrieve detailed information for a specific fighter.
Example Response:
json{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "nameEn": "Conor McGregor",
    "nameTr": "Conor McGregor",
    "bioEn": "Irish professional mixed martial artist...",
    "bioTr": "İrlandalı profesyonel karma dövüş sanatçısı...",
    "weightClass": "Lightweight",
    "wins": 22,
    "losses": 6
  }
}
POST /api/fighters
Create a new fighter.
Request Body:
json{
  "nameEn": "Khabib Nurmagomedov",
  "nameTr": "Khabib Nurmagomedov",
  "nicknameEn": "The Eagle",
  "nicknameTr": "Kartal",
  "weightClass": "Lightweight",
  "country": "Russia",
  "wins": 29,
  "losses": 0,
  "draws": 0,
  "stance": "Orthodox",
  "reach": 70,
  "bioEn": "Russian retired professional mixed martial artist...",
  "bioTr": "Rus emekli profesyonel karma dövüş sanatçısı..."
}
PUT /api/fighters/:id
Update an existing fighter.
Request Body: (partial update supported)
json{
  "wins": 23,
  "losses": 6,
  "bioEn": "Updated biography..."
}
DELETE /api/fighters/:id
Delete a fighter.
Example Response:
json{
  "success": true,
  "message": "Fighter deleted successfully"
}

Favorites Endpoints
GET /api/favorites
Retrieve all favorite fighters with populated fighter details.
Example Response:
json{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "fighterId": {
        "_id": "507f1f77bcf86cd799439011",
        "nameEn": "Conor McGregor",
        "nameTr": "Conor McGregor",
        "weightClass": "Lightweight",
        "imageUrl": "/images/fighters/conor.jpg"
      },
      "noteEn": "My favorite fighter of all time!",
      "noteTr": "Tüm zamanların en sevdiğim dövüşçüsü!",
      "createdAt": "2024-01-20T14:30:00.000Z"
    }
  ]
}
POST /api/favorites
Add a fighter to favorites.
Request Body:
json{
  "fighterId": "507f1f77bcf86cd799439011",
  "noteEn": "Amazing striking skills",
  "noteTr": "İnanılmaz vuruş becerileri"
}
PUT /api/favorites/:id
Update notes for a favorite fighter.
Request Body:
json{
  "noteEn": "Updated note in English",
  "noteTr": "Türkçe güncellenmiş not"
}
DELETE /api/favorites/:id
Remove a fighter from favorites.

Internationalization / Bilingual Data
This application implements bilingual support at the database level, storing both Turkish and English versions of fighter information directly in the database schema. This approach provides several advantages:

Performance: No runtime translation needed; data is pre-translated and ready to serve
Accuracy: Human-curated translations ensure contextual accuracy
Flexibility: Different content can be provided for each language when literal translation isn't appropriate
Consistency: All language-specific data managed in one place

Frontend Language Selection
The application provides a language toggle in the header/navigation bar that allows users to switch between Turkish and English. The selected language preference is:

Stored in browser localStorage for persistence
Applied throughout the application to display the appropriate fields (e.g., nameEn vs nameTr)
Can be controlled via URL parameter (e.g., ?lang=tr or ?lang=en) for direct linking


Project Structure
ufc-fighters-app/
├── server/                          # Backend application
│   ├── src/
│   │   ├── config/                  # Configuration files (database, constants)
│   │   ├── controllers/             # Route controllers (business logic)
│   │   ├── models/                  # Mongoose models (Fighter, Favorite)
│   │   ├── routes/                  # Express route definitions
│   │   ├── middleware/              # Custom middleware (error handling, validation)
│   │   ├── services/                # Business logic layer
│   │   ├── utils/                   # Utility functions and helpers
│   │   └── server.js                # Main application entry point
│   ├── .env.example                 # Environment variables template
│   └── package.json
│
├── client/                          # Frontend application
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── fighters/            # Fighter-related components
│   │   │   ├── favorites/           # Favorites-related components
│   │   │   ├── common/              # Shared/reusable components
│   │   │   └── layout/              # Layout components (Header, Footer)
│   │   ├── pages/                   # Page-level components
│   │   │   ├── FightersList.jsx
│   │   │   ├── FighterDetail.jsx
│   │   │   └── Favorites.jsx
│   │   ├── context/                 # React Context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API service functions
│   │   ├── utils/                   # Frontend utilities
│   │   ├── App.jsx                  # Main App component
│   │   └── main.jsx                 # Application entry point
│   ├── public/                      # Static assets
│   └── package.json
│
└── README.md
Key Directory Explanations

server/controllers/: Handle incoming HTTP requests, process data, and send responses. Each controller focuses on a specific resource (fighters or favorites).
server/models/: Define MongoDB schemas and models using Mongoose, establishing data structure and validation rules.
server/routes/: Define API endpoints and map them to appropriate controller functions.
client/components/: Reusable React components organized by feature (fighters, favorites) and purpose (common, layout).
client/pages/: Top-level page components that correspond to different routes in the application.
client/services/: Abstraction layer for API calls using Axios, providing clean interfaces for backend communication.


Installation & Setup
Prerequisites

Node.js (v18 or higher)
MongoDB (v6 or higher) - local installation or MongoDB Atlas account
npm or yarn package manager

1. Clone the Repository
bashgit clone https://github.com/yourusername/ufc-fighters-app.git
cd ufc-fighters-app
2. Backend Setup
bashcd server
npm install
3. Environment Configuration
Create a .env file in the server/ directory:
env# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ufc_fighters
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ufc_fighters

# CORS
CLIENT_URL=http://localhost:5173

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
4. Database Setup
The application will automatically connect to MongoDB when started. For initial data seeding:
bash# Optional: Run seed script to populate initial fighter data
npm run seed
5. Frontend Setup
bashcd ../client
npm install
Create a .env file in the client/ directory:
envVITE_API_URL=http://localhost:5000/api
6. Running the Application
Development Mode (run both backend and frontend):
Terminal 1 - Backend:
bashcd server
npm run dev
Backend will start on http://localhost:5000
Terminal 2 - Frontend:
bashcd client
npm run dev
Frontend will start on http://localhost:5173
Alternative: Run both simultaneously (if you've set up concurrently):
bash# From root directory
npm run dev

Usage
Accessing the Application
Once both servers are running, open your browser and navigate to:
http://localhost:5173
Basic Workflow

Browse Fighters

Navigate to the homepage to see the complete list of UFC fighters
Use the filter options to search by name, weight class, or country
Click on any fighter card to view detailed information


View Fighter Details

On the detail page, you'll see comprehensive information including stats, biography, and fight record
Switch between Turkish and English using the language toggle to see bilingual content
Click the "Add to Favorites" button to save the fighter to your favorites list


Manage Favorites

Navigate to the "Favorites" page from the main navigation
View all your favorite fighters in one place
Add personal notes in both Turkish and English by clicking "Edit Note"
Remove fighters from favorites by clicking the "Remove" button



Example Scenario
1. Start the application
2. Click "Add New Fighter" (admin feature)
3. Fill in fighter details in both English and Turkish
4. Submit the form to create the fighter
5. Navigate back to fighters list and find your newly created fighter
6. Click on the fighter to view details
7. Click "Add to Favorites" and add a personal note
8. Go to Favorites page to see your favorite fighter with the note
9. Update the note with new information
10. Remove the fighter from favorites when done

Future Improvements

Authentication & User Management: Implement user registration and login system so each user can have their own personal favorites list
Real UFC API Integration: Sync with an official or third-party UFC API to automatically update fighter stats, upcoming fights, and real-time data
Advanced Filtering & Sorting: Add more filter options (age range, fighting style, win streaks) and sorting capabilities (by win rate, recent fights, etc.)
Admin Panel: Create a dedicated admin interface for managing fighters, reviewing user favorites, and monitoring application analytics
Fight Results & Schedule: Add upcoming fight schedules and historical fight results with detailed round-by-round breakdowns
Social Features: Allow users to share their favorite fighters lists and follow other users
Fighter Comparison Tool: Side-by-side comparison of two or more fighters with statistical analysis
Mobile Application: Develop native iOS and Android apps using React Native
Push Notifications: Notify users about upcoming fights featuring their favorite fighters
Dark Mode: Implement theme switching for better user experience


Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Fork the project
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request


License
This project is licensed under the MIT License. See the LICENSE file for details.
