import type { SessionProfile } from "@/lib/session"

type ProfileUpdate = {
  surname?: string
  firstname?: string
  email?: string
  phoneNumber?: string
  username?: string
}

/**
 * The route takes no address: it edits whoever the session belongs to. Passing
 * one would be the difference between editing your own name and editing
 * anyone's.
 */
/** Advisory only: the unique index decides, and a save can still be refused. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const response = await fetch(
    `/api/auth/username-available?username=${encodeURIComponent(username)}`,
    { credentials: "include", headers: { Accept: "application/json" } }
  )

  if (!response.ok) return true

  const body = await response.json().catch(() => null)
  return body?.data?.available !== false
}

export async function updateOwnProfile(update: ProfileUpdate): Promise<SessionProfile> {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(update),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      body?.error || body?.message || `Could not save your details (HTTP ${response.status})`
    throw new Error(message)
  }

  return body?.data?.user ?? body?.data ?? body
}
