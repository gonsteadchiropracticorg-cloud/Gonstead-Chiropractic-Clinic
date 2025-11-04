"use client"

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeGeneratorProps {
  data: string
  size?: number
  logo?: string
  className?: string
}

export function QRCodeGenerator({ 
  data, 
  size = 200, 
  logo,
  className = '' 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generateQRCode()
  }, [data, size, logo])

  const generateQRCode = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      // Generate QR code
      await QRCode.toCanvas(canvas, data, {
        width: size,
        margin: 1,
        color: {
          dark: '#245064',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      })

      // Add logo in center if provided
      if (logo) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = new Image()
        img.onload = () => {
          const logoSize = size * 0.2
          const x = (size - logoSize) / 2
          const y = (size - logoSize) / 2

          // Draw white background for logo
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10)

          // Draw logo
          ctx.drawImage(img, x, y, logoSize, logoSize)
        }
        img.src = logo
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg shadow-md" />
      <p className="text-xs text-gray-500 text-center max-w-[200px]">
        Scan to view digital prescription
      </p>
    </div>
  )
}

