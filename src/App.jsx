import { useState, useEffect, useRef } from "react";

function heuristica(t) { return (t.prioridad + t.urgencia) / t.duracion; }
function esMeta(estado, total) { return estado.length === total; }
function sucesores(estado, total) {
  const r = [];
  for (let i = 0; i < total; i++) if (!estado.includes(i)) r.push([...estado, i]);
  return r;
}
function bfs(tareas) {
  const cola = [{ estado: [], nivel: 0 }];
  const visitados = new Set(); const expandidos = [];
  while (cola.length) {
    const { estado, nivel } = cola.shift();
    const key = JSON.stringify(estado);
    if (visitados.has(key)) continue;
    visitados.add(key); expandidos.push({ nivel, estado: [...estado] });
    if (esMeta(estado, tareas.length)) return { plan: estado, expandidos };
    for (const s of sucesores(estado, tareas.length)) cola.push({ estado: s, nivel: nivel + 1 });
  }
}
function greedy(tareas) {
  let pq = [{ h: 0, estado: [], nivel: 0 }];
  const visitados = new Set(); const expandidos = [];
  while (pq.length) {
    pq.sort((a, b) => a.h - b.h);
    const { estado, nivel } = pq.shift();
    const key = JSON.stringify(estado);
    if (visitados.has(key)) continue;
    visitados.add(key); expandidos.push({ nivel, estado: [...estado] });
    if (esMeta(estado, tareas.length)) return { plan: estado, expandidos };
    for (const s of sucesores(estado, tareas.length))
      pq.push({ h: -heuristica(tareas[s[s.length-1]]), estado: s, nivel: nivel+1 });
  }
}
function astar(tareas) {
  let pq = [{ f: 0, g: 0, estado: [], nivel: 0 }];
  const visitados = new Set(); const expandidos = [];
  while (pq.length) {
    pq.sort((a, b) => a.f - b.f);
    const { g, estado, nivel } = pq.shift();
    const key = JSON.stringify(estado);
    if (visitados.has(key)) continue;
    visitados.add(key); expandidos.push({ nivel, estado: [...estado] });
    if (esMeta(estado, tareas.length)) return { plan: estado, expandidos };
    for (const s of sucesores(estado, tareas.length)) {
      const u = s[s.length-1];
      const g2 = g + tareas[u].duracion;
      pq.push({ f: g2 + heuristica(tareas[u]), g: g2, estado: s, nivel: nivel+1 });
    }
  }
}

function buildTree(expandidos, tareas) {
  const nodes = {}; const edges = [];
  expandidos.forEach(({ nivel, estado }) => {
    const id = JSON.stringify(estado);
    const parentId = JSON.stringify(estado.slice(0,-1));
    nodes[id] = { id, label: estado.length===0 ? "Inicio" : tareas[estado[estado.length-1]]?.nombre ?? "?", nivel, estado };
    if (estado.length > 0 && nodes[parentId]) edges.push({ from: parentId, to: id });
  });
  const levelGroups = {};
  Object.values(nodes).forEach(n => { (levelGroups[n.nivel] = levelGroups[n.nivel]||[]).push(n.id); });
  Object.entries(levelGroups).forEach(([lvl, ids]) => {
    const y = 60 + Number(lvl)*110;
    const spacing = 880/(ids.length+1);
    ids.forEach((id,i) => { nodes[id].x = spacing*(i+1); nodes[id].y = y; });
  });
  return { nodes, edges };
}

const ALGO_META = {
  BFS:    { accent:"#38bdf8", glow:"#0ea5e9", bg:"#07111f", text:"#e0f2fe", icono:"⬛",
    tipo:"No informada",
    descripcion:"Explora el árbol nivel por nivel sin considerar ninguna información sobre las tareas. Visita TODOS los nodos de un nivel antes de pasar al siguiente.",
    como:"Usa una cola FIFO. Cada estado se expande en el orden en que fue descubierto. Garantiza encontrar la solución con menos pasos, pero explora muchos nodos innecesarios.",
    diferencia:"No sabe cuál camino es mejor — los prueba todos por igual." },
  Greedy: { accent:"#fb923c", glow:"#f97316", bg:"#1a0c04", text:"#ffedd5", icono:"⚡",
    tipo:"Heurística pura",
    descripcion:"Solo mira qué tan buena parece la siguiente tarea según (prioridad + urgencia) / duración, sin importar el costo acumulado del camino recorrido.",
    como:"Usa una cola de prioridad. En cada paso escoge el sucesor con mayor valor heurístico. Es rápido pero puede tomar malas decisiones al ignorar el costo real.",
    diferencia:"Codicioso: siempre elige lo que parece mejor ahora, aunque no sea óptimo a largo plazo." },
  "A*":   { accent:"#a78bfa", glow:"#8b5cf6", bg:"#0e0918", text:"#ede9fe", icono:"★",
    tipo:"Heurística informada",
    descripcion:"Combina el costo real acumulado (g) con la estimación heurística (h) para calcular f = g + h. Balancea eficiencia y optimalidad.",
    como:"Evalúa cada nodo con f = costo_real + heurística. Expande primero el nodo con menor f, considerando tanto lo que ya costó llegar como el valor de la tarea siguiente.",
    diferencia:"El más balanceado: no es tan ciego como BFS ni tan impulsivo como Greedy." },
};

