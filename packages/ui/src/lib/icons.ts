import Fuse from "fuse.js"
import { iconNames, type IconName } from "lucide-react/dynamic"

export const SUGGESTED_ICONS: IconName[] = [
  "folder",
  "folder-open",
  "bookmark",
  "star",
  "heart",
  "book",
  "book-open",
  "library",
  "briefcase",
  "code",
  "terminal",
  "palette",
  "camera",
  "music",
  "film",
  "gamepad-2",
  "graduation-cap",
  "lightbulb",
  "rocket",
  "plane",
  "map-pin",
  "shopping-cart",
  "utensils",
  "dumbbell",
  "leaf",
  "sparkles",
  "flame",
  "zap",
  "globe",
  "newspaper",
  "file-text",
  "pen-tool",
  "image",
  "video",
  "headphones",
  "wallet",
  "chart-line",
  "users",
  "house",
  "calendar",
  "inbox",
  "tag",
  "flask-conical",
  "wrench",
]

export { iconNames, type IconName }

const fuse = new Fuse(
  iconNames.map((name) => ({ name, words: name.split("-") })),
  {
    keys: [
      { name: "name", weight: 2 },
      { name: "words", weight: 1 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  }
)

export const searchIcons = (query: string, limit?: number): IconName[] => {
  const needle = query.trim().toLowerCase().replace(/\s+/g, "-")

  if (!needle) {
    return []
  }

  return fuse
    .search(needle, limit ? { limit } : undefined)
    .map((result) => result.item.name)
}
