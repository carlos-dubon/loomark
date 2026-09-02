import { createRoot } from "react-dom/client"

import "@/assets/tailwind.css"

import { readConnection } from "@/lib/storage"

import { App } from "./App"

const container = document.getElementById("root")

const open = (serverUrl: string) => {
  window.location.replace(serverUrl)
}

void readConnection().then((connection) => {
  if (connection) {
    open(connection.serverUrl)
    return
  }

  if (container) {
    createRoot(container).render(<App onOpen={open} />)
  }
})
