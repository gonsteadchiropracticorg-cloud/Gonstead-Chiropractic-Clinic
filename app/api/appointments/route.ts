import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json()

    // Generate appointment ID
    const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // In a real application, you would save this to a database
    // For now, we'll just return success with the appointment ID

    console.log("New appointment booked:", {
      id: appointmentId,
      ...appointmentData,
      timestamp: new Date().toISOString(),
    })

    // Log notification instead of sending SMS
    console.log(`Appointment notification - Patient: ${appointmentData.name}, Phone: ${appointmentData.phone}`)

    return NextResponse.json({
      success: true,
      id: appointmentId,
      message: "Appointment booked successfully",
    })
  } catch (error) {
    console.error("Appointment booking error:", error)
    return NextResponse.json({ success: false, error: "Failed to book appointment" }, { status: 500 })
  }
}

export async function GET() {
  // Return appointments from localStorage or database
  // This would typically fetch from a database
  return NextResponse.json({
    success: true,
    appointments: [],
  })
}
