"use client";

import { useCallback, useMemo, useState } from "react";
import "./askback.css";
import { loadExample } from "@/lib/example";
import { useTable, write } from "@/lib/db";
import { AppCtx, type View } from "./AppContext";
import Chat from "./Chat";
import type { Scenario } from "./demo/types";
import Drawer from "./Drawer";
import ExamplePicker from "./ExamplePicker";
import IdeaLab from "./IdeaLab";
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

export default function App() {
  const profile = useTable("profile");
  const projects = useTable("projects");
  const state = useTable("state");
  const [splash, setSplash] = useState(true);
  const introSeen = useTable("introSeen"); // 온보딩 소개는 한 번만
  const space = useTable("space");
  const [view, setView] = useState<View>({ name: "chat" });
  const [drawer, setDrawer] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [doc, setDoc] = useState<MdDoc | null>(null);
  const [examples, setExamples] = useState(false);
  const [reportIndex, setReportIndex] = useState<number | null>(null); // 리포트 팝업 — 닫으면 보던 자리로 돌아온다

  const hideSplash = useCallback(() => setSplash(false), []);
  const ctx = useMemo(() => ({ view, go: setView, openMd: setDoc, openReport: setReportIndex, openDrawer: () => setDrawer(true) }), [view]);
  const project = projects.find((p) => p.id === state.currentProjectId) ?? projects[0];

  const runDemo = () => setExamples(true);
  const pickExample = (s: Scenario) => {
    const mine = profile && state.demoProjectId === null; // 예시끼리 바꿀 때는 묻지 않는다
    if (mine && !window.confirm(`예시를 열면 지금 기록이 지워지고 '${s.student.name}'의 데이터로 바뀌어. 열까?`)) return;
    loadExample(s);
    setExamples(false);
    write("introSeen", true);
    setView({ name: "chat" });
  };

  let body;
  if (splash) body = <Splash onDone={hideSplash} />;
  else if (view.name === "idea") body = <IdeaLab />;
  else if (!introSeen || !profile || !project) body = <Onboarding hasProfile={!!profile && !!project} onDone={() => { write("introSeen", true); setView({ name: "chat" }); }} onDemo={runDemo} />;
  else if (view.name === "reports") body = <ReportsView />;
  else if (view.name === "monthly") body = <MonthlyView key={view.ym} ym={view.ym} />;
  else if (view.name === "notes") body = <NotesView />;
  else if (view.name === "library") body = <Library />;
  else if (view.name === "space") body = <SpaceStudio />;
  else if (view.name === "settings") body = <Settings onDemo={runDemo} />;
  else body = <Chat key={project.id} project={project} />;

  const docked = !splash && introSeen && !!profile && !!project; // 온보딩·스플래시에는 메뉴가 없다

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
        </section>
      </main>
    </AppCtx.Provider>
  );
}
