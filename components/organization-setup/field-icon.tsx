import Image from "next/image"

/** The 16px line icons exported from the design, all stroked the same grey. */
export type FieldIconName =
  | "people"
  | "global"
  | "briefcase"
  | "sms"
  | "note-2"
  | "document-text"
  | "info-circle"
  | "arrow-down"
  | "solar_phone-linear"

export function FieldIcon({ name, className }: Readonly<{ name: FieldIconName; className?: string }>) {
  return <Image src={`/icons/${name}.svg`} alt="" width={16} height={16} className={className} />
}
