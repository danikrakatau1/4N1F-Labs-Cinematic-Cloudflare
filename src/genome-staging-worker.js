export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return Response.json({
        success: false,
        staging: true,
        message: 'Genome Shell V1 staging is UI-only. Production APIs are intentionally not connected.'
      }, {
        status: 423,
        headers: {
          'cache-control': 'no-store',
          'x-4n1f-staging': 'genome-shell-v1'
        }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
