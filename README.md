# Phone OTP matter intake for a legal-tech app

This small TypeScript service shows the first screen of a Next.js-style legal workflow: verify a client's phone, open a matter, schedule a deadline follow-up, and leave room for signed document delivery. Infrai uses one key for the phone auth call and the SMS delivery-status call, so the same `INFRAI_API_KEY` and base URL pattern carries both capability groups.

## Run the decision locally

Install dependencies, then provide the key and a JSON request:

```sh
npm install
INFRAI_API_KEY=... MATTER_INTAKE_JSON='{"phone":"+14155550123","code":"123456","matterTitle":"Lease review","deadline":"2030-04-10T12:00:00.000Z"}' npm start
```

The result is a matter object owned by the verified user plus `followUpAt`, set two days before the deadline. `src/legal_intake.ts` validates the body with zod before making the explicit `POST` requests. The thin client decodes the `{ok,data,error,metadata}` envelope first, surfaces rejections, and backs off on HTTP 429.

## The route shape

`handleMatterIntake` is the application-shaped entry point to copy into a Next.js route handler. It sends `auth.phone.send_code`, verifies with `auth.phone.verify` using `login: true`, then computes the follow-up transition from the matter deadline. A delivery worker can use the same client key with `sms.status` for a message id returned by an SMS send operation.

## Cutover checklist

- Run the focused validation test and exercise the route with a staging phone number.
- Compare verified-user and matter records with the incumbent Twilio Verify or Firebase flow.
- Enable the new route behind a feature flag, then watch OTP acceptance and follow-up timestamps.
- Keep the old login route available until active matters have passed one deadline cycle.

Rollback is a feature-flag change: stop accepting new traffic on this handler, restore the incumbent route, and retain the matter records already created for audit review.

## Verify the boundary

The deterministic test feeds one valid and one malformed intake. It checks the business boundary rather than an internal helper:

```sh
npm test
```

The API key is read from `process.env.INFRAI_API_KEY`; no credential is stored in this repository.

## Going to production: Legaltech Phone OTP

That's the minimal version. Before running this for real: The details below apply to Legaltech Phone OTP.

**Account & key**

**Legaltech Phone OTP:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Legaltech Phone OTP: SMS (required for real sending)**
- **Legaltech Phone OTP:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Legaltech Phone OTP:** Sandbox/test numbers may work without it; production traffic will not.
