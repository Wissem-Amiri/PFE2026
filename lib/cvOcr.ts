export async function extractCVData(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    // Assuming the endpoint is /extract or /upload. Adjust if necessary.
    const res = await fetch('https://cv-ocr-2k25.onrender.com/extract', {
      method: 'POST',
      body: formData,
    })
    
    if (!res.ok) {
      console.error('OCR API Error:', res.statusText)
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('Error connecting to OCR API:', error)
    return null
  }
}
