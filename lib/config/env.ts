import { z } from "zod";
import { loadEnvConfig } from "@next/env";

// Next loads .env.local for the app; CLI verification scripts must explicitly do the same.
loadEnvConfig(process.cwd());
const optionalSecret = z.string().trim().min(1).optional().or(z.literal(""));
const envSchema = z.object({ INSTALLIQ_DATA_MODE: z.enum(["local", "hosted"]).default("hosted"), PRECISELY_MCP_URL: z.string().url().optional(), PRECISELY_API_KEY:optionalSecret,PRECISELY_API_SECRET:optionalSecret, GOOGLE_MAPS_API_KEY: optionalSecret, OPENAI_API_KEY: optionalSecret, OPENAI_MODEL: z.string().trim().min(1).default("gpt-5"), NREL_API_KEY: optionalSecret, EV_STATION_SEARCH_RADIUS_MILES: z.coerce.number().positive().max(100).default(5), SERVICE_BASE_LATITUDE: z.coerce.number().default(33.4484), SERVICE_BASE_LONGITUDE: z.coerce.number().default(-112.074), SERVICE_RADIUS_MILES: z.coerce.number().positive().default(35) });
export const env = envSchema.parse({ INSTALLIQ_DATA_MODE: process.env.INSTALLIQ_DATA_MODE, PRECISELY_MCP_URL: process.env.PRECISELY_MCP_URL,PRECISELY_API_KEY:process.env.PRECISELY_API_KEY,PRECISELY_API_SECRET:process.env.PRECISELY_API_SECRET,GOOGLE_MAPS_API_KEY:process.env.GOOGLE_MAPS_API_KEY,OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,NREL_API_KEY:process.env.NREL_API_KEY,EV_STATION_SEARCH_RADIUS_MILES:process.env.EV_STATION_SEARCH_RADIUS_MILES, SERVICE_BASE_LATITUDE: process.env.SERVICE_BASE_LATITUDE, SERVICE_BASE_LONGITUDE: process.env.SERVICE_BASE_LONGITUDE, SERVICE_RADIUS_MILES: process.env.SERVICE_RADIUS_MILES });
