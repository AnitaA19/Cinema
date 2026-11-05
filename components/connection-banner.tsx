"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cinema } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function ConnectionBanner() {
  const queryClient = useQueryClient()
  const connection = useQuery({
    queryKey: ["connection"],
    queryFn: () => cinema.connection.get(),
  })
  const retry = useMutation({
    mutationFn: () => cinema.connection.retry(),
    onSuccess: async (info) => {
      queryClient.setQueryData(["connection"], info)
      await queryClient.invalidateQueries()
    },
  })

  if (!connection.data || connection.data.mode === "live") return null

  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Preview programme. CinemaGo at <span className="font-medium">{connection.data.apiUrl}</span> is not
          reachable from this session, so the screens are running on the same API contract with sample data.
        </p>
        <Button
          variant="outline"
          className="h-8 shrink-0"
          disabled={retry.isPending}
          onClick={() => retry.mutate()}
        >
          {retry.isPending ? "Checking…" : "Retry API"}
        </Button>
      </div>
    </div>
  )
}
