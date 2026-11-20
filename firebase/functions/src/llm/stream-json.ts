// 구조화 출력(JSON)이 흘러 들어오는 동안 "answer_md" 문자열 값만 골라서 바로바로 풀어낸다.
// 답 JSON 은 { openness, six, stage, concepts, emotional, answer_md, … } 순서라
// 앞 칸은 짧고, answer_md 가 시작되면 그때부터 글자가 학생 화면으로 흘러간다.
export class JsonStringFieldStream {
  private buf = "";
  private pos = -1; // answer_md 값 안에서 다음에 읽을 위치 (-1 이면 아직 못 찾음)
  private done = false;

  constructor(private readonly field: string) {}

  /** 새로 들어온 조각을 넣으면, 이번에 새로 풀린 글자를 돌려준다 */
  push(chunk: string): string {
    if (this.done) return "";
    this.buf += chunk;
    if (this.pos < 0) {
      const m = new RegExp(`"${this.field}"\\s*:\\s*"`).exec(this.buf);
      if (!m) return "";
      this.pos = m.index + m[0].length;
    }
    let out = "";
    while (this.pos < this.buf.length) {
      const c = this.buf[this.pos];
      if (c === '"') {
        this.done = true;
        break;
      }
      if (c !== "\\") {
        out += c;
        this.pos++;
        continue;
      }
      // 이스케이프 — 끝까지 안 들어왔으면 다음 조각을 기다린다
      const n = this.buf[this.pos + 1];
      if (n === undefined) break;
      if (n === "u") {
        const hex = this.buf.slice(this.pos + 2, this.pos + 6);
        if (hex.length < 4) break;
        out += String.fromCharCode(parseInt(hex, 16)); // 서로게이트 쌍도 두 번에 나뉘어 이어 붙는다
        this.pos += 6;
        continue;
      }
      out += ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\", "/": "/" } as Record<string, string>)[n] ?? n;
      this.pos += 2;
    }
    return out;
  }
}
