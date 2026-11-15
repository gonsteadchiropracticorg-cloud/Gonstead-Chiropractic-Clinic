import { NextRequest, NextResponse } from 'next/server'

interface PatientAssessmentInput {
  fullName?: string
  age?: number | string
  gender?: string
  phone?: string
  occupation?: string
  currentPain?: string
  painLocations?: string[]
  painDuration?: string
  symptoms?: string[]
  activityLevel?: string
  sittingHours?: string
  dailyActivities?: string[]
  workErgonomics?: string
  sleepQuality?: string
  stressLevel?: string
  sleepPosition?: string
  redFlags?: string[]
}

interface SubluxationFinding {
  segment: string
  region: string
  confidence: 'High' | 'Moderate' | 'Guarded'
  clinicalDetails: string
}

interface AssessmentAIResult {
  riskScore: number
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical'
  riskColor: string
  clinicalSummary: string
  suspectedSubluxations: SubluxationFinding[]
  biomechanicalDrivers: string[]
  gonsteadDiagnosticProtocol: string[]
  immediateActionPlan: string[]
  lifestyleAndErgonomics: string[]
  carePriority: {
    level: 'Routine' | 'Priority' | 'Urgent'
    timeline: string
    recommendation: string
  }
  generatedBy: 'groq-ai' | 'clinical-engine'
}

