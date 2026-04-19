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
      return JSON.stringify(json, null, 2)
    } catch {
      return text
    }
  }

  if (ext === 'pdf') {
    return await extractPDF(file)
  }

  if (ext === 'pptx' || ext === 'docx') {
    return await extractOffice(file)
  }

  // Fallback: try reading as text
  return await file.text()
}

async function extractPDF(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/extract-text', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const raw = await res.text()
    let message = raw
    try {
      const json = JSON.parse(raw)
      message = json.error || raw
    } catch {
      message = raw
    }
    throw new Error(`Failed to extract PDF text: ${message}`)
  }

  const data = await res.json()
  return data.text
}

async function extractOffice(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/extract-text', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const raw = await res.text()
    let message = raw
    try {
      const json = JSON.parse(raw)
      message = json.error || raw
    } catch {
      message = raw
    }
    throw new Error(`Failed to extract file text: ${message}`)
  }

  const data = await res.json()
  return data.text
}

export function truncateText(text: string, maxChars = 40000): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n[Content truncated for processing]'
}
