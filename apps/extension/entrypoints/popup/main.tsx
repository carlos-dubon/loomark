import { QueryClientProvider } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"

import "@/assets/tailwind.css"

import { queryClient } from "@/lib/queries"

import { App } from "./App"

const container = document.getElementById("root")

if (container) {
  createRoot(container).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}
