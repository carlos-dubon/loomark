import type { CollectionDTO } from "@loomark/core/types"

export const collectionEmptyState = (collection: CollectionDTO) =>
  collection.kind === "UNSORTED"
    ? {
        emptyIcon: "inbox" as const,
        emptyTitle: "Nothing unsorted",
        emptyDescription:
          "Every bookmark you saved already lives in a collection.",
      }
    : {
        emptyIcon: "bookmark" as const,
        emptyTitle: "This collection is empty",
        emptyDescription:
          "Add a bookmark here or drop one in from another collection.",
      }
