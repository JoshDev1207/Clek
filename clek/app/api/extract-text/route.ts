import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    let text = ''

    if (ext === 'pdf') {
      text = await extractPDF(file)
    } else if (ext === 'pptx' || ext === 'docx') {
      text = await extractOfficeDoc(file)
    } else if (ext === 'txt' || ext === 'md') {
      text = await file.text()
    } else if (ext === 'json') {
      const raw = await file.text()
      try {
        const json = JSON.parse(raw)
        // If it's a Clek export format
        if (json.cards) {
          text = json.cards.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n')
        } else {
          text = JSON.stringify(json, null, 2)
        }
      } catch {
        text = raw
      }
    } else {
      text = await file.text()
    }

    // Limit text size
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

async function extractPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  try {
    const pdfParseModule = (await import('pdf-parse')) as any
    const pdfParse = pdfParseModule.default ?? pdfParseModule
    const data = await pdfParse(Buffer.from(arrayBuffer))
    if (typeof data?.text === 'string' && data.text.trim()) {
      return data.text
    }
  } catch (e) {
    console.warn('pdf-parse failed, falling back to pdfjs-dist', e)
  }

  try {
    const pdfjs = (await import('pdfjs-dist')) as any
    const getDocument = pdfjs.getDocument ?? pdfjs.default?.getDocument
    if (typeof getDocument !== 'function') {
      throw new Error('pdfjs-dist getDocument unavailable')
    }

    const loadingTask = getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    let text = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ')
      text += pageText + '\n\n'
    }

    if (text.trim()) {
      return text
    }
  } catch (e) {
    console.warn('pdfjs-dist fallback failed', e)
  }

  throw new Error('No extractable text found in this PDF. It may be scanned or image-only.')
}

async function extractOfficeDoc(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value || ''
  } catch (e) {
    throw new Error('Failed to extract document text')
  }
}