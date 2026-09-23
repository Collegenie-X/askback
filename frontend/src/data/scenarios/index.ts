// 시연 시나리오 목록. 새 예시는 JSON 한 장을 만들어 여기에 한 줄 보태면 /demo 에 나타난다.
import type { Scenario } from "@/components/demo/types";
import common from "./common.json";
import smartpot from "./smartpot.json";
import safeRoute from "./safe-route.json";
import turtleNeck from "./turtle-neck.json";
import petDiary from "./pet-diary.json";

const build = (s: unknown) => ({ ...common, ...(s as object) }) as unknown as Scenario;

export const scenarios: Scenario[] = [smartpot, turtleNeck, petDiary, safeRoute].map(build);
