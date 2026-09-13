"use client"

import { useDragDropMonitor } from "@dnd-kit/react"
import { useStore } from "jotai"
import { useEffect, useRef } from "react"

import { bookmarkDragGroup, DRAG_TYPE } from "@/lib/dnd"
import { selectedBookmarkIdsAtom } from "@/store/atoms"

const LAYER_TILTS = [-0.035, 0.026, -0.06]
const LAYER_OFFSET = 6
const LAYER_Z_INDEX = 9999
const MIN_TILT_DEG = 1
const GATHER_MS = 180
const GATHER_STAGGER_MS = 70
const RETURN_MS = 340
const RETURN_STAGGER_MS = 40
const MAX_STAGGER_STEPS = 6
const LANDING_TIMEOUT_MS = 1500
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)"

type Layer = {
  element: HTMLElement
  node: HTMLElement
  depth: number
}

type Stack = {
  anchor: Element
  layers: Layer[]
  frame: number
  droppedAt: number | null
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const stackLevel = (depth: number) => Math.min(depth, LAYER_TILTS.length)

const staggerStep = (depth: number) => Math.min(depth, MAX_STAGGER_STEPS)

const transitionFor = (duration: number, animate: boolean) =>
  animate
    ? ["transform", "width", "height", "opacity"]
        .map((property) => `${property} ${duration}ms ${EASING}`)
        .join(", ")
    : "none"

const tiltAngle = (tilt: number, rect: DOMRect) => {
  const angle =
    (Math.atan2(tilt * Math.min(rect.width, rect.height), rect.width / 2) *
      180) /
    Math.PI

  return Math.abs(angle) < MIN_TILT_DEG ? 0 : angle
}

const place = (
  node: HTMLElement,
  rect: DOMRect,
  offset: number,
  angle: number
) => {
  node.style.width = `${rect.width}px`
  node.style.height = `${rect.height}px`
  node.style.transform = `translate3d(${rect.left + offset}px, ${rect.top + offset}px, 0) rotate(${angle}deg)`
}

const createLayer = (
  element: HTMLElement,
  depth: number,
  animate: boolean
): Layer => {
  const node = element.cloneNode(true) as HTMLElement

  node.setAttribute("inert", "")
  node.setAttribute("aria-hidden", "true")
  Object.assign(node.style, {
    position: "fixed",
    top: "0px",
    left: "0px",
    margin: "0px",
    boxSizing: "border-box",
    translate: "none",
    pointerEvents: "none",
    zIndex: String(LAYER_Z_INDEX - depth),
  })
  place(node, element.getBoundingClientRect(), 0, 0)

  document.body.append(node)
  element.style.visibility = "hidden"

  void node.offsetWidth
  node.style.transition = transitionFor(
    GATHER_MS + staggerStep(depth) * GATHER_STAGGER_MS,
    animate
  )

  if (depth > LAYER_TILTS.length) {
    node.style.opacity = "0"
  }

  return { element, node, depth }
}

const release = ({ element, node }: Layer) => {
  element.style.removeProperty("visibility")
  node.remove()
}

const isAt = (node: HTMLElement, rect: DOMRect) => {
  const current = node.getBoundingClientRect()

  return [
    current.left - rect.left,
    current.top - rect.top,
    current.width - rect.width,
    current.height - rect.height,
  ].every((delta) => Math.abs(delta) < 1)
}

const gather = ({ anchor, layers }: Stack) => {
  const rect = anchor.getBoundingClientRect()

  layers.forEach(({ node, depth }) => {
    const level = stackLevel(depth)

    place(
      node,
      rect,
      level * LAYER_OFFSET,
      tiltAngle(LAYER_TILTS[level - 1] ?? 0, rect)
    )
  })
}

const settle = (stack: Stack, droppedAt: number) => {
  const expired = performance.now() - droppedAt > LANDING_TIMEOUT_MS

  stack.layers = stack.layers.filter((layer) => {
    if (!layer.element.isConnected) {
      layer.node.remove()
      return false
    }

    const rect = layer.element.getBoundingClientRect()
    place(layer.node, rect, 0, 0)

    if (expired || isAt(layer.node, rect)) {
      release(layer)
      return false
    }

    return true
  })
}

const disposeStack = (stack: Stack) => {
  cancelAnimationFrame(stack.frame)
  stack.layers.forEach(release)
  stack.layers = []
}

export const useBookmarkDragStack = () => {
  const store = useStore()
  const stacks = useRef(new Set<Stack>())
  const active = useRef<Stack | null>(null)

  useEffect(() => {
    const current = stacks.current

    return () => {
      current.forEach(disposeStack)
      current.clear()
    }
  }, [])

  const run = (stack: Stack) => {
    if (stack.droppedAt === null) {
      gather(stack)
    } else {
      settle(stack, stack.droppedAt)
    }

    if (stack.layers.length === 0) {
      stacks.current.delete(stack)
      return
    }

    stack.frame = requestAnimationFrame(() => run(stack))
  }

  useDragDropMonitor({
    onDragStart: ({ operation: { source } }) => {
      stacks.current.forEach(disposeStack)
      stacks.current.clear()
      active.current = null

      if (
        source?.type !== DRAG_TYPE.bookmark ||
        !source.element ||
        !source.manager
      ) {
        return
      }

      const group = bookmarkDragGroup(
        source.id,
        store.get(selectedBookmarkIdsAtom)
      )

      if (!group) {
        return
      }

      const { draggables } = source.manager.registry
      const animate = !prefersReducedMotion()
      const layers = [...group]
        .filter((id) => id !== String(source.id))
        .flatMap((id) => {
          const element = draggables.get(id)?.element

          return element instanceof HTMLElement ? [element] : []
        })
        .map((element, index) => createLayer(element, index + 1, animate))

      if (layers.length === 0) {
        return
      }

      const stack: Stack = {
        anchor: source.element,
        layers,
        frame: 0,
        droppedAt: null,
      }

      stacks.current.add(stack)
      active.current = stack
      run(stack)
    },
    onDragEnd: () => {
      const stack = active.current
      active.current = null

      if (!stack) {
        return
      }

      const animate = !prefersReducedMotion()

      stack.layers.forEach(({ node, depth }) => {
        node.style.transition = transitionFor(
          RETURN_MS + staggerStep(depth) * RETURN_STAGGER_MS,
          animate
        )
        node.style.opacity = "1"
      })

      stack.droppedAt = performance.now()
    },
  })
}
