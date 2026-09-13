"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { errorMessage } from "@loomark/core/format"

import { api } from "@/lib/client/api"
import { appearanceQuery } from "@/lib/client/queries"
import type { AppearanceUpdateInput } from "@/lib/schemas"
import { DEFAULT_APPEARANCE } from "@/lib/themes/appearance-defaults"

export const useAppearance = () =>
  useQuery(appearanceQuery).data ?? DEFAULT_APPEARANCE

export const useUpdateAppearance = (fallback: string) => {
  const queryClient = useQueryClient()
  const { queryKey } = appearanceQuery

  return useMutation({
    mutationFn: (input: AppearanceUpdateInput) => api.updateAppearance(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (current = DEFAULT_APPEARANCE) => ({
        ...current,
        ...input,
      }))

      return { previous }
    },
    onError: (cause, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error(errorMessage(cause, fallback))
    },
    onSuccess: (appearance) => {
      queryClient.setQueryData(queryKey, appearance)
    },
  })
}
