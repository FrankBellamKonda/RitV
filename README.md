
# 💌 RitV - A Cinematic Valentine's Experience

A highly interactive, 3D Valentine's Day proposal website built with **React** and **Framer Motion**. Designed to be mobile-responsive, immersive, and impossible to say "No" to.

**[View Live Demo](https://FrankBellamKonda.github.io/RitV/)**

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react) ![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=for-the-badge&logo=vite) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css) ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

* **🎟️ 3D Interactive Ticket:** A gyro-enabled, tilt-responsive 3D admission ticket that works seamlessly on both mobile and desktop.
* **🎵 Immersive Audio:** Background music player with smooth fade-in effects and a global mute toggle.
* **🚫 The "Unclickable" No:** A "No" button that playfully dodges the cursor and guilt-trips the user with changing text.
* **🎉 Confetti Celebration:** A custom canvas confetti explosion upon saying "Yes."
* **📱 Mobile Optimized:** Features touch-safe interactions, scroll-locking, and velocity smoothing for a perfect phone experience.
* **🐱 Interactive Avatar:** A cute SVG cat that reacts to mouse movements and emotions.

## 🛠️ Tech Stack

* **Core:** React + Vite
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **3D Effects:** Custom CSS 3D Transforms + JS Physics
* **Extras:** `canvas-confetti`, `lucide-react` (Icons)

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/FrankBellamKonda/RitV.git](https://github.com/FrankBellamKonda/RitV.git)
cd RitV

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Run Development Server

```bash
npm run dev

```

Open `http://localhost:5173` in your browser to see the site.

## 🎨 Customization Guide

Want to use this for your own Valentine? Here is how to personalize it:

**1. Change the Names:**
Open `src/App.jsx` and search for the `Ticket` component.

```jsx
// Change "FEMALE HORSE" to your partner's name
<p className="...">ADMIT ONE: YOUR_NAME_HERE</p>

// Change the ID
<div className="...">ID: NAME1-LOVES-NAME2</div>

```

**2. Change the Music:**
Replace the file at `public/music/clair.mp3` with your own song (keep the name `clair.mp3` or update the path in `src/App.jsx`).

## 📦 Deployment Strategy

This project is set up for a dual-deployment strategy:

### Option A: GitHub Pages (Open Source Version)

*configured for generic/template use*

1. Update `vite.config.js` to include your repo name: `base: "/RitV/"`.
2. Run `npm run deploy`.

### Option B: Netlify (Personalized Version)

*configured for private/custom use*

1. Comment out the `base` line in `vite.config.js`.
2. Run `npm run build`.
3. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop).

## 📄 License

(MIT)This project is open source. Feel free to use it to spread some love! ❤️

---

<p align="center">
Made with ❤️ by <b>FrankBellamKonda (Jassy)</b>
