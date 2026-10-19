import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { fetchBuilderSkills, type BuilderSkillMeta } from '../../mcp/client'

type Props = {
  onAskAgent: (prompt: string) => void
}

export function BuilderSkillsPanel({ onAskAgent }: Props) {
  const [open, setOpen] = useState(false)
  const [skills, setSkills] = useState<BuilderSkillMeta[]>([])

  useEffect(() => {
    if (!open) return
    void fetchBuilderSkills().then((d) => setSkills(d.skills))
  }, [open])

  return (
    <div className="mt-2 border-t border-[var(--line)] pt-2">
      <button
        type="button"
        className="text-[10px] font-medium text-[var(--muted)]"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '▾' : '▸'} Skills 目錄（Agent 讀取，非固定流程）
      </button>
      {open ? (
        <ul className="mt-1 space-y-1">
          {skills.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded px-1 py-0.5 text-[10px] hover:bg-[var(--line)]/30">
              <span>
                <span className="font-mono text-[var(--muted)]">{s.id}</span> · {s.title}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-[10px]"
                onClick={() => onAskAgent(`請 read_skill ${s.id}，依 SKILL 用白話帶我下一步（不要跳過資料源）。`)}
              >
                請 Agent 用這個
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
