export type FAQCategory = 'treatment' | 'conditions' | 'clinic' | 'booking';

export interface FAQDetailSection {
  title: string;
  titleUr?: string;
  items: string[];
  itemsUr?: string[];
}

export interface FAQItem {
  id: string;
  label: string;
  labelUr?: string;
  category: FAQCategory;
  categoryName?: string;
  answer: string;
  answerUr?: string;
  sections?: FAQDetailSection[];
  tags?: string[];
  isPopular?: boolean;
}

export const FAQ_CATEGORIES: { id: 'all' | FAQCategory; label: string; labelUr: string; icon: string }[] = [
  { id: 'all', label: 'All Questions', labelUr: 'تمام سوالات', icon: 'HelpCircle' },
  { id: 'treatment', label: 'Gonstead & Treatment', labelUr: 'گونسٹیڈ اور طریقہ علاج', icon: 'Stethoscope' },
  { id: 'conditions', label: 'Conditions & Spine', labelUr: 'ریڑھ کی ہڈی و مسائل', icon: 'Activity' },
  { id: 'clinic', label: 'Clinic & Hours', labelUr: 'کلینک اور سہولیات', icon: 'MapPin' },
  { id: 'booking', label: 'Appointments & Fees', labelUr: 'بکنگ اور فیس', icon: 'Calendar' },
];

