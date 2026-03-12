import { SubscribeForm } from "@/components/forms/SubscribeForm"

export const revalidate = 0

/**
 * The landing page for users who scan a QR code on a BloodThirst can.
 * This component provides a call to action for users to sign up for perks and drops.
 *
 * @returns {JSX.Element} The rendered QR code landing page.
 */
export default function QRBloodThirst() {
  return (
    <div className="section">
      <div className="container text-center">
        <h1 className="h1">You found the mark</h1>
        <p className="p mt-2">This can is your invite. Unlock drops and perks.</p>
        <div className="mx-auto mt-6 max-w-md">
          <SubscribeForm
            source="qr_bloodthirst"
            buttonLabel="Unlock perks"
            placeholder="you@domain"
            formClassName="flex flex-col gap-2 sm:flex-row"
            inputClassName="flex-1 rounded-xl border border-ash bg-ash/40 px-3 py-2 text-offwhite"
            buttonClassName="btn btn-primary"
            statusClassName="text-sm text-offwhite/70"
            successMessage="Perks unlocked. Watch your inbox."
          />
        </div>
        <p className="text-sm text-offwhite/70 mt-3">Or learn more on the product page.</p>
      </div>
    </div>
  )
}