function calculateDeterministicAnalysis(input: PatientAssessmentInput): AssessmentAIResult {
  let score = 20
  const suspectedSubluxations: SubluxationFinding[] = []
  const biomechanicalDrivers: string[] = []
  const immediateActionPlan: string[] = []
  const lifestyleAndErgonomics: string[] = []
  const gonsteadDiagnosticProtocol: string[] = [
    'Dual-probe Nervoscope instrumentation to identify precise neuro-thermal inflammation deltas.',
    'Static palpation to detect localized intersegmental edema and taut paraspinal musculature.',
    'Motion palpation to assess facet joint fixation and restore normal vertebral disc mechanics.',
    'Full-spine weight-bearing spinographic digital radiography for pelvic listing and line-of-drive analysis.'
  ]

  // Pain severity
  const pain = (input.currentPain || '').toLowerCase()
  if (pain.includes('severe') || pain.includes('7') || pain.includes('8') || pain.includes('9') || pain.includes('10')) {
    score += 35
  } else if (pain.includes('moderate') || pain.includes('4') || pain.includes('5') || pain.includes('6')) {
    score += 22
  } else if (pain.includes('mild') || pain.includes('1') || pain.includes('2') || pain.includes('3')) {
    score += 10
  }

  // Duration
  const duration = (input.painDuration || '').toLowerCase()
  if (duration.includes('years')) {
    score += 20
    biomechanicalDrivers.push('Longstanding chronic biomechanical compensation patterns and ligamentous remodeling.')
  } else if (duration.includes('chronic') || duration.includes('6 months')) {
    score += 15
    biomechanicalDrivers.push('Subacute to chronic spinal subluxation with persistent paraspinal muscle splinting.')
  } else if (duration.includes('medium')) {
    score += 10
  }

  // Locations
  const locs = input.painLocations || []
  if (locs.includes('lowerBack') || locs.includes('hips') || locs.includes('legs')) {
    score += 12
    suspectedSubluxations.push({
      segment: 'L5-S1 Lumbosacral & Sacroiliac Joint',
      region: 'Lumbar & Pelvic Spine',
      confidence: 'High',
      clinicalDetails: 'Presentation suggests posterior disc wedge deformation at L5 with sciatic radicular tension or pelvic subluxation (PI/AS ilium).'
    })
    immediateActionPlan.push('Apply ice therapy (15-20 mins) over the lower lumbar and sacral area to reduce nerve root irritation; avoid heating acute inflammation.')
    lifestyleAndErgonomics.push('Utilize a firm lumbar support cushion and avoid crossing legs to prevent asymmetric pelvic twisting.')
  }

  if (locs.includes('neck') || locs.includes('upperBack') || locs.includes('arms')) {
    score += 10
    suspectedSubluxations.push({
      segment: 'C5-C6 Cervical Motor Units',
      region: 'Cervical Spine',
      confidence: 'High',
      clinicalDetails: 'Cervical spinal nerve root involvement with associated trapezius spasm, forward head posture load, and potential brachial plexus radiculopathy.'
    })
    immediateActionPlan.push('Perform gentle cervical retraction (chin tucks) without tilting head backwards; avoid prolonged smartphone downward tilt.')
    lifestyleAndErgonomics.push('Raise computer monitor so the top third of the display is at exact eye level to eliminate cervical extension stress.')
  }

  if (locs.includes('headaches')) {
    score += 8
    suspectedSubluxations.push({
      segment: 'C1 Atlas / C2 Axis (Upper Cervical Complex)',
      region: 'Upper Cervical Spine',
      confidence: 'High',
      clinicalDetails: 'Upper cervical subluxation complex triggering occipital nerve irritation and cervicogenic tension headaches.'
    })
    immediateActionPlan.push('Rest in a neutral supine position with cervical contour roll supporting the natural lordotic curve.')
  }

  if (locs.includes('midBack')) {
    score += 6
    suspectedSubluxations.push({
      segment: 'T6-T8 Mid-Thoracic Vertebrae',
      region: 'Thoracic Spine',
      confidence: 'Moderate',
      clinicalDetails: 'Thoracic kyphotic stress with intercostal tension and restricted rotational mobility.'
    })
  }

  // Lifestyle factors
  if (input.sittingHours === 'excessive' || (input.occupation || '').toLowerCase().includes('desk') || (input.occupation || '').toLowerCase().includes('driver')) {
    score += 10
    biomechanicalDrivers.push('Prolonged seated axial loading causing posterior disc migration and hamstrings tightness.')
    lifestyleAndErgonomics.push('Adopt the 30/2 micro-break rule: stand and perform gentle pelvic tilts for 2 minutes every 30 minutes of sitting.')
  }

  if (input.sleepQuality === 'poor' || input.sleepQuality === 'terrible') {
    score += 8
    biomechanicalDrivers.push('Impaired nocturnal spinal disc imbibition and lack of deep restorative tissue regeneration.')
    lifestyleAndErgonomics.push('Sleep either on your side with a supportive contour pillow and knee pillow, or supine with a small bolster under knees.')
  }

  if (input.stressLevel === 'high' || input.stressLevel === 'extreme') {
    score += 8
    biomechanicalDrivers.push('Sympathetic nervous system hyper-activation causing elevated paraspinal resting muscle tone.')
  }

  // Clamp score
  const finalScore = Math.min(96, Math.max(15, score))

  let level: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate'
  let color = 'risk-moderate'
  let carePriorityLevel: 'Routine' | 'Priority' | 'Urgent' = 'Priority'
  let timeline = 'Within 3-5 days'
  let priorityAction = 'Schedule a comprehensive in-person Gonstead clinical examination to isolate primary subluxations.'

  if (finalScore <= 35) {
    level = 'Low'
    color = 'risk-low'
    carePriorityLevel = 'Routine'
    timeline = 'Within 1-2 weeks'
    priorityAction = 'Elective wellness check and preventative posture alignment.'
  } else if (finalScore >= 70) {
    level = 'High'
    color = 'risk-high'
    carePriorityLevel = 'Urgent'
    timeline = 'Within 24-48 hours'
    priorityAction = 'Urgent clinical evaluation recommended to relieve neural impingement and prevent structural disc progression.'
  }

  if (suspectedSubluxations.length === 0) {
    suspectedSubluxations.push({
      segment: 'General Spinal Kinetic Chain',
      region: 'Full Spine',
      confidence: 'Moderate',
      clinicalDetails: 'Mild functional asymmetry with postural fatigue and muscle imbalance.'
    })
  }

  immediateActionPlan.push('Avoid rapid torsional (twisting) motions, especially combined with forward bending.')
  immediateActionPlan.push('Drink plenty of water to maintain spinal disc hydration and intervertebral height.')

  return {
    riskScore: finalScore,
    riskLevel: level,
    riskColor: color,
    clinicalSummary: `Based on your reported symptoms and daily biomechanical stressors, our Gonstead clinical assessment indicates a ${level.toLowerCase()} probability of spinal subluxation complexes affecting your spinal mobility and nerve communication. An in-person Gonstead examination is recommended to pinpoint the primary level of involvement.`,
    suspectedSubluxations,
    biomechanicalDrivers,
    gonsteadDiagnosticProtocol,
    immediateActionPlan,
    lifestyleAndErgonomics,
    carePriority: {
      level: carePriorityLevel,
      timeline,
      recommendation: priorityAction
    },
    generatedBy: 'clinical-engine'
  }
}

