-- Migration to add missing columns to existing decks table
-- Run this in your Supabase SQL editor

-- Add categories column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'decks' AND column_name = 'categories'
    ) THEN
        ALTER TABLE decks ADD COLUMN categories text[] default '{}';
    END IF;
END $$;

-- Add quiz_options column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'decks' AND column_name = 'quiz_options'
    ) THEN
        ALTER TABLE decks ADD COLUMN quiz_options boolean default false;
    END IF;
END $$;

-- Add card_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'decks' AND column_name = 'card_count'
    ) THEN
        ALTER TABLE decks ADD COLUMN card_count int default 0;
    END IF;
END $$;
