// 틴스파크AI REST API — Express 앱 하나를 Cloud Function 하나(api)로 올린다.
import cors from "cors";
import express, { Router } from "express";
import { askHandler, projectsRouter } from "./coach/projects";
import { isEmulator } from "./lib/firebase";
import { ApiError, errorHandler, ok } from "./lib/http";
import { requireRole, requireUser } from "./lib/users";
import { getLlmSettings } from "./llm/settings";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { llmRouter } from "./routes/llm";
import { guardianRouter, useMailKey } from "./routes/guardian";
import { meRouter } from "./routes/me";

function corsOrigins(): cors.CorsOptions["origin"] {
  const list = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes("*") ? true : list;
}

export function createApp(getKey: () => string | undefined, getMailKey: () => string | undefined = () => undefined) {
  useMailKey(getMailKey);
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigins(), allowedHeaders: ["Authorization", "Content-Type"], maxAge: 600 }));
  app.use(express.json({ limit: "8mb" }));

  const v1 = Router();

  v1.get("/health", async (_req, res) => {
    const s = await getLlmSettings();
    ok(res, {
      ok: true,
      service: "teenspark-api",
      emulator: isEmulator(),
      llm: { enabled: s.enabled, apiKeyConfigured: Boolean(getKey()), model: s.tasks.answer.model, effort: s.tasks.answer.effort, fallbackToLocal: s.fallbackToLocal },
    });
  });

  v1.use("/auth", authRouter);
  v1.use("/guardian", guardianRouter); // 보호자가 메일 링크로 여는 공개 주소 — 토큰이 곧 권한
  v1.use("/me", requireUser, meRouter);
  v1.use("/projects", requireUser, projectsRouter(getKey));
  v1.post("/ask", requireUser, askHandler(getKey));
  v1.post("/ask/stream", requireUser, askHandler(getKey, true));
  v1.use("/llm", requireUser, llmRouter(getKey)); // 브라우저 답변 엔진(engine.ts)이 Claude 한 번만 빌려 쓰는 길 — 키는 서버에만
  v1.use("/admin", requireUser, requireRole("admin"), adminRouter(getKey));

  // 함수 주소(/api/v1/...)로도, Hosting rewrite(/api/** → api)로도 같은 경로가 열린다
  app.use("/v1", v1);
  app.use("/api/v1", v1);
  app.use((req) => {
    throw new ApiError(404, "no_route", `${req.method} ${req.path} 는 없는 주소예요.`);
  });
  app.use(errorHandler);
  return app;
}
