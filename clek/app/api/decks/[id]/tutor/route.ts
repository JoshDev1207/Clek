import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const question = String(body?.question || '').trim()
    const deckId = params.id

    if (!deckId) {
      return NextResponse.json({ error: 'Missing deck id' }, { status: 400 })
    }
    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('name')
      .eq('id', deckId)
      .single()

    if (deckError || !deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }

    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('front, back, tags')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true })

    if (cardsError) {
      return NextResponse.json({ error: 'Unable to load deck cards' }, { status: 500 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI key not configured' }, { status: 500 })
    }

    const sourceCards = (cards || []).slice(0, 40).map((card: any, index: number) => {
      const tags = Array.isArray(card.tags) ? card.tags.filter(Boolean).join(', ') : ''
      return `Card ${index + 1}:\nQ: ${card.front?.trim() || ''}\nA: ${card.back?.trim() || ''}${tags ? `\nTags: ${tags}` : ''}`
    }).join('\n\n')

    const systemPrompt = `You are an AI tutor named Clek. Answer questions using your general knowledge and internet-style information. You may use the deck content below as optional context, but do not limit your answer to it. If the user asks for a quiz, generate a short practice quiz; if they ask for memory tricks, provide helpful mnemonics.

Deck name: ${deck.name}

OPTIONAL DECK CONTEXT:
${sourceCards}`

    const userPrompt = `QUESTION: ${question}\n\nRespond as a friendly tutor in plain language. Keep the answer concise and helpful.`

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: `AI service error: ${text}` }, { status: 500 })
    }

    const data = await response.json()
    const answer = data?.choices?.[0]?.message?.content?.trim()

    if (!answer) {
      return NextResponse.json({ error: 'No answer generated' }, { status: 500 })
    }

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('Tutor API error:', error)
    return NextResponse.json({ error: error.message || 'Tutor request failed' }, { status: 500 })
  }
}
