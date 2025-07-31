# 🎂 Shake4Cake - Social Media Contest Platform

A TikTok-style social media competition app where users can create contests, submit video entries, and compete for prizes. Built with HTML, CSS, JavaScript, and Firebase.

## ✨ Features

### 🏠 News Feed (`index.html`)
- **TikTok-style vertical layout** with scrollable contest cards
- **Contest information display**: title, prize, countdown timer, media preview
- **Real-time updates** for contest status and participant counts
- **Interactive buttons** to enter contests and view submissions
- **Responsive design** with bottom navigation bar

### 📤 Contest Creation (`upload.html`)
- **Complete contest form** with title, description, prize, and rules
- **Multi-media support**: upload songs, images, or videos for contest media
- **Flexible timing**: set custom end dates with minimum 1-hour duration
- **Real-time preview** of contest appearance
- **Drag & drop file upload** with progress indicators
- **Firebase Storage integration** for media hosting

### 🎬 Contest View (`contest.html`)
- **Media playback** for contest songs, images, and videos
- **Video recording interface** using MediaRecorder API
- **Background music playback** during video recording
- **Submission gallery** with like and voting functionality
- **Real-time comments** and engagement features
- **One vote per user** enforcement via Firestore rules

### 🏆 Leaderboard (`leaderboard.html`)
- **User rankings** based on contest wins and participation
- **Interactive podium** showing top 3 users with animations
- **Multiple ranking categories**: winners, creators, most active
- **Achievement badges** system with unlockable rewards
- **Time-based filtering**: all-time, monthly, weekly rankings
- **User profile previews** with stats and badges

### 🔍 Explore (`explore.html`)
- **Advanced search** for contests, users, and hashtags
- **Real-time search suggestions** with autocomplete
- **Category browsing**: dance, singing, comedy, art, pets, food, sports
- **Trending content** discovery with algorithmic recommendations
- **Featured creators** showcase with follow functionality
- **Advanced filtering** by prize range, duration, media type

### 👤 Profile (`profile.html`)
- **Comprehensive user profiles** with customizable bio and avatar
- **Statistics dashboard**: contests created, submissions, wins, likes
- **Tabbed interface**: my contests, submissions, favorites, following
- **Editable profile settings** with privacy controls
- **Achievement showcase** with earned badges
- **Social media links** integration (Instagram, TikTok, YouTube)

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Custom styling), Vanilla JavaScript (ES6+)
- **Backend**: Firebase Suite
  - **Authentication**: Email/password and anonymous login
  - **Database**: Firestore for real-time data
  - **Storage**: Firebase Storage for media files
- **Media Processing**: MediaRecorder API, Canvas API for thumbnails
- **Design**: Mobile-first responsive design with TikTok-inspired UI
- **Icons**: Font Awesome for consistent iconography

## 🚀 Quick Start

### Prerequisites
- Modern web browser with ES6+ support
- Firebase project with Firestore, Storage, and Authentication enabled
- Basic understanding of Firebase configuration

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shake4cake
   ```

2. **Firebase Configuration**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Anonymous)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config

3. **Update Firebase Config**
   Edit `js/firebase-config.js` and replace the placeholder config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

4. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Anyone can read contests, only creators can write
       match /contests/{contestId} {
         allow read: if true;
         allow write: if request.auth != null && 
           (request.auth.uid == resource.data.creatorId || 
            request.auth.uid == request.resource.data.creatorId);
       }
       
       // Submissions readable by all, writable by owner
       match /submissions/{submissionId} {
         allow read: if true;
         allow write: if request.auth != null && 
           (request.auth.uid == resource.data.userId || 
            request.auth.uid == request.resource.data.userId);
       }
       
       // Votes: one per user per contest
       match /votes/{voteId} {
         allow read: if true;
         allow write: if request.auth != null && 
           request.auth.uid == request.resource.data.userId;
       }
       
       // Likes: one per user per submission
       match /likes/{likeId} {
         allow read: if true;
         allow write: if request.auth != null && 
           request.auth.uid == request.resource.data.userId;
       }
       
       // Comments readable by all, writable by authenticated users
       match /comments/{commentId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

5. **Set up Storage Security Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Allow authenticated users to upload files
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. **Serve the Application**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

7. **Open in Browser**
   Navigate to `http://localhost:8000` to start using the app

## 📱 Usage Guide

### For Users

1. **Getting Started**
   - Visit the app and sign up with email or continue as guest
   - Complete your profile with avatar, bio, and social links
   - Explore trending contests and featured creators

2. **Participating in Contests**
   - Browse contests in the feed or explore page
   - Click "Enter Contest" to view details and requirements
   - Record your submission with background music playing
   - Submit your entry with optional title and description

3. **Creating Contests**
   - Click the "+" button in bottom navigation
   - Fill in contest details: title, description, prize
   - Upload contest media (song for dance contests, image for challenges)
   - Set duration and publish your contest

