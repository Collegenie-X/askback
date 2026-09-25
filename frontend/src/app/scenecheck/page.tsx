import LadderScene from "@/components/about/LadderScene";
import { ladder, levelOf } from "@/components/about/ladder";
import "@/components/askback.css";
import "@/components/about/about.css";

export default function SceneCheck() {
  return (
    <div className="about" style={{ background: "#08080f", padding: 20 }}>
      {ladder.steps.map((s, n) => (
        <div key={s.no} style={{ maxWidth: 700, margin: "0 auto 18px" }}>
          <p style={{ color: levelOf(s).color, fontSize: 13, fontWeight: 700 }}>{s.no} {s.title}</p>
          <div style={{ border: `1px solid ${levelOf(s).color}44`, borderRadius: 14, background: "#05050c", padding: 10 }}>
            <LadderScene n={n} color={levelOf(s).color} />
          </div>
        </div>
      ))}
    </div>
  );
}