export async function POST(req: NextRequest) {
  try {
    const input: PatientAssessmentInput = await req.json()

    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || ''

    if (!apiKey) {
      console.warn('Groq API key not set, using clinical fallback engine')
      const fallback = calculateDeterministicAnalysis(input)
      return NextResponse.json(fallback)
    }

    const prompt = `You are the Lead Gonstead Chiropractic Biomechanical Specialist at Dr. Bashir Khan's Gonstead Chiropractic Clinic in Nowshera, Pakistan.
Analyze this patient's spinal health assessment thoroughly:

Patient Profile:
- Name: ${input.fullName || 'Anonymous Patient'}
- Age: ${input.age || 'Unknown'}, Gender: ${input.gender || 'Unknown'}
- Occupation: ${input.occupation || 'Not specified'}
- Current Pain Level: ${input.currentPain || 'None'}
- Pain Locations: ${(input.painLocations || []).join(', ') || 'None selected'}
- Pain Duration: ${input.painDuration || 'Recent'}
- Other Symptoms: ${(input.symptoms || []).join(', ') || 'None'}
- Physical Activity Level: ${input.activityLevel || 'Not specified'}
- Daily Sitting Time: ${input.sittingHours || 'Not specified'}
- Daily Activities: ${(input.dailyActivities || []).join(', ') || 'None'}
- Workplace Ergonomics: ${input.workErgonomics || 'Average'}
- Sleep Quality: ${input.sleepQuality || 'Average'}, Stress Level: ${input.stressLevel || 'Moderate'}

Gonstead Chiropractic Principles to Apply:
1. Differentiate compensation vs primary subluxations.
2. Consider the Gonstead 5-step analysis: Nervoscope instrumentation, static palpation (edema), motion palpation (fixation), visualization, and full-spine X-ray line of drive.
3. Identify specific vertebral motor units likely affected (e.g. L5, C2, C5, Sacroiliac PI/AS, Thoracic T6).
4. Provide actionable, safe clinical advice (ice over heat for acute inflammation, spinal hygiene, ergonomic corrections).

CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not wrap in markdown code fences, do not include any preamble or extra text.
The JSON must follow this exact schema:
{
  "riskScore": <number between 10 and 98>,
  "riskLevel": <"Low" | "Moderate" | "High" | "Critical">,
  "clinicalSummary": <string, 2-3 sentences explaining biomechanical state and findings>,
  "suspectedSubluxations": [
    {
      "segment": <string, e.g. "L5-S1 (Lumbosacral Disc & Facets)">,
      "region": <string, e.g. "Lumbar Spine">,
      "confidence": <"High" | "Moderate">,
      "clinicalDetails": <string, specific biomechanical and nerve impingement details>
    }
  ],
  "biomechanicalDrivers": [
    <string, 2 to 4 root ergonomic or postural causes>
  ],
  "gonsteadDiagnosticProtocol": [
    <string, 3 to 4 specific Gonstead diagnostic steps to perform in clinic>
  ],
  "immediateActionPlan": [
    <string, 3 to 4 immediate pain-relief and stabilization steps>
  ],
  "lifestyleAndErgonomics": [
    <string, 3 to 4 actionable posture and lifestyle corrections>
  ],
  "carePriority": {
    "level": <"Routine" | "Priority" | "Urgent">,
    "timeline": <string, e.g. "Within 24-48 hours" or "Within 1 week">,
    "recommendation": <string, clinical next step>
  }
}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Gonstead Chiropractic spine specialist who outputs ONLY concise, valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (groqRes.ok) {
        const groqData = await groqRes.json()
        const rawContent = groqData.choices?.[0]?.message?.content || ''
        
        // Clean any possible formatting artifacts
        const cleaned = rawContent
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim()

        const parsed = JSON.parse(cleaned)
        
        let riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate'
        const rawLevel = String(parsed.riskLevel || '').toLowerCase()
        if (rawLevel.includes('crit')) riskLevel = 'Critical'
        else if (rawLevel.includes('high')) riskLevel = 'High'
        else if (rawLevel.includes('low')) riskLevel = 'Low'
        else riskLevel = 'Moderate'

        const riskColor = riskLevel === 'Low' ? 'risk-low' : (riskLevel === 'High' || riskLevel === 'Critical') ? 'risk-high' : 'risk-moderate'

        // Normalize carePriority
        let carePriority = {
          level: (riskLevel === 'High' || riskLevel === 'Critical') ? 'Urgent' : riskLevel === 'Low' ? 'Routine' : 'Priority',
          timeline: (riskLevel === 'High' || riskLevel === 'Critical') ? 'Within 24-48 hours' : riskLevel === 'Low' ? 'Within 1-2 weeks' : 'Within 3-5 days',
          recommendation: 'Schedule a Gonstead in-person evaluation to isolate primary subluxations and restore spinal mobility.'
        }

        if (typeof parsed.carePriority === 'object' && parsed.carePriority !== null) {
          carePriority = {
            level: parsed.carePriority.level || carePriority.level,
            timeline: parsed.carePriority.timeline || carePriority.timeline,
            recommendation: parsed.carePriority.recommendation || carePriority.recommendation
          }
        } else if (typeof parsed.carePriority === 'string') {
          const cpStr = parsed.carePriority.toLowerCase()
          if (cpStr.includes('urg') || cpStr.includes('emerg') || cpStr.includes('high')) {
            carePriority.level = 'Urgent'
            carePriority.timeline = 'Within 24-48 hours'
          } else if (cpStr.includes('low') || cpStr.includes('rout')) {
            carePriority.level = 'Routine'
            carePriority.timeline = 'Within 1-2 weeks'
          }
        }

        return NextResponse.json({
          riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 55,
          riskLevel,
          riskColor,
          clinicalSummary: parsed.clinicalSummary || 'Clinical assessment completed.',
          suspectedSubluxations: Array.isArray(parsed.suspectedSubluxations) ? parsed.suspectedSubluxations : [],
          biomechanicalDrivers: Array.isArray(parsed.biomechanicalDrivers) ? parsed.biomechanicalDrivers : [],
          gonsteadDiagnosticProtocol: Array.isArray(parsed.gonsteadDiagnosticProtocol) ? parsed.gonsteadDiagnosticProtocol : [],
          immediateActionPlan: Array.isArray(parsed.immediateActionPlan) ? parsed.immediateActionPlan : [],
          lifestyleAndErgonomics: Array.isArray(parsed.lifestyleAndErgonomics) ? parsed.lifestyleAndErgonomics : [],
          carePriority,
          generatedBy: 'groq-ai'
        })
      } else {
        console.warn('Groq API returned non-OK status:', groqRes.status)
      }
    } catch (groqErr) {
      console.warn('Groq API call error or timeout, falling back:', groqErr)
    }

    // Fallback if Groq call failed or timed out
    const fallback = calculateDeterministicAnalysis(input)
    return NextResponse.json(fallback)

  } catch (err: any) {
    console.error('Assessment analysis route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