4. **Voting and Engagement**
   - Like submissions you enjoy
   - Vote for your favorite entry in each contest
   - Comment on submissions to engage with creators
   - Follow users whose content you love

### For Developers

1. **Code Structure**
   ```
   shake4cake/
   ├── index.html          # Main feed page
   ├── upload.html         # Contest creation
   ├── contest.html        # Contest view & submissions
   ├── leaderboard.html    # User rankings
   ├── explore.html        # Search & discovery
   ├── profile.html        # User profiles
   ├── styles/
   │   ├── main.css        # Global styles & variables
   │   ├── feed.css        # Feed-specific styles
   │   ├── upload.css      # Upload form styles
   │   ├── contest.css     # Contest view styles
   │   ├── leaderboard.css # Leaderboard styles
   │   ├── explore.css     # Explore page styles
   │   └── profile.css     # Profile styles
   └── js/
       ├── firebase-config.js  # Firebase setup & config
       ├── auth.js            # Authentication logic
       ├── utils.js           # Utility functions
       ├── feed.js            # Feed functionality
       ├── upload.js          # Contest creation
       ├── contest.js         # Contest viewing
       ├── recorder.js        # Video recording
       ├── leaderboard.js     # Rankings logic
       ├── explore.js         # Search functionality
       └── profile.js         # Profile management
   ```

2. **Key Components**
   - **AuthManager**: Handles user authentication and profile management
   - **ContestManager**: Manages contest creation, updates, and queries
   - **MediaRecorder**: Records video submissions with audio overlay
   - **InfiniteScroll**: Implements smooth pagination for feeds
   - **CountdownTimer**: Real-time contest deadline tracking

3. **Firebase Collections**
   ```
   users/           # User profiles and settings
   contests/        # Contest information and media
   submissions/     # User submissions to contests
   votes/           # Contest voting records
   likes/           # Submission likes
   comments/        # User comments on submissions
   notifications/   # System notifications
   ```

## 🎨 Customization

### Styling
- Modify CSS variables in `styles/main.css` for global theme changes
- Customize colors, spacing, and animations
- Add your own brand colors and logos

### Features
- Add new contest types by extending media type enums
- Implement additional achievement badges
- Create custom ranking algorithms
- Add social sharing functionality

### Firebase Rules
- Enhance security rules for production use
- Add rate limiting and abuse prevention
- Implement content moderation workflows

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "avatar-url",
  bio: "User bio",
  location: "City, Country",
  socialLinks: {
    instagram: "username",
    tiktok: "username",
    youtube: "channel"
  },
  stats: {
    contestsCreated: 0,
    submissionsMade: 0,
    totalWins: 0,
    totalLikes: 0
  },
  achievements: ["first_win", "popular"],
  settings: { /* privacy settings */ },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Contests Collection
```javascript
{
  id: "contest-id",
  title: "Contest Title",
  description: "Contest description",
  prize: "Prize description",
  mediaType: "video|audio|image",
  mediaURL: "storage-url",
  thumbnailURL: "thumbnail-url",
  creatorId: "user-id",
  endTime: timestamp,
  status: "active|ended",
  stats: {
    participants: 0,
    submissions: 0,
    views: 0
  },
  rules: "Additional rules",
  allowComments: true,
  publicVoting: true,
  createdAt: timestamp
}
```

### Submissions Collection
```javascript
{
  id: "submission-id",
  contestId: "contest-id",
  userId: "user-id",
  title: "Submission title",
  description: "Submission description",
  videoURL: "storage-url",
  thumbnailURL: "thumbnail-url",
  stats: {
    likes: 0,
    views: 0,
    comments: 0
  },
  status: "pending|approved",
  createdAt: timestamp
}
```

## 🔒 Security Features

- **Authentication**: Secure email/password and anonymous authentication
- **Authorization**: Firestore rules prevent unauthorized data access
- **File Upload Security**: File type and size validation
- **Rate Limiting**: Prevent spam submissions and votes
- **Content Moderation**: Placeholder for content filtering
- **Privacy Controls**: User-configurable privacy settings

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

### Other Platforms
- **Netlify**: Connect GitHub repo for automatic deployments
- **Vercel**: Simple deployment with GitHub integration
- **AWS S3**: Static website hosting with CloudFront CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit changes: `git commit -m "Add feature"`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Documentation**: Check the inline code comments for detailed explanations
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join discussions in GitHub Discussions
- **Firebase Help**: Consult [Firebase Documentation](https://firebase.google.com/docs)

## 🎯 Roadmap

- [ ] Push notifications for contest deadlines
- [ ] Advanced video editing tools
- [ ] Social media integration for sharing
- [ ] Live streaming contest submissions
- [ ] AI-powered content recommendations
- [ ] Mobile app development (React Native/Flutter)
- [ ] Admin dashboard for content moderation
- [ ] Analytics and insights for creators

---

**Happy coding! 🎉** Make sure to star the repository if you find it useful!