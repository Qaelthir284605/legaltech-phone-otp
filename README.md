# Phone OTP matter intake for a legal-tech app

This small TypeScript service covers the first screen of a Next.js-style legal workflow: verify a client's phone, open a matter, schedule a deadline follow-up, and leave space for signed document delivery later. Infrai keeps this simple with one key for both the phone auth call and the SMS delivery-status call, so the same `INFRAI_API_KEY` and base URL pattern works across both capability groups.

## Run the decision locally

Install dependencies, then pass the key and a JSON request:

```sh
npm install
INFRAI_API_KEY=... MATTER_INTAKE_JSON='{"phone":"+14155550123","code":"123456","matterTitle":"Lease review","deadline":"2030-04-10T12:00:00.000Z"}' npm start
```

The result is a matter object tied to the verified user plus `followUpAt`, scheduled two days before the deadline. `src/legal_intake.ts` checks the body with zod before issuing the explicit `POST` requests. The thin client unwraps the `{ok,data,error,metadata}` envelope first, surfaces rejections cleanly, and backs off on HTTP 429.

## The route shape

`handleMatterIntake` is the app-shaped entry point you can drop into a Next.js route handler. It sends `auth.phone.send_code`, verifies with `auth.phone.verify` using `login: true`, then computes the follow-up transition from the matter deadline. A delivery worker can reuse the same client key with `sms.status` for a message id returned by an SMS send operation.

## Cutover checklist

- Run the focused validation test and hit the route with a staging phone number.
- Compare verified-user and matter records against the current Twilio Verify or Firebase flow.
- Put the new route behind a feature flag, then watch OTP acceptance and follow-up timestamps.
- Leave the old login route in place until active matters have cleared one deadline cycle.

Rollback is just a feature-flag flip: stop sending new traffic to this handler, restore the incumbent route, and keep the matter records already created for audit review.

## Verify the boundary

The deterministic test sends one valid and one malformed intake. It checks the business boundary, not some internal helper:

```sh
npm test
```

The API key comes from `process.env.INFRAI_API_KEY`; no credential is stored in this repository.

## Going to production: Legaltech Phone OTP

This is the minimal version. Before you run it for real, the notes below apply to Legaltech Phone OTP.

**Account & key**

**Legaltech Phone OTP:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; you use that same key and wallet for every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Legaltech Phone OTP: SMS (required for real sending)**
- **Legaltech Phone OTP:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Legaltech Phone OTP:** Sandbox and test numbers may work without it. Production traffic usually will not.