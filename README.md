# 🧠 AI Quiz - Interactive Quiz Application

A modern, responsive quiz application built with React and Vite, designed for deployment on GitHub Pages. Test your knowledge with customizable quiz sessions featuring a dynamic timer and detailed results!

![Quiz App Preview](https://img.shields.io/badge/React-18.2-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-cyan)

## ✨ Features

- **📊 Customizable Quiz Length**: Select between 1-500 questions using an intuitive slider
- **⏱️ Dynamic Timer**: Time limit calculated automatically (10 minutes per 20 questions)
- **🔀 Randomized Questions**: Questions and answer options are shuffled each session
- **🎯 Progress Tracking**: Real-time progress bar and answered question counter
- **⌨️ Keyboard Navigation**: Use arrow keys and number keys for quick navigation
- **📱 Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **📈 Detailed Results**: Comprehensive review with explanations for each question
- **🎨 Modern UI**: Clean, polished interface with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/AI-quiz.git
   cd AI-quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌐 Deploying to GitHub Pages

### Method 1: Using gh-pages (Recommended)

1. **Update the base path** in `vite.config.js`:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/YOUR-REPO-NAME/', // Replace with your repository name
   })
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages**
   - Go to your repository's Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select `gh-pages` branch and `/ (root)` folder
   - Click Save

Your app will be available at `https://YOUR_USERNAME.github.io/YOUR-REPO-NAME/`

### Method 2: Using GitHub Actions (Automatic)

The repository includes a GitHub Actions workflow that automatically deploys on push to main.

1. Go to Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to the main branch

## 🎮 How to Use

1. **Setup Screen**: Use the slider to select how many questions you want
2. **View Time**: The calculated time limit is displayed before starting
3. **Start Quiz**: Click "Start Quiz" to begin
4. **Answer Questions**: Click options or use number keys (1-4)
5. **Navigate**: Use "Next/Previous" buttons or arrow keys
6. **Submit**: Click "Submit Quiz" when done or let the timer expire
7. **Review**: See your score and review all questions with explanations

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` | Next question |
| `←` | Previous question |
| `1-4` | Select answer option |

## 📁 Project Structure

```
AI-quiz/
├── src/
│   ├── components/
│   │   ├── QuizSetup.jsx      # Setup screen with slider
│   │   ├── QuizQuestion.jsx   # Question display component
│   │   ├── QuizTimer.jsx      # Countdown timer
│   │   ├── QuizResults.jsx    # Results and review screen
│   │   └── ProgressBar.jsx    # Progress indicator
│   ├── data/
│   │   └── questions.json     # Quiz questions database
│   ├── App.jsx                # Main application component
│   ├── App.css                # Additional styles
│   ├── index.css              # Global styles & Tailwind
│   └── main.jsx               # Application entry point
├── public/
│   └── quiz-icon.svg          # Favicon
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## ⏱️ Time Calculation

The quiz time limit is calculated using the formula:

```
Time (minutes) = (Number of Questions / 20) × 10
```

| Questions | Time Limit |
|-----------|------------|
| 20 | 10 minutes |
| 40 | 20 minutes |
| 100 | 50 minutes |
| 200 | 100 minutes |
| 500 | 250 minutes |

## 🎨 Customization

### Adding Questions

Edit `src/data/questions.json` to add your own questions:

```json
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": "Option B",
  "explanation": "Why this is the correct answer",
  "topic": "Category"
}
```

### Styling

The app uses Tailwind CSS. Customize colors and themes in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite 5** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Router** - Navigation (HashRouter for GitHub Pages)

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own quiz app!

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Blank page after deployment

Make sure the `base` in `vite.config.js` matches your repository name exactly (case-sensitive).

### Timer not accurate

The timer automatically adjusts when you switch tabs and return, so time spent away from the tab is accounted for.

### Questions not loading

Ensure `questions.json` is valid JSON. You can validate it at [jsonlint.com](https://jsonlint.com/).

---

Made with ❤️ using React and Vite

