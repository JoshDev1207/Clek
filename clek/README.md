# Clek — AI-Powered Flashcard & Quiz App

A clone of kwek.cards renamed **Clek**, built with Next.js 14, Supabase, and Groq AI.

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=gsk_xxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the SQL Editor, paste and run the contents of `supabase-schema.sql`
3. Go to **Authentication → Providers** and enable:
   - **Email** (enabled by default)
   - **Google** (add your Google OAuth client ID & secret)
4. Under **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/api/auth/callback`


   supabase password: VYaJ7Q9FgjqcOAs5

### 4. Get a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Create a free account
3. Generate an API key
4. Add it to your `.env.local` as `GROQ_API_KEY`

### 5. Install pdf-parse (for PDF extraction)

```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
clek/
├── app/
│   ├── api/
│   │   ├── auth/callback/     # Supabase OAuth callback
│   │   ├── extract-text/      # PDF/PPTX/DOCX text extraction
│   │   └── generate-cards/    # Groq AI card generation
│   ├── decks/
│   │   ├── page.tsx           # Decks list
│   │   ├── new/page.tsx       # Create new deck (main AI page)
│   │   └── [id]/
│   │       ├── page.tsx       # Individual deck view
│   │       ├── flashcards/    # Flashcard study mode
│   │       └── quiz/          # Quiz mode
│   ├── study/page.tsx         # Study hub
│   ├── dashboard/page.tsx     # Stats (coming soon)
│   └── kommunity/page.tsx     # Community (coming soon)
├── components/
│   ├── layout/
│   │   ├── AuthProvider.tsx   # Supabase auth context
│   │   ├── Navbar.tsx         # Navigation bar
│   │   └── SplashScreen.tsx   # Loading splash
│   └── ui/
│       └── AuthModal.tsx      # Sign in/up modal
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── extract.ts             # File text extraction
├── types/index.ts             # TypeScript types
└── supabase-schema.sql        # Database setup SQL
```

---

## ✨ Features

- **AI Card Generation** — Upload PDF, PPTX, DOCX, TXT, JSON or paste notes → Groq generates flashcards with zero hallucination (grounded in your source material)
- **Flashcard Mode** — Flip cards, rate Easy/Hard
- **Quiz Mode** — Multiple choice & true/false with instant feedback
- **Google OAuth + Email Auth** — Powered by Supabase
- **Splash Screen** — Smooth loading animation
- **Responsive Design** — Works on mobile and desktop

---

## 🔒 Free Limits

- 3 AI deck generations per day (free tier)
- Up to 20 cards per generation

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth + DB**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Groq API (Meta Llama 3 70B)
- **Styling**: Tailwind CSS
- **Font**: Cabinet Grotesk (via Fontshare)
- **Text Extraction**: pdf-parse, mammoth
