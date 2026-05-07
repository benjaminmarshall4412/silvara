import { stripeWebhookPost } from "@/lib/stripe/webhook-route";

export async function POST(request: Request) {
  return stripeWebhookPost(request, "us");
}
