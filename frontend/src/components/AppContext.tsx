"use client";

import { createContext, useContext } from "react";
import type { ConfirmOptions } from "./ConfirmDialog";
import type { MdDoc } from "./MdViewer";

export type View =
  | { name: "chat" }
  | { name: "idea" }
  | { name: "onboarding" }
  | { name: "reports" }
  | { name: "monthly"; ym: string }
  | { name: "notes" }
  | { name: "library" }
  | { name: "settings" }
  | { name: "space" };

interface Ctx {
  view: View;
  go: (v: View) => void;
  openMd: (doc: MdDoc) => void;
  openReport: (index: number) => void; // 리포트 자세히 — 화면을 떠나지 않고 팝업으로 연다
  openDrawer: () => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>; // 앱 안 확인 창 — window.confirm 대신
}

export const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("AppCtx missing");
  return ctx;
}
