/**
 * AI Scoring Library
 * Calculates a deterministic match score for a candidate against a job.
 * Based on real candidate data from Supabase.
 */

export interface Experience {
  id?: string
  title: string
  company: string
  startDate: string
  endDate?: string | null
}

export interface ScoredCandidate {
  score: number             
  yearsLabel: string          
  prevCompanies: string       
  strengths: Strength[]
}

export interface Strength {
  label: string
  color: 'purple' | 'green' | 'amber'
}

export interface ParsedCVData {
  Name: string
  LinkedIn_Link: string
  Skills: string[]
  Certification: string[]
  Worked_As: string[]
  Years_Of_Experience: string[]
  Phone_Number: string
  Birthday: string | null
  file_name: string
  uploaded_at: string
  id: string
}

// ─── Keywords for strength extraction ────────────────────────────────────────
const KEYWORD_MAP: { keywords: string[]; label: string; color: Strength['color'] }[] = [
  { keywords: ['react', 'next', 'vue', 'angular', 'frontend', 'ui', 'ux'], label: 'Frontend Expert', color: 'purple' },
  { keywords: ['node', 'express', 'backend', 'api', 'rest', 'graphql'], label: 'Backend Dev', color: 'green' },
  { keywords: ['typescript', 'ts', 'javascript', 'js'], label: 'TypeScript', color: 'green' },
  { keywords: ['full stack', 'fullstack', 'full-stack'], label: 'Full Stack', color: 'purple' },
  { keywords: ['postgresql', 'postgres', 'sql', 'database', 'mysql'], label: 'Database Expert', color: 'green' },
  { keywords: ['docker', 'kubernetes', 'devops', 'ci/cd', 'aws', 'cloud'], label: 'DevOps', color: 'amber' },
  { keywords: ['scrum', 'agile', 'management', 'lead', 'leadership'], label: 'Leadership', color: 'amber' },
  { keywords: ['figma', 'design', 'ui/ux', 'prototyp'], label: 'UI/UX Design', color: 'purple' },
  { keywords: ['mobile', 'flutter', 'react native', 'android', 'ios'], label: 'Mobile Dev', color: 'amber' },
  { keywords: ['python', 'django', 'flask', 'machine learning', 'ai'], label: 'Python/AI', color: 'green' },
]

// ─── Calculate total years of experience ─────────────────────────────────────
export function getTotalYears(experiences: Experience[]): number {
  if (!experiences || experiences.length === 0) return 0

  let totalMonths = 0
  for (const exp of experiences) {
    const start = new Date(exp.startDate)
    const end = exp.endDate ? new Date(exp.endDate) : new Date()
    if (isNaN(start.getTime())) continue
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  }
  return Math.round(totalMonths / 12)
}

// ─── Format experience label ──────────────────────────────────────────────────
export function formatYearsLabel(experiences: Experience[]): string {
  if (!experiences || experiences.length === 0) return 'No experience'
  const years = getTotalYears(experiences)
  if (years === 0) return '< 1 Year'
  if (years === 1) return '1 Year'
  return `${years}+ Years`
}

// ─── Extract previous companies ───────────────────────────────────────────────
export function getPrevCompanies(experiences: Experience[]): string {
  if (!experiences || experiences.length === 0) return '—'
  return experiences
    .map(e => e.company)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ')
}

// ─── Extract key strengths from bio + position ────────────────────────────────
export function extractStrengths(bio: string, position: string, experiences: Experience[]): Strength[] {
  const text = [bio, position, ...experiences.map(e => e.title)].join(' ').toLowerCase()

  const found: Strength[] = []
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      found.push({ label: entry.label, color: entry.color })
      if (found.length >= 3) break
    }
  }

  return found.length > 0 ? found : [{ label: 'General Profile', color: 'amber' }]
}

// ─── Keyword overlap between two texts ───────────────────────────────────────
function keywordOverlapScore(candidateText: string, jobText: string): number {
  const jobWords = jobText.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const candidateTextLower = candidateText.toLowerCase()
  const matched = jobWords.filter(w => candidateTextLower.includes(w))
  if (jobWords.length === 0) return 0
  return Math.min(40, Math.round((matched.length / jobWords.length) * 40))
}

