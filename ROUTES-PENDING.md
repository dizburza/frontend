# Routes left behind by the organization-first pivot

The homepage onboards one kind of person: an admin setting up a payroll
organization. Every "Get Started" goes to `/sign-in`, and connecting a wallet
there goes straight to `/organization-setup/organization-details`. Nobody
chooses an account type any more, because the banking side is on hold and the
only thing to create is an organization.

Everyone else is invited. An employee or a signer arrives through a link tied to
an organization that already exists, and gets a wallet page rather than this
flow.

That left the account-type routes stranded. Nothing is deleted: the invite pages
are unbuilt and some of this is likely to be reused. This file is the list to
come back to.

## Stranded, nothing routes into them from the connect path

Nothing links to any of these. They are reachable only by typing the URL.

| Route | File | Was reached from |
| --- | --- | --- |
| `/account-type` | `app/(onboarding)/account-type/page.tsx` | Landing page CTAs, now pointed at `/sign-in` |
| `/setup-profile` | `app/(onboarding)/setup-profile/page.tsx` | Unregistered wallet after connect, and `/account-type` |
| `/username` | `app/(onboarding)/username/page.tsx` | Nothing, even before the pivot |
| `/organization-setup` | `app/(onboarding)/organization-setup/page.tsx` | `/account-type`, business branch. Redirects to organization-details |

`/account-type` and `/setup-profile` now only point at each other, so the pair
goes together whenever it goes.

## Kept on purpose

Not leftovers. An invited employee is a real user of these.

* **`/personal/wallet` is where a non-admin lands.** Invited through a link,
  given a wallet page, and nothing else. Three things route there and all three
  are correct:
  * `components/connectWalletHelpers.ts:31`, the `employee` and `user` branch
  * `components/OrgGuard.tsx:40`, a non-admin who opens an org URL
  * `components/dashboard/header.tsx:195`, the nav link

## Unbuilt

The invite link is the whole non-admin path and none of it exists yet: the link
itself, the page it opens, the employee filling in details HR seeded from CSV,
and the same for inviting signers. An invited person has no route into the app
until that is built.

## Before deleting any of this

This repo is not under version control, so a deletion does not come back. Check
the symbol is genuinely unreferenced rather than going by name, and remove the
route together with whatever links into it.
