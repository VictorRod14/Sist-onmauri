"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

type Props = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, subtitle, right, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar />

        <div className="flex-1">
          {/* Topbar */}
          <div className="sticky top-0 z-40 -mx-4 mb-6 px-4 pt-2">
            <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur shadow-md">
              <div className="px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    {title && (
                      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        {title}
                      </h1>
                    )}

                    {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
                  </div>

                  {right && <div className="shrink-0">{right}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
