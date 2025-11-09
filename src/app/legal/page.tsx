/**
 * The legal page for the website.
 * This component serves as a placeholder for legal information,
 * such as terms of service, privacy policy, and return policy.
 *
 * @returns {JSX.Element} The rendered legal page.
 */
export default function LegalPage() {
  return (
    <div className="section">
      <div className="container max-w-3xl space-y-4 text-base text-offwhite/80">
        <h1 className="h1">Legal</h1>
        <p>BloodThirst is a premium canned natural mineral water produced by UNHOLY CO.</p>
        <p>All rights reserved. Terms, privacy, returns, and compliance documentation will live here.</p>
        <p>For licensing or wholesale inquiries email <span className="text-bone">rituals@theunholy.co</span>.</p>
      </div>
    </div>
  )
}
