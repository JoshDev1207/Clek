import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    let text = ''

    if (ext === 'txt' || ext === 'md') {
      text = await file.text()
    } else if (ext === 'json') {
      const raw = await file.text()
      try {
        const json = JSON.parse(raw)
        if (json.cards) {
          text = json.cards.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n')
        } else {
          text = JSON.stringify(json, null, 2)
        }
      } catch {
        text = raw
      }
    } else if (ext === 'csv') {
      text = await file.text()
    } else if (ext === 'pdf' || ext === 'docx' || ext === 'pptx') {
      text = await extractWithGroq(file, ext)
    } else {
      text = await file.text()
    }

    const MAX_CHARS = 40000
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + '\n\n[Content truncated]'
    }

    return NextResponse.json({ text, charCount: text.length })
  } catch (error: any) {
    console.error('Text extraction error:', error)
    return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 })
  }
}

async function extractWithGroq(file: File, ext: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq API key not configured')

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  const mimeType = mimeTypes[ext] || 'application/octet-stream'

  // Try Groq document vision first (supports PDF natively)
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract and return ALL the text content from this document. Return only the raw text content, preserving structure like headings and paragraphs. Do not summarize or add commentary.',
            },
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
    }),
  })

  if (response.ok) {
    const data = await response.json()
    const extracted = data.choices?.[0]?.message?.content || ''
    if (extracted.trim()) return extracted
  }

  // Fallback: extract raw strings from binary and clean with Groq text model
  return extractTextFallback(arrayBuffer, ext, apiKey)
}

async function extractTextFallback(
  arrayBuffer: ArrayBuffer,
  ext: string,
  apiKey: string
): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer)

  // Pull readable ASCII strings from the binary
  let raw = ''
  let current = ''
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i]
    if (c >= 32 && c <= 126) {
      current += String.fromCharCode(c)
    } else {
      if (current.length >= 4) raw += current + ' '
      current = ''
    }
  }
  if (current.length >= 4) raw += current

  const snippet = raw.slice(0, 12000)

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 6000,
      messages: [
        {
          role: 'system',
          content: 'You are a text extraction assistant. Extract only meaningful readable content from raw document data, removing XML tags, binary garbage, and formatting artifacts. Return clean plain text only.',
        },
        {
          role: 'user',
          content: `Extract the readable text content from this raw ${ext} document data:\n\n${snippet}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Failed to extract text from ${ext} file`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}