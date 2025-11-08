export const revalidate = 0
export default function QRBloodThirst() {
  return (
    <div className="section">
      <div className="container text-center">
        <h1 className="h1">You found the mark</h1>
        <p className="p mt-2">This can is your invite. Unlock drops and perks.</p>
        <form className="mt-6 mx-auto max-w-md flex gap-2" action={process.env.WORKER_ENDPOINT} method="post">
          <input type="hidden" name="source" value="qr_bloodthirst" />
          <input required name="email" type="email" placeholder="you@domain" className="flex-1 bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite" />
          <button className="btn btn-primary" type="submit">Unlock perks</button>
        </form>
        <p className="text-sm text-offwhite/70 mt-3">Or learn more on the product page.</p>
      </div>
    </div>
  )
}
