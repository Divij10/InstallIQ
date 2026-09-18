import type { Metadata } from "next"; import "./globals.css";
export const metadata: Metadata = { title:"InstallIQ | Pre-Site Intelligence", description:"Trusted digital site intelligence before an engineer gets in the truck." };
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
