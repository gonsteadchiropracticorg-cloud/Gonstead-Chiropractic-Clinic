# Visual Prescription Components - Installation Script
# Gonstead Chiropractic Clinic

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Visual Prescription Components Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing required dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install production dependencies
Write-Host "Installing qrcode..." -ForegroundColor Cyan
npm install qrcode
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ qrcode installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install qrcode" -ForegroundColor Red
}

Write-Host ""

# Install dev dependencies
Write-Host "Installing TypeScript types..." -ForegroundColor Cyan
npm install --save-dev @types/qrcode
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ @types/qrcode installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install @types/qrcode" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Installation Complete!                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New Components Available:" -ForegroundColor Green
Write-Host "  ✓ SignaturePad         - Signature capture" -ForegroundColor White
Write-Host "  ✓ QRCodeGenerator      - QR code generation" -ForegroundColor White
Write-Host "  ✓ PreviewModal         - Prescription preview" -ForegroundColor White
Write-Host "  ✓ SessionProgress      - Progress tracking" -ForegroundColor White
Write-Host "  ✓ AnatomySelector      - Spine diagram" -ForegroundColor White
Write-Host "  ✓ LogoUpload           - Logo management" -ForegroundColor White
Write-Host "  ✓ TemplateGallery      - Template selection" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  • components/prescription/README.md" -ForegroundColor White
Write-Host "  • VISUAL_PRESCRIPTION_IMPLEMENTATION.md" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review documentation in components/prescription/README.md" -ForegroundColor White
Write-Host "  2. Import components: import { SignaturePad } from '@/components/prescription'" -ForegroundColor White
Write-Host "  3. Test in development environment" -ForegroundColor White
Write-Host "  4. Deploy to production" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host ""

