export const isDemo = process.env.NEXT_PUBLIC_DEMO === "true"

export const DEMO_CREDENTIALS = {
  email: "demo@loomark.app",
  password: "demo",
}

export const DEMO_USER = {
  id: "demo-user",
  name: "Demo User",
  email: DEMO_CREDENTIALS.email,
  image: null,
  role: "OWNER" as const,
}

export const DEMO_UNSORTED_ID = "c-unsorted"

export class DemoUnavailableError extends Error {
  constructor(action: string) {
    super(`${action} is turned off in the demo.`)
    this.name = "DemoUnavailableError"
  }
}
