# AI Career Guru

An AI-powered career coach and resume analyzer application.

## Features

- Resume Checker with ATS Analysis
- Interview Preparation
- Job Search Tools
- Career Path Planning

## Setup Instructions

### Main Application

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env` (if needed)
   - Fill in required API keys

3. Start the development server:
   ```
   npm run dev
   ```

### ATS Analysis Server (Optional)

The ATS Analysis feature can work in two modes:
- **Live Mode**: Using the Express server with Gemini API for real-time analysis
- **Mock Mode**: Using a fallback mock service if the server is not running

To use the live ATS analysis:

1. Make sure your `.env` file contains:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ATS_SERVER_PORT=5000
   NEXT_PUBLIC_ATS_SERVER_URL=http://localhost:5000
   ```

2. Start the ATS server in a separate terminal:
   ```
   npm run ats-server
   ```

3. The server should start on port 5000 (or as specified in your env file)

If the server is not running, the application will automatically fall back to mock analysis.

## Technologies Used

- Next.js 15
- React 19
- Tailwind CSS
- Express.js (for ATS analyzer)
- Google Generative AI (Gemini)
