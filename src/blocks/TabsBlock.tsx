import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { renderBlock } from './registry'
import type { BlockAction, BlockProps } from '../types/ui'

type Props = BlockProps & { onAction?: (action: BlockAction) => void }

export function TabsBlock({ tabs = [], onAction }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? '')
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={tab.id === active ? 'default' : 'outline'}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="space-y-4">
          {current?.blocks.map((block) => renderBlock(block, onAction))}
        </div>
      </CardContent>
    </Card>
  )
}
