<p align="center">
  <img src="public/banner.png" alt="Cherify Banner" width="100%">
</p>

# 🎵 Cherify Music Platform

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel)](https://cherify-eta.vercel.app)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

**Cherify** is a high-fidelity, production-grade music streaming platform built with React 19 and Vite. It features a sleek, Spotify-inspired interface, real-time music synchronization, and a robust cloud-sync infrastructure for a seamless listening experience across devices.

[**Live Demo »**](https://cherify-eta.vercel.app)

---

## ✨ Key Features

- 🎧 **High-Fidelity Playback**: Seamless music streaming with high-quality audio retrieval via Saavn API.
- 🔐 **Secure Authentication**: Firebase-powered user accounts with support for Email/Password and Anonymous login.
- ☁️ **Cloud Sync**: Real-time synchronization of liked songs, playlists, and user profiles across multiple devices.
- 🎨 **Premium UI**: Modern, glassmorphic design with smooth micro-animations and a fully responsive layout.
- 📜 **Dynamic Lyrics**: Real-time lyrics retrieval for a complete karaoke-like experience.
- 📱 **Mobile Optimized**: Custom mobile navigation and layout tailored for on-the-go streaming.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 (Hooks, Context API)
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS (Modern CSS variables, Flexbox, Grid)
- **Backend-as-a-Service**: Firebase (Authentication, Firestore)
- **API Integration**: @saavn-labs/sdk
- **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ecclesiastescherubin1-spec/cherify.git
   cd cherify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root or update `src/services/firebase.js` with your Firebase configuration.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 📁 Project Structure

```text
cherify/
├── src/
│   ├── components/    # Reusable UI components (Sidebar, PlaybackBar, etc.)
│   ├── context/       # State management (PlayerContext)
│   ├── services/      # API and Firebase logic
│   ├── assets/        # Images and static files
│   └── main.jsx       # Entry point
├── public/            # Static public assets
├── netlify/           # Serverless functions for Netlify
├── vercel.json        # Vercel deployment configuration
└── vite.config.js     # Vite configuration
```

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/ecclesiastescherubin1-spec">Ecclesiastes Cherubin</a>
</p>
