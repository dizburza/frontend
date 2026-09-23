export type InviteDetails = {
  organizationName: string
  organizationSlug: string
}

const readError = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null)
  return body?.error || body?.message || fallback
}

/** Answers before the claimer has an account, so it carries no staff data. */
export async function fetchInvite(token: string): Promise<InviteDetails> {
  const response = await fetch(`/api/invites/${encodeURIComponent(token)}`, {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(await readError(response, "This invitation link is no longer valid"))
  }

  const body = await response.json()
  return body.data
}

/**
 * The account and the email both come from the session, so there is nothing to
 * pass but the token.
 */
/**
 * Carries the status, because the caller has to treat the outcomes
 * differently: no invitation for this email will not change by trying again,
 * while a failed request might.
 */
export class ClaimError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ClaimError"
  }

  /** Nothing was seeded for them, so their employer has to act first. */
  get isNotInvited() {
    return this.status === 404
  }

  /**
   * The row this email matches was already claimed by a different account.
   * Distinguished from the employment-cap 409 by message, since both are
   * conflicts but only this one is about the invitation itself.
   */
  get isAlreadyClaimed() {
    return this.status === 409 && /already completed registration/i.test(this.message)
  }
}

export async function claimInvite(token: string): Promise<{ organizationSlug?: string }> {
  const response = await fetch(`/api/invites/${encodeURIComponent(token)}/claim`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new ClaimError(
      await readError(response, "Could not accept this invitation"),
      response.status
    )
  }

  const body = await response.json()
  return body.data ?? {}
}

export async function fetchOrganizationInvite(organizationId: string): Promise<string | null> {
  const response = await fetch(`/api/organizations/${organizationId}/invite`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Could not load the invitation link"))
  }

  const body = await response.json()
  return body.data?.token ?? null
}

/** Issuing a new link revokes the previous one. */
export async function createOrganizationInvite(organizationId: string): Promise<string> {
  const response = await fetch(`/api/organizations/${organizationId}/invite`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Could not create an invitation link"))
  }

  const body = await response.json()
  return body.data.token
}