function AlgoInfo({ name, stats }) {
  const m = ALGO_META[name];
  return (
    <div style={{ background:m.bg, border:`1px solid ${m.accent}33`, borderRadius:14,
      padding:"20px 20px", display:"flex", flexDirection:"column", gap:14,
      boxShadow:`0 0 30px ${m.glow}15` }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{m.icono}</span>
        <div>
          <div style={{ color:m.accent, fontFamily:"'Space Mono',monospace", fontSize:18, fontWeight:700,
            textShadow:`0 0 10px ${m.glow}` }}>{name==="A*"?"A★":name}</div>
          <div style={{ fontSize:11, color:m.accent, opacity:0.6, letterSpacing:1, marginTop:1 }}>{m.tipo}</div>
        </div>
      </div>
      <p style={{ color:m.text, fontSize:12.5, lineHeight:1.7, margin:0, opacity:0.85 }}>{m.descripcion}</p>
      <div style={{ background:`${m.accent}0d`, borderRadius:8, padding:"10px 14px", borderLeft:`3px solid ${m.accent}` }}>
        <div style={{ color:m.accent, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:4 }}>¿CÓMO RECORRE?</div>
        <p style={{ color:m.text, fontSize:12, lineHeight:1.6, margin:0, opacity:0.75 }}>{m.como}</p>
      </div>
      <div style={{ background:"#ffffff06", borderRadius:8, padding:"8px 14px", borderLeft:"3px solid #ffffff22" }}>
        <div style={{ color:"#94a3b8", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:4 }}>DIFERENCIA CLAVE</div>
        <p style={{ color:"#cbd5e1", fontSize:12, lineHeight:1.6, margin:0, fontStyle:"italic" }}>"{m.diferencia}"</p>
      </div>
      {stats && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[
            { label:"Nodos explorados", val:stats.nodos, unit:"" },
            { label:"Tiempo ejecución", val:stats.tiempo, unit:"ms" },
            { label:"Pasos al objetivo", val:stats.pasos, unit:"" },
          ].map(({ label, val, unit }) => (
            <div key={label} style={{ background:`${m.accent}0d`, borderRadius:8, padding:"10px 10px",
              border:`1px solid ${m.accent}22`, textAlign:"center" }}>
              <div style={{ color:m.accent, fontSize:20, fontWeight:700, fontFamily:"'Space Mono',monospace",
                textShadow:`0 0 8px ${m.glow}` }}>{val}{unit}</div>
              <div style={{ color:m.text, fontSize:10, opacity:0.55, marginTop:3, lineHeight:1.3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tabla comparativa ─────────────────────────────────────────────────────────
function TablaComparativa({ resultados }) {
  const algos = Object.keys(resultados);
  // guard: si algún algo no tiene stats todavía, no renderizar
  if (algos.some(n => !resultados[n]?.stats)) return null;

  const metricas = [
    { label:"Nodos explorados", key:"nodos" },
    { label:"Tiempo (ms)",      key:"tiempo" },
    { label:"Pasos al objetivo",key:"pasos" },
    { label:"Heurística",       key:"heur"  },
  ];

  return (
    <div style={{ background:"#0d1117", border:"1px solid #1e2a3a", borderRadius:14,
      padding:"22px 24px", marginBottom:28 }}>
      <div style={{ color:"#475569", fontFamily:"'Space Mono',monospace", fontSize:12,
        fontWeight:700, letterSpacing:2, marginBottom:16 }}>◈ COMPARATIVA DE RESULTADOS</div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Space Mono',monospace", fontSize:12 }}>
        <thead>
          <tr>
            <th style={{ padding:"8px 16px", textAlign:"left", color:"#334155",
              borderBottom:"1px solid #1e2a3a", fontWeight:700 }}>Métrica</th>
            {algos.map(n => (
              <th key={n} style={{ padding:"8px 16px", textAlign:"center",
                color:ALGO_META[n].accent, borderBottom:"1px solid #1e2a3a", fontWeight:700 }}>
                {n==="A*"?"A★":n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricas.map(({ label, key }) => {
            // para heurística solo mostrar texto
            const isText = key === "heur";
            const vals = algos.map(n => {
              if (isText) return n==="BFS" ? "Ninguna" : n==="Greedy" ? "(p+u)/d" : "g+(p+u)/d";
              return Number(resultados[n].stats[key]);
            });
            const minVal = isText ? null : Math.min(...vals);
            return (
              <tr key={key}>
                <td style={{ padding:"10px 16px", color:"#475569", borderBottom:"1px solid #0f172a" }}>{label}</td>
                {algos.map((n, i) => {
                  const val = vals[i];
                  const isBest = !isText && val === minVal;
                  return (
                    <td key={n} style={{ padding:"10px 16px", textAlign:"center",
                      color: isBest ? ALGO_META[n].accent : "#64748b",
                      fontWeight: isBest ? 700 : 400,
                      background: isBest ? `${ALGO_META[n].accent}0d` : "transparent",
                      borderBottom:"1px solid #0f172a" }}>
                      {isText ? val : val}{isBest ? " ✓" : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop:10, color:"#1e293b", fontSize:11, fontFamily:"monospace" }}>✓ = mejor valor en esa métrica</div>
    </div>
  );
}

function TreeViz({ expandidos, tareas, algoName, planSet }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const m = ALGO_META[algoName];
  const { nodes, edges } = buildTree(expandidos, tareas);
  const nodeList = Object.values(nodes);
  const visibleIds = new Set(expandidos.slice(0, step+1).map(e => JSON.stringify(e.estado)));

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep(s => { if (s >= expandidos.length-1) { setPlaying(false); return s; } return s+1; });
      }, 420);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, expandidos.length]);

  const svgH = Math.max(...nodeList.map(n => n.y), 0) + 80;
  return (
    <div style={{ background:m.bg, borderRadius:14, padding:"18px 14px",
      border:`1px solid ${m.accent}22`, boxShadow:`0 0 24px ${m.glow}10` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {[["⏮",()=>setStep(0)],["◀",()=>setStep(s=>Math.max(0,s-1))],
            [playing?"⏸":"▶",()=>setPlaying(p=>!p)],
            ["▶",()=>setStep(s=>Math.min(expandidos.length-1,s+1))],
            ["⏭",()=>setStep(expandidos.length-1)]
          ].map(([lbl,fn],i)=>(
            <button key={i} onClick={fn} style={{ background:`${m.accent}18`, border:`1px solid ${m.accent}44`,
              color:m.accent, borderRadius:7, padding:"4px 10px", cursor:"pointer", fontFamily:"monospace", fontSize:13 }}>{lbl}</button>
          ))}
        </div>
        <span style={{ color:m.text, fontFamily:"monospace", fontSize:12, opacity:0.5 }}>
          Paso {step+1} / {expandidos.length}
        </span>
      </div>
      <div style={{ overflowX:"auto" }}>
        <svg width={880} height={svgH} style={{ display:"block", margin:"0 auto" }}>
          {edges.map(({ from, to }) => {
            const a=nodes[from], b=nodes[to]; if(!a||!b) return null;
            const vis=visibleIds.has(to); const isPlan=planSet.has(from)&&planSet.has(to);
            return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={vis?(isPlan?m.accent:`${m.accent}44`):"#ffffff08"}
              strokeWidth={isPlan&&vis?2.5:1.2} strokeDasharray={isPlan&&vis?"none":"4 3"}/>;
          })}
          {nodeList.map(n => {
            const vis=visibleIds.has(n.id);
            const isCurrent=vis&&JSON.stringify(expandidos[step]?.estado)===n.id;
            const isPlan=planSet.has(n.id); const r=n.nivel===0?27:20;
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                {isCurrent&&(
                  <circle r={r+8} fill="none" stroke={m.accent} strokeWidth={2} opacity={0.35}>
                    <animate attributeName="r" values={`${r+5};${r+13};${r+5}`} dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.35;0.08;0.35" dur="1s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle r={r} fill={!vis?"#111827":isPlan?m.accent:`${m.accent}1a`}
                  stroke={!vis?"#ffffff0a":isCurrent?m.glow:isPlan?m.accent:`${m.accent}77`}
                  strokeWidth={isCurrent||isPlan?2.5:1}
                  style={{ filter:vis&&isPlan?`drop-shadow(0 0 7px ${m.glow})`:"none", transition:"fill 0.3s" }}/>
                <text y={1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={n.nivel===0?10:8.5} fill={!vis?"#ffffff15":isPlan?(n.nivel===0?"#fff":"#000"):m.text}
                  fontFamily="'Space Mono',monospace" fontWeight={isPlan?"700":"400"}>
                  {n.label.length>7?n.label.slice(0,6)+"…":n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ color:m.text, fontFamily:"monospace", fontSize:11, opacity:0.5, marginRight:4 }}>Orden óptimo:</span>
        {expandidos[expandidos.length-1]?.estado.map((i,idx)=>(
          <span key={idx} style={{ background:`${m.accent}1a`, border:`1px solid ${m.accent}55`,
            borderRadius:6, padding:"2px 10px", color:m.accent, fontFamily:"'Space Mono',monospace", fontSize:11 }}>
            {idx+1}. {tareas[i]?.nombre}
          </span>
        ))}
      </div>
    </div>
  );
}

const PRIORIDAD_OPTS=["1 - Nada prioritario","2 - Baja","3 - Media","4 - Alta","5 - Extrema"];
const URGENCIA_OPTS =["1 - No urgente","2 - Poco urgente","3 - Moderada","4 - Muy urgente","5 - Extrema"];
const labelStyle={ display:"block", fontSize:10, color:"#4a5568", marginBottom:5, letterSpacing:1 };
const inputStyle={ width:"100%", background:"#0a0f1a", border:"1px solid #1e2a3a", borderRadius:8,
  padding:"8px 11px", color:"#e2e8f0", fontFamily:"monospace", fontSize:12, boxSizing:"border-box" };

export default function App() {
  const [tareas, setTareas]       = useState([]);
  const [form, setForm]           = useState({ nombre:"", prioridad:0, urgencia:0, duracion:"" });
  const [resultados, setResultados] = useState(null);
  const [activeTab, setActiveTab] = useState("BFS");

  function agregar() {
    if (!form.nombre||!form.duracion||!form.prioridad||!form.urgencia) return;
    setTareas(prev=>[...prev,{
      nombre:form.nombre, prioridad:Number(form.prioridad),
      urgencia:Number(form.urgencia), duracion:parseFloat(form.duracion),
    }]);
    setForm({ nombre:"", prioridad:0, urgencia:0, duracion:"" });
    setResultados(null);
  }

  function ejecutar() {
    if (tareas.length < 2) return;
    const res = {};
    for (const [name, fn] of [["BFS",bfs],["Greedy",greedy],["A*",astar]]) {
      const t0 = performance.now();
      const r  = fn(tareas);
      const t1 = performance.now();
      if (!r) continue;
      const planIds = new Set();
      for (let i=0; i<=r.plan.length; i++) planIds.add(JSON.stringify(r.plan.slice(0,i)));
      res[name] = {
        ...r,
        planSet: planIds,
        stats: {
          nodos:  r.expandidos.length,
          tiempo: (t1 - t0).toFixed(2),
          pasos:  r.plan.length,
        },
      };
    }
    setResultados(res);
    setActiveTab("BFS");
  }

  const cur = resultados?.[activeTab];

  return (
    <div style={{ minHeight:"100vh", background:"#080b14", color:"#e2e8f0",
      fontFamily:"'Space Mono',monospace", padding:"28px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        input::placeholder { color:#2d3748; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#1e2a3a; border-radius:3px; }
      `}</style>

      <h1 style={{ textAlign:"center", fontSize:20, letterSpacing:3, marginBottom:4,
        background:"linear-gradient(90deg,#38bdf8,#a78bfa,#fb923c)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
        ORGANIZADOR INTELIGENTE DE TAREAS
      </h1>
      <p style={{ textAlign:"center", color:"#1e3a5a", fontSize:11, marginBottom:28, letterSpacing:2 }}>
        BFS · GREEDY · A★ — BÚSQUEDA EN ÁRBOLES HEURÍSTICOS
      </p>

      {/* Formulario */}
      <div style={{ maxWidth:900, margin:"0 auto 20px", background:"#0d1117",
        borderRadius:14, padding:22, border:"1px solid #1e2a3a" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
          <div>
            <label style={labelStyle}>NOMBRE</label>
            <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}
              onKeyDown={e=>e.key==="Enter"&&agregar()} placeholder="Ej. Estudiar para examen" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>PRIORIDAD</label>
            <select value={form.prioridad} onChange={e=>setForm(f=>({...f,prioridad:e.target.value}))} style={inputStyle}>
              <option value={0}>— —</option>
              {PRIORIDAD_OPTS.map((o,i)=><option key={i} value={i+1}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>URGENCIA</label>
            <select value={form.urgencia} onChange={e=>setForm(f=>({...f,urgencia:e.target.value}))} style={inputStyle}>
              <option value={0}>— —</option>
              {URGENCIA_OPTS.map((o,i)=><option key={i} value={i+1}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>DURACIÓN (h)</label>
            <input type="number" value={form.duracion} onChange={e=>setForm(f=>({...f,duracion:e.target.value}))}
              placeholder="2.5" min="0.1" step="0.5" style={inputStyle}/>
          </div>
          <button onClick={agregar} style={{ padding:"9px 16px", background:"#0c2240",
            border:"1px solid #38bdf8", color:"#38bdf8", borderRadius:9, cursor:"pointer",
            fontFamily:"monospace", fontSize:12, whiteSpace:"nowrap" }}>+ Agregar</button>
        </div>
      </div>

      {/* Tags */}
      {tareas.length > 0 && (
        <div style={{ maxWidth:900, margin:"0 auto 18px" }}>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:12 }}>
            {tareas.map((t,i)=>(
              <div key={i} style={{ background:"#0d1117", border:"1px solid #1e2a3a",
                borderRadius:9, padding:"5px 12px", fontSize:11, display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ color:"#e2e8f0", fontWeight:700 }}>{t.nombre}</span>
                <span style={{ color:"#38bdf8" }}>P:{t.prioridad}</span>
                <span style={{ color:"#fb923c" }}>U:{t.urgencia}</span>
                <span style={{ color:"#a78bfa" }}>{t.duracion}h</span>
                <span onClick={()=>{ setTareas(p=>p.filter((_,j)=>j!==i)); setResultados(null); }}
                  style={{ color:"#ef4444", cursor:"pointer", fontSize:13 }}>✕</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={ejecutar} disabled={tareas.length<2}
              style={{ padding:"11px 28px", borderRadius:10,
                cursor:tareas.length<2?"not-allowed":"pointer",
                background:tareas.length>=2?"linear-gradient(135deg,#0ea5e9,#8b5cf6)":"#111",
                border:"none", color:"#fff", fontFamily:"monospace", fontSize:13,
                fontWeight:700, letterSpacing:1, opacity:tareas.length<2?0.3:1 }}>
              ▶ EJECUTAR ALGORITMOS
            </button>
            {tareas.length < 2 && <span style={{ color:"#2d3748", fontSize:11 }}>Agrega al menos 2 tareas</span>}
          </div>
        </div>
      )}

      {/* Resultados */}
      {resultados && Object.keys(resultados).length > 0 && (
        <div style={{ maxWidth:900, margin:"0 auto" }}>

          {/* ── Tabla comparativa ── */}
          <TablaComparativa resultados={resultados} />

          {/* ── Tabs ── */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {Object.keys(resultados).map(name=>{
              const m=ALGO_META[name]; const active=activeTab===name;
              return (
                <button key={name} onClick={()=>setActiveTab(name)} style={{
                  padding:"8px 22px", borderRadius:9, cursor:"pointer", fontFamily:"monospace",
                  fontSize:13, fontWeight:700, transition:"all 0.2s",
                  background:active?m.accent:"#0d1117",
                  border:`1px solid ${active?m.accent:"#1e2a3a"}`,
                  color:active?"#000":m.accent,
                  boxShadow:active?`0 0 16px ${m.glow}55`:"none",
                }}>{name==="A*"?"A★":name}</button>
              );
            })}
          </div>

          {/* ── Info + Árbol ── */}
          {cur && (
            <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:16, alignItems:"start" }}>
              <AlgoInfo name={activeTab} stats={cur.stats}/>
              <TreeViz expandidos={cur.expandidos} tareas={tareas} algoName={activeTab} planSet={cur.planSet}/>
            </div>
          )}
        </div>
      )}

      {!resultados && tareas.length===0 && (
        <p style={{ textAlign:"center", color:"#1e2a3a", fontSize:12, marginTop:60, letterSpacing:1 }}>
          AGREGA TAREAS PARA VER EL ÁRBOL DE BÚSQUEDA
        </p>
      )}
    </div>
  );
}