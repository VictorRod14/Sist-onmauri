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
    <div className="min-h-screen bg-[#f3f0eb]">
      <div className="min-h-screen lg:pl-[272px]">
        <Sidebar />

        <div className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
          {/* Topbar */}
          <div className="sticky top-0 z-40 mb-6 pt-1">
            <div className="premium-topbar">
              <div className="px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    {title && (
                      <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#171512]">
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
