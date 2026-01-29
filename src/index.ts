export default {
  async fetch(request: Request, env: any): Promise<Response> {
    return new Response(
      JSON.stringify({
        status: "ok",
        app: "Gaushala Management System",
        time: new Date().toISOString()
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
