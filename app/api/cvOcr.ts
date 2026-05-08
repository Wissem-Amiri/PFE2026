export async function extractCVData(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const res = await fetch('http://localhost:5000/api/resume/parse', {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('OCR API Error:', res.status, errorText)
      return null
    }
    
    const data = await res.json()
    console.log('Parsed CV Data:', data)
    return data
  } catch (error) {
    console.error('Error connecting to OCR API:', error)
    return null
  }
}

