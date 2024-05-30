"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const client = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default Providers;
