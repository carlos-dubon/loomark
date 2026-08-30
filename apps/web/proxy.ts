import { NextResponse, type NextRequest } from "next/server"

const EXTENSION_ORIGIN = /^(chrome|moz|safari-web)-extension:\/\/[a-z0-9-]+$/i

const CORS_METHODS = "GET, POST, PATCH, DELETE, OPTIONS"
const CORS_HEADERS = "authorization, content-type"

export const proxy = (request: NextRequest) => {
  const origin = request.headers.get("origin")

  if (!origin || !EXTENSION_ORIGIN.test(origin)) {
    return NextResponse.next()
  }

  const response =
    request.method === "OPTIONS"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next()

  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Methods", CORS_METHODS)
  response.headers.set("Access-Control-Allow-Headers", CORS_HEADERS)
  response.headers.set("Access-Control-Max-Age", "86400")
  response.headers.set("Vary", "Origin")

  return response
}

export const config = { matcher: "/api/:path*" }
