// Client-side text extraction utilities

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'txt' || ext === 'md') {
    return await file.text()
  }

  if (ext === 'json') {
    const text = await file.text()
    try {
      const json = JSON.parse(text)
      if (json.cards) {
        return json.cards.map((c: any) => `Q: ${c.front}\nA: ${c.back}`).join('\n\n')
      }
      return JSON.stringify(json, null, 2)
    } catch {
      return text
    }
  }

  if (ext === 'csv') {
    return await file.text()
  }

  if (ext === 'pdf') {
    return await extractPDFClientSide(file)
  }

  if (ext === 'docx') {
    return await extractDocxClientSide(file)
  }

  if (ext === 'pptx') {
    return await extractPptxClientSide(file)
  }

  return await file.text()
}

// ─── PDF: uses pdf.js from CDN ───────────────────────────────────────────────

async function extractPDFClientSide(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  // Load pdf.js from CDN
  const pdfjsLib = await loadPdfJs()

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item.str || '')
      .join(' ')
    text += pageText + '\n\n'
  }

  if (!text.trim()) {
    throw new Error('No extractable text found in this PDF. It may be scanned or image-only.')
  }

  return text.trim()
}

async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib

  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
  )

  return (window as any).pdfjsLib
}

// ─── DOCX: uses mammoth.js from CDN ─────────────────────────────────────────

async function extractDocxClientSide(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const mammoth = await loadMammoth()
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (!result.value?.trim()) {
    throw new Error('Could not extract text from this DOCX file.')
  }
  return result.value
}

async function loadMammoth(): Promise<any> {
  if ((window as any).mammoth) return (window as any).mammoth

  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
  )

  return (window as any).mammoth
}

// ─── PPTX: parse XML from ZIP client-side ───────────────────────────────────

async function extractPptxClientSide(file: File): Promise<string> {
  const JSZip = await loadJSZip()
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // PPTX slides are at ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide[0-9]+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[1] || '0')
      const nb = parseInt(b.match(/(\d+)/)?.[1] || '0')
      return na - nb
    })

  if (slideFiles.length === 0) {
    throw new Error('Could not find slides in this PPTX file.')
  }

  let text = ''
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('string')
    // Extract text from <a:t> tags (DrawingML text nodes)
    const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
    const slideText = matches
      .map((m: string) => m.replace(/<[^>]+>/g, ''))
      .join(' ')
    if (slideText.trim()) text += slideText + '\n\n'
  }

  if (!text.trim()) {
    throw new Error('No extractable text found in this PPTX file.')
  }

  return text.trim()
}

async function loadJSZip(): Promise<any> {
  if ((window as any).JSZip) return (window as any).JSZip

  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
  )

  return (window as any).JSZip
}

// ─── Utility: load a script from CDN ────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export function truncateText(text: string, maxChars = 40000): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n[Content truncated for processing]'
}