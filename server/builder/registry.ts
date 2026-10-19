import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BUILDER_ROOT = join(process.cwd(), 'builder')
const SKILLS_ROOT = join(BUILDER_ROOT, 'skills')
const KNOWLEDGE_ROOT = join(BUILDER_ROOT, 'knowledge')

export type BuilderSkillMeta = {
  id: string
  title: string
  path: string
}

export type KnowledgeChunk = {
  id: string
  source: string
  body: string
}

function parseSkillTitle(body: string, fallback: string) {
  const line = body.split('\n').find((l) => l.startsWith('# '))
  return line ? line.slice(2).trim() : fallback
}

export function listBuilderSkills(): BuilderSkillMeta[] {
  if (!existsSync(SKILLS_ROOT)) return []
  const out: BuilderSkillMeta[] = []
  for (const dir of readdirSync(SKILLS_ROOT)) {
    const skillPath = join(SKILLS_ROOT, dir, 'SKILL.md')
    if (!existsSync(skillPath)) continue
    const body = readFileSync(skillPath, 'utf8')
    out.push({
      id: dir,
      title: parseSkillTitle(body, dir),
      path: skillPath,
    })
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

export function readBuilderSkill(skillId: string): string {
  const skillPath = join(SKILLS_ROOT, skillId, 'SKILL.md')
  if (!existsSync(skillPath)) throw new Error(`找不到 builder skill：${skillId}`)
  return readFileSync(skillPath, 'utf8')
}

function loadKnowledgeChunks(): KnowledgeChunk[] {
  if (!existsSync(KNOWLEDGE_ROOT)) return []
  const chunks: KnowledgeChunk[] = []
  for (const file of readdirSync(KNOWLEDGE_ROOT)) {
    if (!file.endsWith('.md')) continue
    const full = join(KNOWLEDGE_ROOT, file)
    if (!statSync(full).isFile()) continue
    chunks.push({
      id: file.replace(/\.md$/, ''),
      source: `builder/knowledge/${file}`,
      body: readFileSync(full, 'utf8'),
    })
  }
  for (const skill of listBuilderSkills()) {
    chunks.push({
      id: `skill-${skill.id}`,
      source: `builder/skills/${skill.id}/SKILL.md`,
      body: readFileSync(skill.path, 'utf8'),
    })
  }
  return chunks
}

function scoreChunk(body: string, query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  const text = body.toLowerCase()
  let score = 0
  for (const token of q.split(/\s+/).filter(Boolean)) {
    if (token.length < 2) continue
    if (text.includes(token)) score += 2
  }
  if (text.includes(q)) score += 5
  return score
}

export function searchBuilderKnowledge(query: string, limit = 5): KnowledgeChunk[] {
  const chunks = loadKnowledgeChunks()
  return chunks
    .map((c) => ({ c, score: scoreChunk(c.body, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c)
}