export const FAQ_ITEMS: FAQItem[] = [
  // --- GONSTEAD & TREATMENT ---
  {
    id: 'gonstead-technique',
    label: 'What is the Gonstead Technique?',
    labelUr: 'گونسٹیڈ تکنیک کیا ہے اور یہ کیسی منفرد ہے؟',
    category: 'treatment',
    categoryName: 'Gonstead Technique',
    answer: 'The Gonstead Technique is widely considered the gold standard in precise chiropractic analysis and spinal correction. Unlike generalized popping or manual twisting, Gonstead practitioners utilize a strict five-criteria assessment—including visualization, instrumentation (Nervoscope), static palpation, motion palpation, and specialized X-ray biomechanical study—to identify the exact vertebral segment causing nerve interference. Adjustments are delivered with biomechanical precision to restore optimal joint motion and relieve nerve irritation without unnecessary manipulation.',
    answerUr: 'گونسٹیڈ کائروپریکٹک ایک نہایت سائنسی اور منظم طریقہ علاج ہے جو ڈاکٹر کلیرنس گونسٹیڈ نے ایجاد کیا۔ یہ عام مروجہ طریقوں کے برعکس پانچ بنیادی مراحل (بصری معائنہ، نرو سکوپ انسٹرومنٹیشن، لمس، حرکی جانچ، اور ایکس رے تجزیہ) پر انحصار کرتا ہے۔ اس سے متاثرہ مہرے کی درست نشاندہی ہوتی ہے اور صرف اسی جوڑ پر مخصوص ایڈجسٹمنٹ کی جاتی ہے۔',
    isPopular: true,
    tags: ['gonstead', 'precision', 'spinal-analysis', 'nervoscope'],
    sections: [
      {
        title: 'The Five-Step Analysis Protocol',
        titleUr: 'پانچ مرحلہ وار تشخیصی نظام',
        items: [
          '1. Visualization: Thorough observation of posture, gait, and structural asymmetries.',
          '2. Instrumentation (Nervoscope): High-sensitivity dual-probe thermography detecting localized skin temperature differences caused by nerve inflammation.',
          '3. Static Palpation: Tactile examination for localized edema, tissue swelling, and muscular hypertonicity.',
          '4. Motion Palpation: Testing joint play and segmental range of motion to locate biomechanical fixations.',
          '5. Full-Spine X-ray Analysis: Precision radiographic evaluation of spinal disc lines, subluxations, and structural integrity before any adjustment.'
        ],
        itemsUr: [
          '1. بصری جانچ: پوسچر، چلنے کے انداز اور ہڈیوں کی ساخت کا معائنہ۔',
          '2. آلات کا استعمال: نرو سکوپ کے ذریعے سوزش اور درجہ حرارت کا درست پتہ لگانا۔',
          '3. لمسی جانچ: بافتوں کی سختی، سوجن اور پٹھوں کا کھچاؤ محسوس کرنا۔',
          '4. حرکتی جانچ: ہر مہرے کی حرکت اور لچک کا ٹیسٹ۔',
          '5. ایکس رے تجزیہ: ڈسک کی حالت اور مہروں کی ترتیب کا سائنسی جائزہ۔'
        ]
      },
      {
        title: 'Key Advantages of Gonstead Care',
        titleUr: 'گونسٹیڈ طریقہ علاج کے اہم فوائد',
        items: [
          'Pinpoint accuracy: No generalized twisting or rotational stress placed on healthy spinal joints.',
          'Faster recovery: Targeting only the problem segment minimizes required treatment sessions.',
          'Safety-first approach: Biomechanical evaluation ensures no contraindications exist.',
          'Long-term correction: Focuses on disc restoration and postural rebalancing rather than temporary masking of symptoms.'
        ],
        itemsUr: [
          'غیر متاثرہ جوڑوں کو غیر ضروری دباؤ سے محفوظ رکھا جاتا ہے۔',
          'کم سیشنز میں دیرپا اور مستقل شفا ملتی ہے۔',
          'انتہائی محفوظ اور مستند طریقہ علاج ہے۔',
          'علامات دبانے کے بجائے اصل جڑ پر کام کیا جاتا ہے۔'
        ]
      }
    ]
  },
  {
    id: 'first-visit-process',
    label: 'What happens during my first consultation visit?',
    labelUr: 'پہلی وزٹ کے دوران کیا ہوتا ہے؟',
    category: 'treatment',
    categoryName: 'Patient Experience',
    answer: 'Your initial consultation typically lasts 45 to 60 minutes. Dr. Bashir Khan conducts a comprehensive review of your medical history, followed by an orthopaedic and neurological evaluation, Gonstead spinal analysis, and review of any imaging (X-rays or MRI). If clinically indicated and safe, your first targeted adjustment and personalized recovery plan will begin during this visit.',
    answerUr: 'پہلی وزٹ تقریباً 45 سے 60 منٹ پر مشتمل ہوتی ہے۔ اس میں مریض کی تفصیلی میڈیکل ہسٹری، آرتھوپیڈک اور نیورولوجیکل معائنہ، اور پرانی رپورٹس کا جائزہ لیا جاتا ہے تاکہ محفوظ ترین پلان بنایا جا سکے۔',
    isPopular: true,
    tags: ['first-visit', 'consultation', 'what-to-expect'],
    sections: [
      {
        title: 'Step-by-Step Consultation Flow',
        titleUr: 'پہلی ملاقات کا مرحلہ وار طریقہ',
        items: [
          'Medical intake and symptom mapping',
          'Functional range of motion and neurological reflex tests',
          'Nervoscope spinal temperature scan and palpation',
          'Discussion of findings and informed treatment consent',
          'Initial adjustment (if clinically cleared) and personalized home instructions'
        ]
      }
    ]
  },
  {
    id: 'do-adjustments-hurt',
    label: 'Do chiropractic adjustments hurt? What does it feel like?',
    labelUr: 'کیا ایڈجسٹمنٹ میں درد ہوتا ہے؟',
    category: 'treatment',
    categoryName: 'Comfort & Safety',
    answer: 'In the vast majority of cases, Gonstead adjustments are comfortable and provide immediate sensation of relief and lightness. The characteristic "pop" or release sound is simply nitrogen gas releasing from the synovial joint capsule as motion is restored. A small percentage of patients may experience mild post-treatment soreness (similar to starting a gym routine), which resolves within 24 to 48 hours.',
    answerUr: 'زیادہ تر مریضوں کو فوری ریلیف اور ہلکا پن محسوس ہوتا ہے۔ ایڈجسٹمنٹ کے وقت آواز صرف جوڑوں کے درمیان موجود گیس کے خارج ہونے کی ہوتی ہے جو دردناک نہیں ہوتی۔ بعض اوقات ہلکی سی سستی یا تھکاوٹ ہو سکتی ہے جو 24 سے 48 گھنٹوں میں ختم ہو جاتی ہے۔',
    isPopular: true,
    tags: ['pain', 'safety', 'adjustment-sound', 'comfort']
  },
  {
    id: 'how-many-sessions',
    label: 'How many sessions will I need to get well?',
    labelUr: 'مجھے کتنے سیشنز درکار ہوں گے؟',
    category: 'treatment',
    categoryName: 'Treatment Duration',
    answer: 'Treatment frequency depends on chronicity, age, spinal disc health, and lifestyle factors. Many acute pain patients notice marked improvement within 1 to 3 sessions. Chronic conditions (such as long-standing disc herniation or scoliosis) require a structured rehabilitative care plan with follow-up intervals tapered as spinal stability improves.',
    answerUr: 'سیشنز کی تعداد مریض کی تکلیف کی شدت اور پرانے پن پر منحصر ہوتی ہے۔ اکثر مریض 1 سے 3 سیشنز میں واضح بہتری محسوس کرتے ہیں، جبکہ پرانے مسائل کے لیے مرحلہ وار علاج تجویز کیا جاتا ہے۔',
    isPopular: true,
    tags: ['sessions', 'timeline', 'recovery', 'care-plan']
  },
  {
    id: 'equipment-and-technology',
    label: 'What specialized equipment and tables are used at the clinic?',
    labelUr: 'کلینک میں کون سے خصوصی آلات اور ٹیبلز استعمال ہوتے ہیں؟',
    category: 'treatment',
    categoryName: 'Clinic Technology',
    answer: 'Our clinic is outfitted with authentic Gonstead-designed equipment including the Cervical Chair, Knee-Chest Table, Pelvic Bench, Nervoscope thermal instrumentation, and the Adjustive Arthrostim machine. These specialized devices ensure optimal patient positioning, biomechanical advantage, and maximum patient comfort during corrections.',
    answerUr: 'کلینک میں اصلی گونسٹیڈ سرویکل چیئر، نی-چیسٹ ٹیبل، پیلوک بینچ، نرو سکوپ، اور جدید آرتھروسٹم مشین موجود ہیں جو علاج کو انتہائی محفوظ بناتی ہیں۔',
    tags: ['equipment', 'nervoscope', 'arthrostim', 'tables']
  },
  {
    id: 'safety-and-elderly',
    label: 'Is chiropractic treatment safe for children, seniors, and during pregnancy?',
    labelUr: 'کیا یہ بچوں، بزرگوں اور حاملہ خواتین کے لیے محفوظ ہے؟',
    category: 'treatment',
    categoryName: 'Patient Safety',
    answer: 'Yes! The Gonstead method is adapted specifically to each patient’s age, bone density, and health condition. For infants and children, adjustments utilize fingertip pressure equivalent to checking a ripe peach. For seniors with osteopenia or arthritis, gentle low-force protocols and drop tables are applied. During pregnancy, gentle pelvic alignment eases pregnancy-related back pain and sciatica while accommodating maternal comfort.',
    answerUr: 'جی ہاں، گونسٹیڈ طریقہ علاج عمر اور حالت کے مطابق ڈھالا جاتا ہے۔ بچوں کے لیے انتہائی نرم، بزرگوں کے لیے ہلکی تکنیک، اور حاملہ خواتین کے لیے خاص احتیاطی تدابیر اختیار کی جاتی ہیں۔',
    tags: ['safety', 'children', 'elderly', 'pregnancy', 'gentle-care']
  },

  // --- CONDITIONS & SPINE ---
  {
    id: 'sciatica-treatment',
    label: 'Can the Gonstead Technique treat sciatica and leg pain?',
    labelUr: 'کیا آپ سائیٹکا (عرق النساء) کا علاج کرتے ہیں؟',
    category: 'conditions',
    categoryName: 'Sciatica & Nerve Pain',
    answer: 'Yes, sciatica is one of the most frequently treated conditions at our clinic with excellent recovery rates. Sciatica occurs when the sciatic nerve is compressed or inflamed by a lumbar disc bulge, facet misalignment, or sacroiliac joint subluxation. Gonstead analysis pinpoint the exact lumbar segment causing irritation, relieving mechanical pressure from the nerve root.',
    answerUr: 'جی ہاں، سائیٹکا (ران اور ٹانگ میں اترنے والا درد) ہمارے کلینک پر کامیابی سے ٹریٹ کیا جانے والا عام مسئلہ ہے۔ گونسٹیڈ تکنیک سے ایل-4، ایل-5 یا ایس-1 مہرے کے پریشر کو ہٹا کر نرو کو آزاد کیا جاتا ہے۔',
    isPopular: true,
    tags: ['sciatica', 'leg-pain', 'lumbar-spine', 'nerve-pressure'],
    sections: [
      {
        title: 'Primary Causes of Sciatica',
        titleUr: 'سائیٹکا کی بنیادی وجوہات',
        items: [
          'Lumbar disc bulge or herniation (L4-L5, L5-S1) impinging on nerve root',
          'Sacroiliac (SI) joint misalignment provoking pelvic asymmetry',
          'Spinal canal or foraminal stenosis causing mechanical constriction',
          'Piriformis muscular hypertonicity ("pseudo-sciatica")'
        ]
      },
      {
        title: 'Home Care & Posture Tips',
        titleUr: 'گھریلو دیکھ بھال اور پوسچر',
        items: [
          'Apply ice over the low back/sacrum for 15 minutes during acute flare-ups (avoid heat directly on inflamed nerves)',
          'Avoid heavy bending or twisting at the waist; bend from the knees and hips',
          'Maintain regular gentle walking on flat surfaces to preserve disc nutrition',
          'Use an ergonomic lumbar roll while seated and take movement breaks every 30-40 minutes'
        ]
      }
    ]
  },
  {
    id: 'disc-herniation-bulge',
    label: 'Do you treat herniated, slipped, or bulging discs without surgery?',
    labelUr: 'کیا مہروں کی ڈسک کے مسائل (سلپ ڈسک) کا علاج بغیر سرجری ممکن ہے؟',
    category: 'conditions',
    categoryName: 'Disc Conditions',
    answer: 'Yes. Clarence Gonstead’s entire methodology is centred around the restoration and preservation of the intervertebral disc. By correcting the structural tilt and rotational torque on the involved vertebrae, mechanical tension is lifted from the disc fibers, allowing the inflammatory edema to subside and the body’s innate healing mechanism to reabsorb disc protrusion.',
    answerUr: 'جی ہاں، گونسٹیڈ طریقہ علاج کی بنیاد ہی ڈسک کو بحال کرنے پر ہے۔ جب مہرے کی سیدھ درست ہوتی ہے تو ڈسک پر سے دباؤ ہٹ جاتا ہے اور سوجن کم ہو کر قدرتی طور پر سکڑ جاتی ہے۔',
    isPopular: true,
    tags: ['disc-herniation', 'slipped-disc', 'bulging-disc', 'non-surgical']
  },
  {
    id: 'lower-back-pain',
    label: 'How do you address chronic or acute lower back pain?',
    labelUr: 'کمر کے شدید یا پرانے درد کا علاج کیسے کیا جاتا ہے؟',
    category: 'conditions',
    categoryName: 'Lower Back Pain',
    answer: 'Low back pain is typically caused by dysfunction in the lumbar spine or pelvis (sacroiliac joints). Rather than prescribing muscle relaxants or pain medication that merely mask discomfort, Dr. Bashir Khan identifies the mechanical root cause—whether an unstable pelvic foundation, locked facet joint, or disc stress—and performs targeted adjustments alongside stabilization advice.',
    answerUr: 'کمر درد کو وقتی دواؤں سے دبانے کے بجائے بنیاد کی نشاندہی کر کے درست کیا جاتا ہے تاکہ درد دوبارہ نہ آئے۔',
    tags: ['low-back-pain', 'sacroiliac', 'lumbar', 'chronic-pain']
  },
  {
    id: 'neck-pain-and-headaches',
    label: 'Can chiropractic help with neck stiffness, cervicogenic headaches, and migraines?',
    labelUr: 'کیا گردن کے درد، تناؤ اور مائیگرین میں مدد ملتی ہے؟',
    category: 'conditions',
    categoryName: 'Neck & Headaches',
    answer: 'Yes! Misalignments in the upper cervical spine (Atlas C1, Axis C2) and lower cervical vertebrae irritate adjacent nerves and blood vessels traveling into the head, frequently triggering tension headaches, occipital neuralgia, and migraines. Gonstead cervical adjustments restore cervical lordosis and relieve suboccipital tension.',
    answerUr: 'گردن کے اوپری مہروں کی خرابی سر درد اور مائیگرین کا بڑا سبب ہوتی ہے۔ گونسٹیڈ سرویکل ایڈجسٹمنٹ سے گردن کا قدرتی خم بحال ہوتا ہے اور سر درد میں واضح کمی آتی ہے۔',
    isPopular: true,
    tags: ['neck-pain', 'headaches', 'migraines', 'cervical-spine']
  },
  {
    id: 'posture-and-tech-neck',
    label: 'How do you treat tech neck, desk posture fatigue, and scoliosis?',
    labelUr: 'کمپیوٹر کے استعمال سے پیدا ہونے والے پوسچر کے بگاڑ کا کیا علاج ہے؟',
    category: 'conditions',
    categoryName: 'Posture & Ergonomics',
    answer: 'Prolonged sitting and phone use cause forward head posture ("tech neck"), rounded shoulders, and increased thoracic kyphosis. We perform specific thoracic adjustments, ergonomic workstation assessments, and recommend targeted core/scapular stabilization exercises to maintain healthy spinal alignment throughout your workday.',
    answerUr: 'گھنٹوں بیٹھنے اور موبائل استعمال سے گردن اور کندھوں کا توازن بگڑ جاتا ہے۔ ہم تھوراسک مہروں کی ایڈجسٹمنٹ اور پوسچر ایکسرسائز کے ذریعے اسے بحال کرتے ہیں۔',
    tags: ['posture', 'tech-neck', 'scoliosis', 'ergonomics']
  },
  {
    id: 'sports-injuries',
    label: 'Do you manage sports injuries, shoulder impingement, or joint strains?',
    labelUr: 'کیا کھلاڑیوں کی چوٹوں اور جوڑوں کے مسائل کا حل موجود ہے؟',
    category: 'conditions',
    categoryName: 'Sports Rehabilitation',
    answer: 'Yes. Athletic performance requires complete neuromuscular coordination and joint freedom. Dr. Bashir Khan works with athletes to evaluate kinetic chain mechanics (feet, pelvis, spine, shoulders) to rehabilitate acute strains, prevent recurrent overuse injuries, and enhance athletic agility.',
    answerUr: 'کھلاڑیوں کی ریڑھ کی ہڈی اور جوڑوں کی مکمل الائنمنٹ کر کے انہیں جلد کھیل کے میدان میں واپس لانے میں مدد کی جاتی ہے۔',
    tags: ['sports-injuries', 'athletics', 'shoulders', 'joint-mobility']
  },

  // --- CLINIC & HOURS ---
  {
    id: 'clinic-location-directions',
    label: 'Where is the clinic located, and how do I get there?',
    labelUr: 'کلینک کا پتہ کیا ہے اور وہاں کیسے پہنچا جائے؟',
    category: 'clinic',
    categoryName: 'Location & Directions',
    answer: 'Bashir Khan Chiropractic is conveniently located near Peshawar Model School, Tehsil Road, Nowshera, Khyber Pakhtunkhwa. The clinic is ground-floor accessible with dedicated parking directly in front of the building.',
    answerUr: 'کلینک پشاور ماڈل اسکول کے قریب، تحصیل روڈ، نوشہرہ (خیبر پختونخوا) میں واقع ہے۔ گراؤنڈ فلور پر واقع ہے اور سامنے پارکنگ موجود ہے۔',
    isPopular: true,
    tags: ['location', 'address', 'directions', 'nowshera']
  },
  {
    id: 'clinic-hours-and-days',
    label: 'What are the clinic opening hours and working days?',
    labelUr: 'کلینک کے کھلنے کے اوقات اور دن کیا ہیں؟',
    category: 'clinic',
    categoryName: 'Operating Hours',
    answer: 'Our regular clinic hours are Monday through Saturday from 9:00 AM to 6:00 PM. On Sundays, the clinic is available for emergency appointments and acute consultations by prior arrangement via phone or WhatsApp.',
    answerUr: 'کلینک پیر سے ہفتہ صبح 9:00 بجے سے شام 6:00 بجے تک کھلا رہتا ہے۔ اتوار کو صرف ایمرجنسی کیسز کے لیے پیشگی رابطہ کر کے ملاقات کی جا سکتی ہے۔',
    isPopular: true,
    tags: ['hours', 'schedule', 'sunday', 'timings']
  },
  {
    id: 'emergency-urgent-care',
    label: 'What should I do if I have severe, acute pain or need emergency care?',
    labelUr: 'شدید ہنگامی درد کی صورت میں کیا کرنا چاہیے؟',
    category: 'clinic',
    categoryName: 'Emergency Support',
    answer: 'If you are suffering from acute, debilitating spinal pain, numbness, or cannot walk comfortably, please call or WhatsApp us immediately at +92 304 699 6267. We prioritize same-day emergency triage slots to ensure acute patients receive urgent attention.',
    answerUr: 'شدید درد کی صورت میں فوری طور پر ہمارے نمبر +92 304 699 6267 پر کال یا واٹس ایپ کریں۔ ہم ایمرجنسی مریضوں کو اسی دن ترجیحی سلاٹ دیتے ہیں۔',
    isPopular: true,
    tags: ['emergency', 'acute-pain', 'urgent-care', 'same-day']
  },
  {
    id: 'parking-and-accessibility',
    label: 'Is parking available, and is the clinic wheelchair-accessible?',
    labelUr: 'کیا پارکنگ اور وہیل چیئر کی سہولت موجود ہے؟',
    category: 'clinic',
    categoryName: 'Accessibility',
    answer: 'Yes. Free parking is available right in front of the clinic entrance. Our facility is situated on the ground level with zero steps required for entry, wide doors, and adjustable treatment tables accommodating patients with mobility challenges.',
    answerUr: 'جی ہاں، سامنے کشادہ مفت پارکنگ موجود ہے اور گراؤنڈ فلور پر ہونے کی وجہ سے بزرگوں اور وہیل چیئر والے مریضوں کے لیے داخلہ انتہائی آسان ہے۔',
    tags: ['parking', 'wheelchair', 'disability-access', 'ground-floor']
  },

  // --- BOOKING & FEES ---
  {
    id: 'how-to-book-appointment',
    label: 'How can I schedule an appointment with Dr. Bashir Khan?',
    labelUr: 'ڈاکٹر بشیر خان سے اپائنٹمنٹ کیسے بک کریں؟',
    category: 'booking',
    categoryName: 'Appointment Booking',
    answer: 'You can book your appointment through several easy channels: 1) Online through our website booking portal, 2) Direct phone call to +92 304 699 6267, 3) Via WhatsApp message for rapid scheduling, or 4) Through the Patient Portal if you have a registered account.',
    answerUr: 'آپ ہماری ویب سائٹ کے ذریعے، براہ راست فون کال یا واٹس ایپ نمبر +92 304 699 6267 پر میسج کر کے باآسانی وقت طے کر سکتے ہیں۔',
    isPopular: true,
    tags: ['booking', 'appointment', 'whatsapp', 'phone']
  },
  {
    id: 'consultation-fees-and-pricing',
    label: 'What are the consultation fees and treatment costs?',
    labelUr: 'مشاورت اور علاج کی فیس کیا ہے؟',
    category: 'booking',
    categoryName: 'Fees & Transparency',
    answer: 'We practice fully transparent pricing with zero hidden fees. Specific fees depend on the nature of the consultation (initial comprehensive examination vs follow-up adjustment) and any required specialized tests. Our team will clearly inform you of all applicable fees upon initial booking assessment.',
    answerUr: 'ہم مکمل شفافیت پر یقین رکھتے ہیں اور کوئی پوشیدہ چارجز نہیں ہیں۔ ابتدائی معائنے یا فالو اپ کی فیس بکنگ کے وقت واضح طور پر بتا دی جاتی ہے۔',
    isPopular: true,
    tags: ['fees', 'cost', 'pricing', 'transparent']
  },
  {
    id: 'insurance-and-receipts',
    label: 'Do you accept health insurance, or provide official claims receipts?',
    labelUr: 'کیا میڈیکل انشورنس کے لیے رسید دی جاتی ہے؟',
    category: 'booking',
    categoryName: 'Insurance & Claims',
    answer: 'While we operate on a direct fee-for-service basis, we provide comprehensive official receipts, diagnostic summaries, and itemized visit invoices that patients can submit to their private health insurance or employee benefit plans for reimbursement.',
    answerUr: 'ہم مریضوں کو تفصیلی آفیشل رسید اور میڈیکل رپورٹ فراہم کرتے ہیں جسے وہ اپنی انشورنس کمپنی کو ری ایمبرسمنٹ کے لیے پیش کر سکتے ہیں۔',
    tags: ['insurance', 'receipt', 'reimbursement', 'invoice']
  },
  {
    id: 'what-to-bring-to-visit',
    label: 'What should I bring to my appointment, and how should I dress?',
    labelUr: 'ملاقات میں کیا ساتھ لائیں اور کیسا لباس پہنیں؟',
    category: 'booking',
    categoryName: 'Visit Preparation',
    answer: 'Please wear loose, comfortable clothing (avoid heavy belts, thick denim, or metal jewelry). Bring any previous spinal X-rays, MRI scans, CT reports, and a list of any current medications. Arriving 10 minutes early allows for smooth intake registration.',
    answerUr: 'آرام دہ اور کھلا لباس پہنیں، اپنی تمام سابقہ میڈیکل رپورٹس، ایکس رے اور ایم آر آئی اسکین ساتھ لائیں، اور وقت سے 10 منٹ پہلے تشریف لائیں۔',
    tags: ['preparation', 'clothing', 'x-rays', 'mri']
  },
  {
    id: 'rescheduling-and-cancellation',
    label: 'What is your appointment rescheduling or cancellation policy?',
    labelUr: 'اپائنٹمنٹ تبدیل یا منسوخ کرنے کی کیا پالیسی ہے؟',
    category: 'booking',
    categoryName: 'Cancellation Policy',
    answer: 'We understand that plans can change. We kindly request at least 12 to 24 hours advance notice if you need to reschedule your appointment. This allows us to reallocate the reserved time slot to another patient awaiting acute care.',
    answerUr: 'اگر وقت تبدیل کرنا ہو تو کم از کم 12 سے 24 گھنٹے پہلے مطلع فرما دیں تاکہ وہ سلاٹ کسی اور ضرورت مند مریض کو دیا جا سکے۔',
    tags: ['reschedule', 'cancellation', 'policy', 'timings']
  }
];

export function getFAQsByCategory(category: 'all' | FAQCategory): FAQItem[] {
  if (category === 'all') return FAQ_ITEMS;
  return FAQ_ITEMS.filter(item => item.category === category);
}

export function searchFAQs(query: string, category: 'all' | FAQCategory = 'all'): FAQItem[] {
  const normalized = query.toLowerCase().trim();
  const items = getFAQsByCategory(category);
  if (!normalized) return items;

  return items.filter(item => {
    return (
      item.label.toLowerCase().includes(normalized) ||
      (item.labelUr && item.labelUr.includes(normalized)) ||
      item.answer.toLowerCase().includes(normalized) ||
      (item.answerUr && item.answerUr.includes(normalized)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(normalized))) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(normalized))
    );
  });
}
