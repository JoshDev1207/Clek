import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { text, count = 15, topic } = await request.json()

    if (!text && !topic) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    const sourceContent = text
      ? `SOURCE MATERIAL:\n${text}`
      : `TOPIC: ${topic}`

    const systemPrompt = `You are a precise flashcard generator. Generate exactly ${count} flashcards from the provided content.

CRITICAL RULES:
1. Every card MUST be directly based on the source material — NO hallucination
2. Front: a clear question or prompt
3. Back: a concise, accurate answer from the source
4. Tags: 1-3 short topic tags relevant to the card
5. If source content is insufficient for ${count} unique cards, generate fewer cards rather than inventing content
6. Return ONLY valid JSON, no other text

Return this exact JSON structure:
{
  "cards": [
    {
      "front": "Question here?",
      "back": "Answer here.",
      "tags": ["Tag1", "Tag2"]
    }
  ]
}`

    const userPrompt = `${sourceContent}\n\nGenerate ${count} flashcards. Return only JSON.`

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
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error: ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('No content from Groq')

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else throw new Error('Failed to parse Groq response')
    }

    const cards = parsed.cards || []

    // Validate cards have required fields
    const validCards = cards.filter((c: any) =>
      c.front && c.back &&
      typeof c.front === 'string' &&
      typeof c.back === 'string' &&
      c.front.trim().length > 0 &&
      c.back.trim().length > 0
    ).map((c: any) => ({
      front: c.front.trim(),
      back: c.back.trim(),
      tags: Array.isArray(c.tags) ? c.tags.slice(0, 3).map((t: string) => String(t).trim()) : [],
    }))

    return NextResponse.json({ cards: validCards })
  } catch (error: any) {
    console.error('Card generation error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}
