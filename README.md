# 🧠 Organizador Inteligente de Tareas

Aplicación web que utiliza algoritmos de búsqueda heurística (BFS, Greedy y A*) para determinar el orden óptimo en que deberías realizar tus tareas del día.

## ✨ ¿Qué hace?

- Ingresa tareas con nivel de prioridad, urgencia y duración
- Genera un árbol de búsqueda visual e interactivo
- Compara los 3 algoritmos lado a lado con métricas reales
- Anima el recorrido de cada algoritmo paso a paso

## 🚀 Cómo correrlo

### Requisitos
- [Node.js](https://nodejs.org) instalado (versión LTS)

### Pasos
```bash
# 1. Clona el repositorio
git clone https://github.com/AdieltTpp/Organizador-tareas.git

# 2. Entra a la carpeta
cd Organizador-tareas

# 3. Instala dependencias
npm install

# 4. Corre el proyecto
npm run dev
```

Abre tu navegador en **http://localhost:5173**

## 🧩 Algoritmos implementados

| Algoritmo | Tipo | Descripción |
|-----------|------|-------------|
| BFS | No informada | Explora nivel por nivel sin heurística |
| Greedy | Heurística pura | Elige siempre la tarea con mayor (prioridad+urgencia)/duración |
| A* | Heurística informada | Combina costo real acumulado + heurística |

## 🛠️ Tecnologías

- React + Vite
- SVG para visualización del árbol
- CSS-in-JS para estilos