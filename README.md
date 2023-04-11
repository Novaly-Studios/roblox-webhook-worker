# Roblox Webhook Worker

This is a simple Cloudflare Worker that can be used to handle Roblox webhook requests.

> **Warning**: The GDPR removal feature hasn't been fully tested. Please report any issues you find.

# Setup

## Prerequisites

- A Cloudflare account
- Cloudflare Wrangler installed
- A little bit of coding to adapt the worker to your needs (telling it where to delete data)

## Setting up Cloudflare and Wrangler

This is optional if you already have these setup.

You will need to create an account with [Cloudflare](https://cloudflare.com) and then login to Wrangler using the `wrangler login` command.

```bash
$ wrangler login
```

## Generate your copy of the worker

Given you have Wrangler installed, you can now generate your own copy of the worker.

```bash
$ wrangler generate roblox-webhook-worker https://github.com/Novaly-Studios/roblox-webhook-worker
```

## Defining Secrets

You need to provide two secrets to the worker:
- `WEBHOOK_SECRET` - The secret you set in the Roblox webhook settings
- `OPEN_CLOUD_API_KEY` - An API key for OpenCloud that has permissions to delete player data

You can set these secrets using the `wrangler secret` command.

```bash
$ wrangler secret put WEBHOOK_SECRET
$ wrangler secret put OPEN_CLOUD_API_KEY
```

## Editing the worker

You will need to modify the worker to tell it where player data is stored so it can be deleted.

You can find this in `src/index.ts` under the `deletePlayerData` function.

You will need to modify the `deletePlayerData` function to delete the data from your own data store.

## Deploying the worker

You can now deploy the worker to your Cloudflare account. This should output a link for you to access the worker from.

```bash
$ wrangler publish
```

## Making sure it's setup correctly

See if you've missed anything by checking the `/status` endpoint of your worker. This should tell you if you're missing any secrets.

`https://roblox-webhook-worker.<your-worker-account>.workers.dev/status`

## Configuring the Roblox webhook

You can now configure the Roblox webhook to use your worker. You will need to provide the URL of your worker and the secret you defined earlier.

Your webhook URL should be: `https://roblox-webhook-worker.<your-worker-account>.workers.dev`

# Supported Event Types

- SampleNotification
Roblox sends this when testing the webhook.

- RightToErasureRequest
Roblox sends this when a user requests to have their data deleted. You must provide an
OpenCloud API key that has permissions to delete player data. Permissions should be
given on every experience you expect to receive this event for.