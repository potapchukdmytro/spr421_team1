# Web Chat Application
<<<<<<< HEAD

![Screenshot](screenshot.png)
=======
>>>>>>> c82b1d9f257a56aaab4fdd12bb2bd21a49f1e2c0

## Built With

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=black)
![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

</div>
<<<<<<< HEAD

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **.NET 8 SDK**
- **PostgreSQL** database

### 1. Clone the Repository
```bash
git clone https://github.com/potapchukdmytro/spr421_team1.git
cd spr421_team1
```

### 2. Setup Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend will run on `http://localhost:5174`

### 3. Setup Backend
```bash
cd backend/web_chat

# Update connection string in appsettings.json:
# "axneo_db": "Host=localhost;Database=webchat_test;Username=YOUR_USERNAME;Password=YOUR_PASSWORD"

# Apply migrations
dotnet ef database update

# Run backend
dotnet run
```
Backend will run on `http://localhost:5000`

### 4. Open the App
Navigate to `http://localhost:5174` and enjoy! 🎉

## 📝 Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`appsettings.json`):
```json
{
  "ConnectionStrings": {
    "axneo_db": "Host=localhost;Database=webchat_test;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

## ✨ Features

- 🔐 **Authentication** - JWT-based login/register with confetti celebration
- 💬 **Real-time Chat** - View rooms and messages (read-only for now)
- 🎨 **Premium UI** - Notion-style design with GSAP animations
- 🎭 **3D Parallax** - Interactive mouse-tracking effects
- 📱 **Responsive** - Works on all devices

## 🏗️ Project Status

✅ **Completed:**
- Authentication system
- Premium UI/UX with animations
- Basic chat interface (read-only)

🚧 **In Progress:**
- Real-time messaging with SignalR
- Room creation and management
- Message sending functionality

## 👥 Team

Made by [Kyuuto09](https://github.com/Kyuuto09), [axneo27](https://github.com/axneo27), [SlavaMokrynskyi](https://github.com/SlavaMokrynskyi), [da2045](https://github.com/da2045) & [samoliukrustam123](https://github.com/samoliukrustam123)

=======
>>>>>>> c82b1d9f257a56aaab4fdd12bb2bd21a49f1e2c0
