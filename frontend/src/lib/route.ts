// 주소(URL) ↔ 화면(View) 변환. 주소로 화면이 정해지므로 링크를 그대로 공유할 수 있다.
//
//   /                     지금 프로젝트의 대화
//   /p/<프로젝트id>        그 프로젝트의 대화
//   /x/<예시id>            예시 프로젝트 (친구에게 보내는 링크)
//   /reports              리포트 목록        /reports/<2026-09>  달마다 보기
//   /notes /library /space /settings /idea /intro
//   ?r=<번호>              리포트 팝업 — 보던 화면 위에 겹쳐 열린다
import type { View } from "@/components/AppContext";

export interface Route {
  view: View;
  projectId: string | null; // /p/<id> 로 들어온 경우
  exampleId: string | null; // /x/<id> 로 들어온 경우
  reportIndex: number | null; // ?r=<번호>
}

const SIMPLE: Record<string, View["name"]> = {
  reports: "reports",
  notes: "notes",
  library: "library",
  space: "space",
  settings: "settings",
  idea: "idea",
  intro: "onboarding",
};

export function parseRoute(pathname: string, search = ""): Route {
  const seg = pathname.split("/").filter(Boolean);
  const r = Number(new URLSearchParams(search).get("r"));
  const out: Route = { view: { name: "chat" }, projectId: null, exampleId: null, reportIndex: Number.isFinite(r) && r > 0 ? r : null };

  if (seg[0] === "p" && seg[1]) out.projectId = decodeURIComponent(seg[1]);
  else if (seg[0] === "x" && seg[1]) out.exampleId = decodeURIComponent(seg[1]);
  else if (seg[0] === "reports" && seg[1]) out.view = { name: "monthly", ym: seg[1] };
  else if (seg[0] && SIMPLE[seg[0]]) out.view = { name: SIMPLE[seg[0]] } as View;

  return out;
}

export function routeToPath(view: View, projectId: string | null, reportIndex: number | null): string {
  let path = "/";
  if (view.name === "chat") path = projectId ? `/p/${encodeURIComponent(projectId)}` : "/";
  else if (view.name === "monthly") path = `/reports/${view.ym}`;
  else {
    const key = Object.keys(SIMPLE).find((k) => SIMPLE[k] === view.name);
    path = key ? `/${key}` : "/";
  }
  return reportIndex ? `${path}?r=${reportIndex}` : path;
}
