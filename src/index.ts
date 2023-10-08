export interface Env {
    // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    // MY_KV_NAMESPACE: KVNamespace;
    //
    // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
    // MY_DURABLE_OBJECT: DurableObjectNamespace;
    //
    // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
    //
    // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
    // MY_SERVICE: Fetcher;
    //
    // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
    // MY_QUEUE: Queue;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method !== 'POST') {
            return error();
        }

        return await handlePost(request);
    },
};

interface PostRequest {
    secret: string,
    token: string,
};

async function handlePost(request: Request): Promise<Response> {
    const body: PostRequest = await request.json();
    const secret = body.secret || null;
    const token = body.token || null;

    const ip = request.headers.get('CF-Connecting-IP');

    // Validate the token by calling the `/siteverify` API.
    let formData = new FormData();

    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
        body: formData,
        method: 'POST',
    });

    const outcome = await result.json();

    if (!outcome.success) {
        return error('Invalid Turnstile token', 401);
    }

    return new Response('valid');
}

function error(error: string = 'Invalid request', status: number = 400): Response {
    return new Response(error, { status });
}
