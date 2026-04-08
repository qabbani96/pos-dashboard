/**
 * Exports an array of row objects to a Microsoft Excel (.xls) file using
 * SpreadsheetML — no external dependencies required.
 *
 * Excel (2003+), LibreOffice, and Google Sheets all open this format natively.
 *
 * @param rows      Array of plain objects — keys become column headers.
 * @param filename  Downloaded file name WITHOUT extension.
 * @param sheetName Optional worksheet tab name (default: "Report").
 */
export function exportToExcel(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = 'Report',
) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])

  const esc = (v: string) =>
    v.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')

  const cell = (value: unknown) => {
    const raw = value == null ? '' : String(value)
    // Use Number type for numeric cells so Excel can sum / sort them
    const num = Number(raw)
    if (raw !== '' && !Number.isNaN(num)) {
      return `<Cell><Data ss:Type="Number">${num}</Data></Cell>`
    }
    return `<Cell><Data ss:Type="String">${esc(raw)}</Data></Cell>`
  }

  const headerRow = `<Row>${
    headers.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')
  }</Row>`

  const dataRows = rows.map(
    row => `<Row>${headers.map(h => cell(row[h])).join('')}</Row>`,
  ).join('\n      ')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${esc(sheetName)}">
    <Table>
      ${headerRow}
      ${dataRows}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Returns "YYYY-MM-DD" for the current local date */
export function today(): string {
  return new Date().toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD
}

/** Returns "YYYY-MM-DD" for N days ago */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toLocaleDateString('en-CA')
}
