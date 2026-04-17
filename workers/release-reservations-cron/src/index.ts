export interface Env {
  SITE_URL: string
  CRON_SECRET: string
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const url = `${env.SITE_URL}/api/cron/release-reservations`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()
    console.log("Release reservations cron result:", JSON.stringify(result))
  },
}
