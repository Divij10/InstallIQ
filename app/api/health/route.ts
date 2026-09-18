import { NextResponse } from "next/server"; import { env } from "@/lib/config/env";
export const GET=()=>NextResponse.json({status:"ok",service:"InstallIQ",mode:env.INSTALLIQ_DATA_MODE});
