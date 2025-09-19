
import { handlers } from "../../../lib/auth";
import type { NextRequest } from "next/server";


export const GET: (req: NextRequest) => Promise<Response> = handlers.GET;
export const POST: (req: NextRequest) => Promise<Response> = handlers.POST;
