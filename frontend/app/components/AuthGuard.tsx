"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // rotas públicas
    const publicRoutes = ["/login"];

    if (!token && !publicRoutes.includes(pathname)) {
      router.replace("/login");
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  // evita flicker de tela
  if (!checked) return null;

  return <>{children}</>;
}