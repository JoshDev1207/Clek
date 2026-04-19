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

  // Try Groq document vision first (llama-4-scout supports PDF natively)
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract and return ALL the text content from this document. Return only the raw text, preserving headings and paragraphs. No summaries or commentary.',
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

  // Fallback: extract readable strings from binary, send only a small chunk
  return extractTextFallback(arrayBuffer, ext, apiKey)
}

async function extractTextFallback(
  arrayBuffer: ArrayBuffer,
  ext: string,
  apiKey: string
): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer)

  // Pull readable ASCII strings from binary (works well for docx/pptx which are XML-based ZIPs)
  let raw = ''
  let current = ''
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i]
    if (c >= 32 && c <= 126) {
      current += String.fromCharCode(c)
    } else {
      // Only keep strings of 5+ chars to filter out binary noise
      if (current.length >= 5) raw += current + '\n'
      current = ''
    }
  }
  if (current.length >= 5) raw += current

  // Remove XML/HTML tags and common docx artifacts
  raw = raw
    .replace(/<[^>]{1,200}>/g, ' ')       // strip XML tags
    .replace(/[A-Za-z0-9+/]{40,}/g, '')   // strip base64 blobs
    .replace(/\s{3,}/g, '\n')             // collapse whitespace
    .trim()

  // Keep only first 4000 chars to stay well within 12k TPM limit
  const snippet = raw.slice(0, 4000)

  if (!snippet.trim()) {
    throw new Error(`Could not extract readable text from ${ext} file`)
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',  // 1M TPM limit - much more generous
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'Extract only meaningful readable text from the raw document data. Remove XML tags, binary artifacts, and noise. Return clean plain text.',
        },
        {
          role: 'user',
          content: snippet,
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