"use client";

import { ReactNode } from "react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import PortalDashboardLayout from "@/components/portal/layout/PortalDashboardLayout";

interface PortalProvidersProps {
    children: ReactNode;
    session: Session | null;
}

export function PortalProviders({ children, session }: PortalProvidersProps) {
    return (
        <SessionProvider session={session}>
            <ThemeProvider defaultTheme="light" enableSystem>
                <QueryProvider>
                    <PortalDashboardLayout>
                        {children}
                    </PortalDashboardLayout>
                </QueryProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
