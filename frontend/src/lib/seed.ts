// 샘플 데이터 — 설계서 §7.6의 '민준의 타임라인'을 리포트 7장으로 옮긴 것. 리포트 화면을 바로 볼 수 있게 한다.
import type { Mission, Note, WindowReport } from "./types";

const DAY = 86400000;
const mission = (key: string, text: string, basis: string, type: Mission["check"]["type"], ckey: string, target: number): Mission => ({ key, text, basis, check: { type, key: ckey, target }, editedByStudent: false });

export function seedReports(now: number): WindowReport[] {
  const rows: [number, number[], number[], number[], [string, string, number | null][], string?][] = [
    // daysAgo, mix[O1..O5], roles[t,c,e,a,enc], six, elements, best
    [24, [5, 3, 0, 0, 2], [5, 3, 0, 0, 2], [2, 3, 1, 0, 0, 0], [], "아두이노로 스마트 화분 코드 짜줘"],
    [20, [4, 4, 1, 0, 1], [4, 4, 1, 0, 1], [3, 4, 2, 0, 1, 0], [["E1", "F1", 1], ["E6", "F1", 0]]],
    [16, [4, 5, 0, 0, 1], [4, 5, 0, 0, 1], [4, 5, 2, 1, 1, 0], [["E5", "F1", 0], ["E7", "F1", 1]]],
    [12, [4, 5, 0, 0, 1], [4, 5, 0, 0, 1], [5, 6, 3, 1, 1, 0], [["E1", "F1", 1], ["E6", "F1", 0], ["E3", "F1", 0]]],
    [6, [2, 7, 1, 0, 0], [2, 7, 1, 0, 0], [6, 7, 4, 1, 2, 0], [["E1", "F2", 1], ["E3", "F1", 1], ["E6", "F1", 0]]],
    [3, [3, 6, 1, 0, 0], [3, 6, 1, 0, 0], [7, 8, 5, 2, 2, 1], [["E1", "F2", 2], ["E5", "F2", 1], ["E3", "F2", 1], ["E6", "F1", 0]]],
    [0, [2, 4, 1, 3, 0], [2, 4, 1, 3, 0], [8, 9, 6, 2, 3, 1], [["E1", "F2", 3], ["E3", "F3", 2], ["E5", "F3", 1], ["E6", "F1", 0], ["E4", "F1", null]], "센서를 화분 가장자리에 꽂았는데, 가운데랑 값이 다를까? 다르다면 어느 쪽이 '진짜'야?"],
  ];
  const criteria = mission("criteria", "새 기능을 만들기 전에 \"잘 됐다는 건 ___로 알 수 있다\" 한 줄을 질문에 넣어보기.", "'기준'이 세 판 연속으로 가장 비어 있고, 돌아보기에서도 ⚪였어.", "six", "criteria", 2);
  const alt = mission("O4", "10번 중 2번은 \"말고 다른 방법은?\"으로 물어보기.", "대안을 물은 질문(O4)이 0번이었어.", "openness", "O4", 2);
  const results: ("done" | "partial" | "missed")[] = ["missed", "done", "partial", "done", "partial", "done"];

  return rows.map(([ago, mix, rl, six, els, best], i) => {
    const at = now - ago * DAY;
    const n0 = i * 10 + 1;
    return {
      index: i + 1,
      createdAt: at,
      from: at - 2 * DAY,
      to: at,
      turnRange: [n0, n0 + 9],
      projects: ["스마트 화분"],
      stage: "구현",
      mix: { O1: mix[0], O2: mix[1], O3: mix[2], O4: mix[3], O5: mix[4], NA: 0 },
      roles: { typist: rl[0], coder: rl[1], engineer: rl[2], architect: rl[3], encyclopedia: rl[4] },
      six: { why: six[0], context: six[1], constraint: six[2], criteria: six[3], verify: six[4], discard: six[5] },
      elements: els.map(([element, form, score]) => ({ element, form: form as "F1", score, hintStage: score === 1 ? 1 : 0, status: score === null ? "later" : "answered" })),
      stuck: i >= 3 ? [{ concept: "millis", countInWindow: 2, countTotal: (i - 2) * 2 + 1 }] : [],
      lastMission: i === 0 ? null : { text: (i === 6 ? alt : criteria).text, result: results[i - 1], detail: results[i - 1] === "done" ? (i === 6 ? "3번 해냈어. 그중 한 번은 센서 위치를 바꾸는 계기가 됐고. ✅" : "2번 해냈어. ✅") : results[i - 1] === "partial" ? "1번 해봤어. ➖" : "이번 판엔 못 했어. 더 작게 쪼개 볼게." },
      mixComment: i === 0 ? "여기가 출발점이야." : i === 6 ? "구현 중인데도 대안을 세 번 물었어. 지금은 그게 도움이 됐던 것 같아 — 센서 위치가 바뀌었으니까." : `열린 질문(O3+O4)은 ${mix[2] + mix[3]}번이었어.`,
      best: best ? { turnN: n0 + 5, text: best, reason: i === 6 ? "코드가 아니라 '무엇을 재고 있는가'를 물었어. 이 판에서 유일하게 프로젝트의 방향을 바꾼 질문이야." : "여기서 모든 게 시작됐어." } : null,
      nextMission: i === 5 ? alt : criteria,
      opened: i < 6,
      seed: true,
    } satisfies WindowReport;
  });
}

export function seedNotes(now: number, projectId: string): Note[] {
  return [{ id: "note_seed", projectId, lens: "psychology", level: 0, question: "그 사람은 지금 왜 그걸 안 하고 있을까?", text: "나는 얼마나 줄지 몰라서였어. 까먹은 게 아니라.", createdAt: now - DAY }];
}