// ─── Main scoring function ────────────────────────────────────────────────────
export function calculateAIScore(
  candidate: {
    bio?: string | null
    position?: string | null
    experiences?: Experience[]
    portfolio?: string | null
    resume_url?: string | null
  },
  job: {
    title: string
    description: string
    requirements?: string | null
  }
): number {
  let score = 0

  const bio = candidate.bio || ''
  const position = candidate.position || ''
  const experiences = candidate.experiences || []
  // Only use Title and Requirements, excluding Description
  const jobText = `${job.title} ${job.requirements || ''}`.toLowerCase()

  // 1. Bio + position keyword match vs job (max 40 pts)
  score += keywordOverlapScore(`${bio} ${position}`, jobText)

  // 2. Experience years (max 30 pts)
  const years = getTotalYears(experiences)
  if (years >= 5) score += 30
  else if (years >= 3) score += 22
  else if (years >= 1) score += 14
  else score += 5

  // 3. Position title similarity (max 20 pts)
  const posLower = position.toLowerCase()
  const jobTitleLower = job.title.toLowerCase()
  const posWords = posLower.split(/\s+/)
  const titleWords = jobTitleLower.split(/\s+/)
  const matchedTitle = posWords.filter(w => titleWords.some(t => t.includes(w) || w.includes(t)))
  score += Math.min(20, matchedTitle.length * 7)

  // 4. Profile completeness bonus (max 10 pts)
  if (candidate.resume_url) score += 5
  if (candidate.portfolio) score += 3
  if (bio.length > 50) score += 2

  return Math.min(Math.max(score, 10), 99)
}

// ─── Full scoring pipeline ────────────────────────────────────────────────────
export function scoreCandidate(
  candidate: {
    bio?: string | null
    position?: string | null
    experiences?: Experience[]
    portfolio?: string | null
    resume_url?: string | null
  },
  job: {
    title: string
    description: string
    requirements?: string | null
  }
): ScoredCandidate {
  const experiences = candidate.experiences || []
  return {
    score: calculateAIScore(candidate, job),
    yearsLabel: formatYearsLabel(experiences),
    prevCompanies: getPrevCompanies(experiences),
    strengths: extractStrengths(candidate.bio || '', candidate.position || '', experiences),
  }
}

// ─── Score from Parsed CV Data ───────────────────────────────────────────────
export function calculateScoreFromParsedCV(
  cvData: ParsedCVData,
  job: { title: string; description: string; requirements?: string | null }
): number {
  let score = 0
  // Only use Title and Requirements, excluding Description
  const jobText = `${job.title} ${job.requirements || ''}`.toLowerCase()
  const jobTitleLower = job.title.toLowerCase()

  // 1. Skills match (max 40 pts)
  if (cvData.Skills && cvData.Skills.length > 0) {
    const skillScore = cvData.Skills.reduce((acc, skill) => {
      const cleanSkill = skill.toLowerCase().replace(/\n/g, ' ').trim()
      return acc + (jobText.includes(cleanSkill) ? 8 : 0)
    }, 0)
    score += Math.min(40, skillScore)
  }

  // 2. Relevant Experience years (max 30 pts)
  let totalRelevantMonths = 0
  const workedAs = cvData.Worked_As || []
  const yearsOfExp = cvData.Years_Of_Experience || []

  workedAs.forEach((role, index) => {
    if (!role) return
    const cleanRole = role.toLowerCase().replace(/\n/g, ' ').trim()
    // Check if this specific role is relevant to the job title or requirements
    const isRelevant = jobText.includes(cleanRole) || jobTitleLower.includes(cleanRole) || cleanRole.includes(jobTitleLower)
    
    if (isRelevant) {
      const exp = yearsOfExp[index] || ''
      const match = exp.match(/(\d+)\s*(mois|month|an|year)/i)
      if (match) {
        const val = parseInt(match[1])
        const unit = match[2].toLowerCase()
        if (unit.startsWith('an') || unit.startsWith('year')) {
          totalRelevantMonths += val * 12
        } else {
          totalRelevantMonths += val
        }
      }
    }
  })

  const years = totalRelevantMonths / 12
  if (years >= 5) score += 30
  else if (years >= 3) score += 20
  else if (years >= 1) score += 10
  else if (years > 0) score += 5

  // 3. Title match (max 20 pts)
  const matchedTitles = (cvData.Worked_As || []).filter(title => {
    if (!title) return false
    const t = title.toLowerCase().replace(/\n/g, ' ').trim()
    return jobTitleLower.includes(t) || t.includes(jobTitleLower)
  })
  score += Math.min(20, matchedTitles.length * 10)

  // 4. Certifications bonus (max 10 pts)
  if (cvData.Certification && cvData.Certification.length > 0) {
    const certScore = cvData.Certification.reduce((acc, cert) => {
      const cleanCert = cert.toLowerCase().replace(/\n/g, ' ').trim()
      // Only give points if cert matches job requirements/title. No bonus for non-matches.
      return acc + (jobText.includes(cleanCert) ? 5 : 0)
    }, 0)
    score += Math.min(10, certScore)
  }

  return { 
    score: Math.min(Math.max(score, 10), 99), 
    totalExperienceMonths: totalRelevantMonths 
  }
}

