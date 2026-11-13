// app/actions/newsletter.ts
"use server";

import { z } from "zod";
import connectDB from "@/lib/db";
import Subscriber from "@/lib/models/Subscriber";

const subscribeSchema = z.object({
  email: z.string().email(),
});

type NewsletterResponse = 
  | { success: true; message: string; error?: never }
  | { success: false; error: string; message?: never };

export async function subscribeNewsletterAction(rawData: { email: string }): Promise<NewsletterResponse> {
  try {
    const parsed = subscribeSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: "InvalidEmail" }; // Pass a code to handle on client
    }

    const { email } = parsed.data;

    await connectDB();

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return { success: true, message: "AlreadySubscribed" };
    }

    await Subscriber.create({ email });

    return { success: true, message: "Success" };
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return { success: false, error: "ServerError" };
  }
}