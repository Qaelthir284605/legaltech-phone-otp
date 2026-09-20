import { z } from "zod";
import { infrai, InfraiError } from "./infrai_client.js";

export const intakeSchema = z.object({ phone: z.string().min(7), code: z.string().regex(/^\d{4,8}$/), matterTitle: z.string().min(1), deadline: z.string().datetime() });
export type Intake = z.infer<typeof intakeSchema>;

export async function handleMatterIntake(input: unknown) {
  const intake = intakeSchema.parse(input);
  await infrai.auth.phone.send_code({ phone: intake.phone, purpose: "matter_login", locale: "en-US" });
  const identity = await infrai.auth.phone.verify({ phone: intake.phone, code: intake.code, login: true });
  const followUp = new Date(intake.deadline);
  followUp.setDate(followUp.getDate() - 2);
  return { matter: { title: intake.matterTitle, owner: identity.user_id ?? "verified-user", deadline: intake.deadline }, followUpAt: followUp.toISOString() };
}

async function main() {
  const raw = process.env.MATTER_INTAKE_JSON;
  if (!raw) throw new Error("Set MATTER_INTAKE_JSON to a JSON request body");
  try { console.log(JSON.stringify(await handleMatterIntake(JSON.parse(raw)), null, 2)); }
  catch (error) { if (error instanceof InfraiError) { console.error(JSON.stringify({ ok: false, error: error.detail })); process.exitCode = error.status >= 400 && error.status < 500 ? 2 : 1; } else throw error; }
}
if (import.meta.url === `file://${process.argv[1]}`) void main();
