/**
 * Generic function to export an array of objects to CSV format
 */
export function exportToCSV(data: any[], headers: string[], filename: string) {
  if (!data || !data.length) return

  // Create the header row
  const csvContent = [
    headers.join(','),
    ...data.map(row => {
      // Map row data to header order
      const values = headers.map(header => {
        const val = row[header] || ''
        // Escape quotes and wrap in quotes to handle commas within values
        return `"${String(val).replace(/"/g, '""')}"`
      })
      return values.join(',')
    })
  ].join('\n')

  downloadCSV(csvContent, filename)
}

/**
 * Triggers a download of a CSV string in the browser
 */
export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
