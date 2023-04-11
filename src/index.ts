import { DataStore } from "./DataStore";

/**
 * This function is called when a Right to Erasure request is received.
 *
 * - The first parameter of `dataStore.delete` is the name of the DataStore to delete from.
 * - The second parameter of `dataStore.delete` is the key inside that DataStore to delete.
 * - The third parameter of `dataStore.delete` is an optional callback function that is called when the request is complete.
 *
 * ## Example
 * In the Luau below, the DataStore name is `"PlayerData"` and the key is `"52/" .. userId`
 *
 * ```lua
 * local dataStore = game:GetService("DataStoreService"):GetDataStore("PlayerData")
 * dataStore:RemoveAsync("52/" .. userId)
 * ```
 */
async function deletePlayerData(dataStore: DataStore, userId: number) {
    const success = await dataStore.delete("PlayerData", `52/${userId}`, onDataStoreCallback);

    if (success) {
        console.log(`Deleted PlayerData for ${userId}`);
    } else {
        console.log(`Failed to delete PlayerData for ${userId}`);
    }

    return success;
}

/**
 * Use this function to handle/report errors when deleting from a DataStore.
 */
async function onDataStoreCallback(success: boolean, response: Response) {
    // Handle/report errors here
}

// Ideally you shouldn't need to adjust too much below this unless you want to extend the functionality of the script (or I messed up somewhere)

export interface Env {
    /**
     * An OpenCloud API key with access to the DataStore API for experiences that may receive Right to Erasure requests.
     */
    readonly OPEN_CLOUD_API_KEY: string;

    /**
     * The secret key used to sign webhook requests from Roblox.
     */
    readonly WEBHOOK_SECRET: string;
}

async function verifyRequest(rawBody: string, signature: string | null, secret: string) {
    if (!signature) return false;

    const [rawTimestamp, rawHash] = signature.split(",");
    const timestamp = rawTimestamp.substring(2);
    const hash = rawHash.substring(3);

    if (!timestamp || !hash) return false;

    const encoder = new TextEncoder();
    const baseString = `${timestamp}.${rawBody}`;

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));

    const signatureHash = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    const signatureMatches = signatureHash === hash;

    if (!signatureMatches) return false;

    const now = Math.floor(Date.now() / 1000);
    const tenMinutes = 10 * 60;

    return now - parseInt(timestamp) < tenMinutes;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const { method, url } = request;
        const { pathname } = new URL(url);

        if (pathname === "/" && method === "POST") {
            const rawBody = await request.text();
            const signature = request.headers.get("roblox-signature");

            const verifiedRequest = await verifyRequest(rawBody, signature, env.WEBHOOK_SECRET);
            if (!verifiedRequest) return new Response("Unauthorized", { status: 401 });

            const body = JSON.parse(rawBody);
            const eventType = body?.EventType;

            if (eventType === "SampleNotification") {
                console.log("SampleNotification received!");
                return new Response("OK", { status: 200 });
            } else if (eventType === "RightToErasureRequest") {
                console.log("RightToErasureRequest received!");

                let overallSuccess = false;

                if (body?.EventPayload?.GameIds && body?.EventPayload?.UserId) {
                    const userId = body.EventPayload.UserId;
                    const gameIds = body.EventPayload.GameIds;

                    overallSuccess = true;

                    for (const universeId of gameIds) {
                        const dataStore = new DataStore(universeId, env.OPEN_CLOUD_API_KEY);
                        const success = await deletePlayerData(dataStore, userId);

                        if (!success) {
                            overallSuccess = false;
                        }
                    }
                }

                if (overallSuccess) {
                    return new Response("OK", { status: 200 });
                } else {
                    return new Response("Internal Server Error", { status: 500 });
                }
            }

            console.log("Unhandled event type:")
            console.log(body);

            return new Response("Unhandled event type", { status: 400 });
        } else if (pathname === "/status" && method === "GET") {
            const NO_KEY = env.OPEN_CLOUD_API_KEY === null;
            const NO_SECRET = env.WEBHOOK_SECRET === null;

            if (NO_KEY || NO_SECRET) {
                return new Response(`Missing secrets: ${NO_KEY ? "OPEN_CLOUD_API_KEY" : ""} ${NO_SECRET ? "WEBHOOK_SECRET" : ""}`, { status: 500 });
            }

            return new Response("OK", { status: 200 });
        }

        return new Response("Not Found", { status: 404 });
    },
};
