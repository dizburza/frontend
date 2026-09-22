/**
 * The creator's own employment terms, carried from step 1 to the step that
 * actually deploys the organization.
 *
 * Held in storage rather than sent with the profile update, because there is
 * no organization to be employed by until the contract exists. Whoever sets an
 * organization up is usually on its payroll too, and without this they would
 * hold a signer seat while appearing nowhere on the staff roster.
 */
export const CREATOR_EMPLOYMENT_KEY = "creatorEmployment"

export type CreatorEmployment = {
  addToPayroll: boolean
  jobRole: string
  salary: string
}

export const emptyCreatorEmployment: CreatorEmployment = {
  addToPayroll: true,
  jobRole: "",
  salary: "",
}

export const readCreatorEmployment = (): CreatorEmployment | null => {
  try {
    const raw = localStorage.getItem(CREATOR_EMPLOYMENT_KEY)
    if (!raw) return null
    return { ...emptyCreatorEmployment, ...JSON.parse(raw) }
  } catch {
    return null
  }
}
