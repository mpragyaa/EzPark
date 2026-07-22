/**
 * Converts arrays of JavaScript objects into CSV files and triggers downloads.
 * @param {Array<Object>} data - Raw rows list to print.
 * @param {string} filenamePrefix - Prefix for download file.
 */
export function exportToCSV(data, filenamePrefix = 'export') {
  if (!data || data.length === 0) {
    alert('No records available for compilation.');
    return;
  }

  // 1. Extract headers dynamically
  const headers = Object.keys(data[0]);
  
  // 2. Build rows
  const csvRows = [];
  
  // Add headers row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Sanitize string cells to avoid breaking on commas or newlines
      const stringified = val === null || val === undefined ? '' : String(val);
      const escaped = stringified.replace(/"/g, '""');
      
      // Wrap cell in double quotes if it contains commas or quotes
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    });
    csvRows.push(values.join(','));
  }

  // 3. Compile lines into a Blob
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 4. Trigger download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
