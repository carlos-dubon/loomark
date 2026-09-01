export type SiblingType = "collection" | "bookmark"

export type Sibling = {
  type: SiblingType
  id: string
  title: string
  position: number
}

const RANK: Record<SiblingType, number> = { collection: 0, bookmark: 1 }

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const compareSiblings = (a: Sibling, b: Sibling) =>
  a.position - b.position ||
  RANK[a.type] - RANK[b.type] ||
  compareText(a.title, b.title) ||
  compareText(a.id, b.id)

export const reorderWithin = (
  siblings: Sibling[],
  type: SiblingType,
  orderedIds: string[]
): Sibling[] => {
  const slotById = new Map(
    siblings.flatMap((sibling, index) =>
      sibling.type === type ? [[sibling.id, index] as const] : []
    )
  )

  const moving = orderedIds.filter((id) => slotById.has(id))
  const slots = moving.map((id) => slotById.get(id) ?? 0).sort((a, b) => a - b)
  const byId = new Map(siblings.map((sibling) => [sibling.id, sibling]))
  const next = [...siblings]

  slots.forEach((slot, index) => {
    const sibling = byId.get(moving[index] ?? "")

    if (sibling) {
      next[slot] = sibling
    }
  })

  return next
}

export const slotForTypeIndex = (
  siblings: Sibling[],
  type: SiblingType,
  index: number
) => {
  const slots = siblings.flatMap((sibling, slot) =>
    sibling.type === type ? [slot] : []
  )

  return slots[Math.max(index, 0)] ?? siblings.length
}

export const insertAt = (
  siblings: Sibling[],
  sibling: Sibling,
  slot: number
) => [...siblings.slice(0, slot), sibling, ...siblings.slice(slot)]
