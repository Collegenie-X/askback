"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./askback.css";
import { loadExample } from "@/lib/example";
import { scenarios } from "@/data/scenarios";
import { read, update, useTable, write } from "@/lib/db";
import { parseRoute, routeToPath } from "@/lib/route";
import { useAccount } from "@/lib/account";
import { startSync, syncAccount } from "@/lib/sync";
import { AppCtx, type View } from "./AppContext";
import Chat from "./Chat";
import ConfirmDialog, { type ConfirmOptions } from "./ConfirmDialog";
import type { Scenario } from "./demo/types";
import Drawer from "./Drawer";
import ExamplePicker from "./ExamplePicker";
import IdeaLab from "./IdeaLab";
import LoginDialog from "./LoginDialog";
import MdViewer, { type MdDoc } from "./MdViewer";
import MonthlyView from "./MonthlyView";
import Onboarding from "./Onboarding";
import { Library, NotesView, Settings } from "./Pages";
import ProjectSheet from "./ProjectSheet";
import ReportsView from "./ReportsView";
import ReportView from "./ReportView";
import { Starfield } from "./Space";
import SpaceStudio from "./SpaceStudio";
import Splash from "./Splash";
import Welcome from "./Welcome";

export default function App() {
  const profile = useTable("profile");
  const projects = useTable("projects");
  const state = useTable("state");
  const [splash, setSplash] = useState(true);
  const space = useTable("space");
  const [view, setView] = useState<View>({ name: "chat" });
  const [drawer, setDrawer] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [doc, setDoc] = useState<MdDoc | null>(null);
  const [examples, setExamples] = useState(false);
  const [login, setLogin] = useState(false); // 로그인 팝업
  const [reportIndex, setReportIndex] = useState<number | null>(null); // 리포트 팝업 — 닫으면 보던 자리로 돌아온다

  const [routed, setRouted] = useState(false); // 주소를 한 번 읽고 나서야 주소를 고쳐 쓴다

  const [ask, setAsk] = useState<(ConfirmOptions & { resolve: (yes: boolean) => void }) | null>(null);

  // 주소 → 화면. 처음 들어올 때와 뒤로 가기(popstate) 때 주소를 읽어 화면을 맞춘다.
  useEffect(() => {
    const apply = () => {
      const r = parseRoute(window.location.pathname, window.location.search);
      const id = r.projectId ?? (r.exampleId ? `prj_example_${r.exampleId}` : null);
      if (id) {
        // 예시 링크(/p/prj_example_… 또는 /x/…)는 받는 사람 기기에 없어도 시나리오에서 바로 펼친다
        const s = scenarios.find((x) => `prj_example_${x.id}` === id);
        if (read("projects").some((p) => p.id === id)) update("state", (st) => ({ ...st, currentProjectId: id }));
        else if (s) { loadExample(s); write("introSeen", true); }
        setView({ name: "chat" });
      } else setView(r.view);
      if (window.location.pathname === "/account") setLogin(true); // 예전 /account 링크 — 팝업으로 연다
      setReportIndex(r.reportIndex);
      setRouted(true);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  // 로그인하면 질문 · 답 · 되묻기를 회원별 DB(Firestore)에도 올린다 — 바뀐 것만, 2초 모아서
  useEffect(() => startSync(), []);
  // 기록 주인 = 가입까지 마친 계정. 바뀌면 앞 사람 기록을 치우고, 내 기록을 서버에서 내려받아 합친다
  const account = useAccount();
  const memberId = account.status === "signedIn" ? account.user.uid : null;
  useEffect(() => void syncAccount(memberId, account.status !== "loading"), [memberId, account.status]);

  const hideSplash = useCallback(() => setSplash(false), []);
  const closeLogin = useCallback(() => setLogin(false), []);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setAsk({ ...o, resolve })), []);
  const answer = useCallback((yes: boolean) => setAsk((a) => { a?.resolve(yes); return null; }), []);
  const ctx = useMemo(() => ({ view, go: setView, openMd: setDoc, openReport: setReportIndex, openDrawer: () => setDrawer(true), openLogin: () => setLogin(true), confirm }), [view, confirm]);
  const project = projects.find((p) => p.id === state.currentProjectId) ?? projects[0];

  // 화면 → 주소. 지금 보는 화면이 곧 링크가 된다 (새로고침·공유해도 같은 자리).
  useEffect(() => {
    if (!routed) return;
    const path = routeToPath(view, view.name === "chat" ? project?.id ?? null : null, reportIndex);
    if (path !== window.location.pathname + window.location.search) window.history.pushState(null, "", path);
  }, [routed, view, project?.id, reportIndex]);

  // 예전 형식으로 저장된 예시(가짜 앞 리포트가 끼어 "7번째"로 보이던 것)는 지금 형식으로 다시 불러온다
  useEffect(() => {
    const id = state.demoProjectId;
    const s = scenarios.find((x) => `prj_example_${x.id}` === id);
    if (!id || !s) return;
    const stale = read("reports").some((r) => !r.projectId || (!r.seed && !r.headline));
    const grown = read("turns").filter((t) => t.projectId === id).length < s.turns.length; // 예시 JSON에 질문이 늘었다
    if (!stale && !grown) return;
    const seen = read("introSeen");
    loadExample(s);
    write("introSeen", seen);
  }, [state.demoProjectId]);

  // 처음 온 사람은 소개 페이지(/about)부터 본다 — 소개의 "시작" 버튼이 다시 / 로 데려온다.
  // 공유된 예시 링크로 들어온 경우는 위에서 introSeen 이 먼저 켜지므로 바로 그 화면을 연다.
  useEffect(() => {
    if (!read("profile")) write("profile", { name: "친구", grade: "중3", interests: [], createdAt: Date.now() });
    if (!read("introSeen")) {
      write("introSeen", true);
      if (window.location.pathname === "/") window.location.replace("/about");
    }
  }, []);

  const runDemo = () => setExamples(true);
  const pickExample = async (s: Scenario) => {
    const mine = profile && state.demoProjectId === null; // 예시끼리 바꿀 때는 묻지 않는다
    if (mine && !(await confirm({ emoji: s.card.emoji, title: `'${s.card.title}' 예시를 열까?`, body: `지금 기록이 지워지고 '${s.student.name}'의 데이터로 바뀌어.`, ok: "예시 열기", danger: true }))) return;
    loadExample(s);
    setExamples(false);
    write("introSeen", true);
    setView({ name: "chat" });
  };

  let body;
  if (splash) body = <Splash onDone={hideSplash} />;
  else if (view.name === "idea") body = <IdeaLab />;
  else if (view.name === "onboarding") body = <Onboarding hasProfile onDone={() => setView({ name: "chat" })} onDemo={runDemo} />; // 언제든 다시 보는 소개
  else if (!project) body = <Welcome onNewProject={() => setNewProject(true)} onDemo={runDemo} />; // 프로젝트가 없을 때: 바로 템플릿 고르기 (사용 설명서는 원할 때만 연다)
  else if (view.name === "reports") body = <ReportsView />;
  else if (view.name === "monthly") body = <MonthlyView key={view.ym} ym={view.ym} />;
  else if (view.name === "notes") body = <NotesView />;
  else if (view.name === "library") body = <Library />;
  else if (view.name === "space") body = <SpaceStudio />;
  else if (view.name === "settings") body = <Settings onDemo={runDemo} />;
  else body = <Chat key={project.id} project={project} />;

  const docked = !splash && !!project && view.name !== "onboarding"; // 사용 설명서·소개·스플래시에는 메뉴가 없다

  return (
    <AppCtx.Provider value={ctx}>
      <main className={`phone ${docked ? "docked" : ""}`}>
        {/* PC: 왼쪽 메뉴 + 오른쪽 상세. 모바일: 상세만 보이고 메뉴는 햄버거 서랍으로 연다 */}
        {docked && <Drawer docked onClose={() => {}} onNewProject={() => setNewProject(true)} onExample={pickExample} />}
        <section className="stage">
          <Starfield prefs={space} />
          {body}
          {drawer && <Drawer onClose={() => setDrawer(false)} onNewProject={() => { setDrawer(false); setNewProject(true); }} onExample={(s) => { setDrawer(false); pickExample(s); }} />}
          {newProject && <ProjectSheet onClose={() => setNewProject(false)} onCreated={() => { setNewProject(false); setView({ name: "chat" }); }} />}
          {examples && <ExamplePicker onPick={pickExample} onClose={() => setExamples(false)} />}
          {reportIndex !== null && <ReportView key={reportIndex} index={reportIndex} onClose={() => setReportIndex(null)} />}
          {doc && <MdViewer key={doc.title} doc={doc} onClose={() => setDoc(null)} />}
          {login && !splash && <LoginDialog onClose={closeLogin} />}
          {ask && <ConfirmDialog {...ask} onDone={answer} />}
        </section>
      </main>
    </AppCtx.Provider>
  );
}
