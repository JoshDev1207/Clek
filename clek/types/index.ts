export interface Card {
  id: string
  front: string
  back: string
  tags: string[]
  deck_id: string
  created_at: string
}

export interface Deck {
  id: string
  name: string
  description: string
  user_id: string
  tags: string[]
  card_count: number
  created_at: string
  updated_at: string
}

export interface GeneratedCard {
  front: string
  back: string
  tags: string[]
}

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string
  generations_today: number
  last_generation_date: string
}

export type StudyMode = 'flashcard' | 'quiz' | 'review'
export type QuizType = 'multiple-choice' | 'true-false' | 'identification'
