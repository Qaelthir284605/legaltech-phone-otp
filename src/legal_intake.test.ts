import { intakeSchema } from "./legal_intake.js";
const valid = intakeSchema.safeParse({ phone: "+14155550123", code: "123456", matterTitle: "Lease review", deadline: "2030-04-10T12:00:00.000Z" });
if (!valid.success) throw new Error("valid intake was rejected");
const invalid = intakeSchema.safeParse({ phone: "+1", code: "abc", matterTitle: "", deadline: "tomorrow" });
if (invalid.success) throw new Error("invalid intake was accepted");
console.log("intake validation decision: valid accepted, malformed rejected");
