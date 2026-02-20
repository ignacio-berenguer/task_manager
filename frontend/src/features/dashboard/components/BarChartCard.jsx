import { useRef, useState, useCallback, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Download } from 'lucide-react'
import { formatNumber, formatImporte } from '@/lib/utils'

const TICK_FONT_SIZE = 11
const MAX_LABEL_CHARS = 30
const MIN_YAXIS_WIDTH = 80
const MAX_YAXIS_WIDTH = 260
const YAXIS_PADDING = 12

/** Shared offscreen canvas for measuring text width. */
let _measureCtx = null
function getTextWidth(text, fontSize = TICK_FONT_SIZE) {
  if (!_measureCtx) {
    const canvas = document.createElement('canvas')
    _measureCtx = canvas.getContext('2d')
  }
  _measureCtx.font = `${fontSize}px sans-serif`
  return _measureCtx.measureText(text).width
}

/**
 * Custom Y-axis tick with native SVG tooltip for truncated labels
 */
function CustomYAxisTick({ x, y, payload, maxLen }) {
  const value = payload?.value ?? ''
  const truncated = value.length > maxLen
  const displayText = truncated ? `${value.slice(0, maxLen)}…` : value

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="currentColor"
        fontSize={TICK_FONT_SIZE}
      >
        {truncated && <title>{value}</title>}
        {displayText}
      </text>
    </g>
  )
}

/**
 * Custom X-axis tick with native SVG tooltip for truncated labels (vertical layout)
 */
function CustomXAxisTick({ x, y, payload }) {
  const value = payload?.value ?? ''
  const maxLen = 10
  const truncated = value.length > maxLen
  const displayText = truncated ? `${value.slice(0, maxLen)}...` : value

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="currentColor"
        fontSize={11}
      >
        {truncated && <title>{value}</title>}
        {displayText}
      </text>
    </g>
  )
}

/**
 * Custom chart tooltip showing value and percentage of total
 */
function ChartTooltip({ active, payload, label, valueFormatter, isImporte, total }) {
  if (!active || !payload || payload.length === 0) return null

  const value = payload[0].value
  const formattedValue = valueFormatter(value)

  let percentageText = ''
  if (total > 0) {
    const pct = (value / total) * 100
    const formatted = pct >= 99.95 ? '100' : pct.toFixed(1)
    percentageText = ` (${formatted}% del total)`
  }

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '0.5rem',
        color: 'hsl(var(--card-foreground))',
        padding: '8px 12px',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p>
        <span style={{ color: 'hsl(var(--card-foreground))' }}>
          {isImporte ? 'Importe' : 'Cantidad'}: {formattedValue}
        </span>
        {percentageText && (
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>
            {percentageText}
          </span>
        )}
      </p>
    </div>
  )
}

/**
 * Export a DOM element as a PNG image
 */
async function exportAsPng(element, filename) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(element, { scale: 2, useCORS: true })
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/**
 * Horizontal bar chart component with optional double-click navigation
 */
export function BarChartCard({
  data,
  isLoading,
  title,
  dataKey = 'value',
  color = 'hsl(221.2, 83.2%, 53.3%)',
  horizontal = true,
  formatValue,
  isImporte = false,
  maxItems = 8,
  yAxisWidth = 160,
  field,
  onBarDoubleClick,
  total,
}) {
  const cardRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  // Double-click detection via timer
  const lastClickRef = useRef({ name: null, time: 0 })

  const handleBarClick = useCallback((barData) => {
    if (!onBarDoubleClick || !field) return

    const now = Date.now()
    const last = lastClickRef.current

    if (last.name === barData.name && now - last.time < 300) {
      // Double-click detected
      lastClickRef.current = { name: null, time: 0 }
      onBarDoubleClick({ name: barData.name, value: barData.value, field })
    } else {
      lastClickRef.current = { name: barData.name, time: now }
    }
  }, [onBarDoubleClick, field])

  const handleExport = useCallback(async () => {
    if (!cardRef.current || exporting) return
    setExporting(true)
    try {
      const filename = `${title.replace(/\s+/g, '_')}.png`
      await exportAsPng(cardRef.current, filename)
    } finally {
      setExporting(false)
    }
  }, [title, exporting])

  // Determine formatter based on isImporte prop or custom formatValue
  const valueFormatter = formatValue
    ? (value) => formatValue(value)
    : isImporte
      ? (value) => formatImporte(value)
      : (value) => formatNumber(value)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-heading font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-heading font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Take top N items for cleaner display
  const chartData = data.slice(0, maxItems)

  // Dynamically compute YAxis width based on the longest label in the data
  const computedYAxisWidth = useMemo(() => {
    if (!horizontal || !chartData || chartData.length === 0) return yAxisWidth
    let maxWidth = 0
    for (const item of chartData) {
      const label = item.name || ''
      const display = label.length > MAX_LABEL_CHARS
        ? label.slice(0, MAX_LABEL_CHARS) + '…'
        : label
      const w = getTextWidth(display)
      if (w > maxWidth) maxWidth = w
    }
    return Math.max(MIN_YAXIS_WIDTH, Math.min(Math.ceil(maxWidth) + YAXIS_PADDING, MAX_YAXIS_WIDTH))
  }, [chartData, horizontal, yAxisWidth])

  return (
    <Card ref={cardRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading font-semibold">{title}</CardTitle>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Exportar como PNG"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout={horizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              {horizontal ? (
                <>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={valueFormatter}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={computedYAxisWidth}
                    interval={0}
                    tick={<CustomYAxisTick maxLen={MAX_LABEL_CHARS} />}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={<CustomXAxisTick />}
                  />
                  <YAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={valueFormatter}
                  />
                </>
              )}
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={valueFormatter}
                    isImporte={isImporte}
                    total={total}
                  />
                }
              />
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[4, 4, 4, 4]}
                onClick={onBarDoubleClick ? handleBarClick : undefined}
                cursor={onBarDoubleClick ? 'pointer' : undefined}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
