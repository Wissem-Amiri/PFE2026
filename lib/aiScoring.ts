/**
 * AI Scoring Library
 * Calculates a deterministic match score for a candidate against a job.
 * Based on real postulant data from Supabase.
 */

export interface Experience {
  id?: string
  title: string
  company: string
  startDate: string
  endDate?: string | null
}

export interface ScoredCandidate {
  score: number               // 0-100
  yearsLabel: string          // e.g. "3 Years"
  prevCompanies: string       // e.g. "Google, Meta"
  strengths: Strength[]
}

export interface Strength {
  label: string
  color: 'purple' | 'green' | 'amber'
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
  if (!experiences || experiences.length === 0) return 'Aucune expérience'
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
  postulant: {
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

  const bio = postulant.bio || ''
  const position = postulant.position || ''
  const experiences = postulant.experiences || []
  const jobText = `${job.title} ${job.description} ${job.requirements || ''}`

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
  if (postulant.resume_url) score += 5
  if (postulant.portfolio) score += 3
  if (bio.length > 50) score += 2

  return Math.min(Math.max(score, 10), 99)
}

// ─── Full scoring pipeline ────────────────────────────────────────────────────
export function scoreCandidate(
  postulant: {
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
  const experiences = postulant.experiences || []
  return {
    score: calculateAIScore(postulant, job),
    yearsLabel: formatYearsLabel(experiences),
    prevCompanies: getPrevCompanies(experiences),
    strengths: extractStrengths(postulant.bio || '', postulant.position || '', experiences),
  }
}
