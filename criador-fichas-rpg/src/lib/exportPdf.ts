import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_X_MM = 10
const MARGIN_Y_MM = 8
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_X_MM * 2
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_Y_MM * 2
const CAPTURE_SCALE = 2
const IMAGE_QUALITY = 0.92

export type PdfExportResult = 'shared' | 'downloaded' | 'cancelled'

interface PageSlice {
  top: number
  height: number
}

interface PdfMetadata {
  title: string
  subject?: string
}

/**
 * Calcula os limites de cada folha. A ficha marca o fim de cada página com
 * `.print-page-break`; a folha seguinte começa no elemento imediatamente a
 * seguir, pelo que esse é o corte exato — sem cortar linhas de tabela.
 */
function getPageSlices(
  node: HTMLElement,
  canvasHeight: number,
  ratio: number,
): PageSlice[] {
  const nodeRect = node.getBoundingClientRect()
  const boundaries = [0]

  node.querySelectorAll<HTMLElement>('.print-page-break').forEach((marker) => {
    const next = marker.nextElementSibling as HTMLElement | null

    if (!next) {
      return
    }

    const nextRect = next.getBoundingClientRect()

    // Elementos da ficha inativa estão com display:none (rect vazio).
    if (nextRect.width === 0 && nextRect.height === 0) {
      return
    }

    const boundary = Math.round((nextRect.top - nodeRect.top) * ratio)

    if (boundary > 0 && boundary < canvasHeight) {
      boundaries.push(boundary)
    }
  })

  boundaries.push(canvasHeight)

  const uniqueBoundaries = Array.from(new Set(boundaries)).sort(
    (a, b) => a - b,
  )

  return uniqueBoundaries
    .slice(0, -1)
    .map((top, index) => ({
      top,
      height: uniqueBoundaries[index + 1] - top,
    }))
    .filter((slice) => slice.height > 0)
}

/** Recorta uma folha do canvas completo e devolve os dados em JPEG. */
function sliceToJpeg(
  canvas: HTMLCanvasElement,
  slice: PageSlice,
): string | null {
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = canvas.width
  pageCanvas.height = slice.height

  const context = pageCanvas.getContext('2d')

  if (!context) {
    return null
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
  context.drawImage(
    canvas,
    0,
    slice.top,
    canvas.width,
    slice.height,
    0,
    0,
    canvas.width,
    slice.height,
  )

  return pageCanvas.toDataURL('image/jpeg', IMAGE_QUALITY)
}

/** Captura o documento React e monta o PDF A4 (uma folha por página). */
async function renderPdf(node: HTMLElement, metadata: PdfMetadata) {
  await document.fonts.ready

  const canvas = await html2canvas(node, {
    scale: CAPTURE_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })

  const nodeRect = node.getBoundingClientRect()
  const ratio = nodeRect.height > 0 ? canvas.height / nodeRect.height : 1
  const slices = getPageSlices(node, canvas.height, ratio)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setProperties({
    title: metadata.title,
    subject: metadata.subject ?? metadata.title,
    creator: 'Protocolo Anômalo',
  })

  slices.forEach((slice, index) => {
    const image = sliceToJpeg(canvas, slice)

    if (!image) {
      return
    }

    if (index > 0) {
      doc.addPage()
    }

    const heightMm = CONTENT_WIDTH_MM * (slice.height / canvas.width)
    const fitsPage = heightMm <= CONTENT_HEIGHT_MM
    const renderWidth = fitsPage
      ? CONTENT_WIDTH_MM
      : CONTENT_WIDTH_MM * (CONTENT_HEIGHT_MM / heightMm)
    const renderHeight = fitsPage ? heightMm : CONTENT_HEIGHT_MM
    const offsetX = MARGIN_X_MM + (CONTENT_WIDTH_MM - renderWidth) / 2

    doc.addImage(
      image,
      'JPEG',
      offsetX,
      MARGIN_Y_MM,
      renderWidth,
      renderHeight,
      undefined,
      'FAST',
    )
  })

  return doc
}

const MOBILE_USER_AGENT = /Mobi|Android|iPhone|iPad|iPod/i

/**
 * Distingue telemóveis/tablets de desktops e laptops. A Web Share API com
 * ficheiros só faz sentido em mobile; em desktop o download direto é o
 * comportamento esperado.
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  return MOBILE_USER_AGENT.test(navigator.userAgent)
}

/**
 * Exporta a ficha diretamente para PDF. Apenas em dispositivos móveis abre o
 * menu de partilha nativo (Web Share API com ficheiros); em desktop/laptop
 * transfere o ficheiro. Em mobile, se a partilha falhar, recorre ao download.
 */
export async function exportSheetToPdf(
  node: HTMLElement,
  fileName: string,
  metadata: PdfMetadata,
): Promise<PdfExportResult> {
  const doc = await renderPdf(node, metadata)
  const pdfBlob = doc.output('blob')

  if (
    isMobileDevice() &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: metadata.title,
        })

        return 'shared'
      }
    } catch (error) {
      // O utilizador cancelou a partilha: não força o download.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }

      // Qualquer outra falha cai no download direto como fallback.
    }
  }

  doc.save(fileName)

  return 'downloaded'
}
