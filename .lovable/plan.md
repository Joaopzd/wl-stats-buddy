## 1. Sidebar — persistência e polimento

**Persistir estado (expandido/colapsado):**
- Ler o cookie `sidebar_state` no `SidebarProvider` do shadcn (já grava o cookie, mas não lê) — passar `defaultOpen` a partir do cookie em `AppShell.tsx`.
- Fallback para `true` quando não houver cookie.

**Rodapé fora do quadro quando colapsada:**
- Em `AppSidebar` (`AppShell.tsx`), quando `collapsed`, esconder `AuthButton`/`SettingsMenu` verbosos e mostrar apenas ícones empilhados dentro do `w-14` do sidebar.
- Ajustar `AuthButton` para aceitar prop `compact` (ou detectar via `useSidebar`) e renderizar somente ícones (login / user / logout) sem textos que estouram o quadro.

**Não expandir ao clicar no ícone quando colapsada:**
- Confirmar que os `Link` dentro dos `SidebarMenuButton` apenas navegam (sem chamar `setOpen(true)`). Ok atualmente.
- Remover qualquer `group-hover:` ou lógica que auto-expanda em hover/click. Manter expansão só via `SidebarTrigger`.

---

## 2. WL Detail — Re-arquitetura em seções

Reestruturar `src/routes/weekend-leagues.$wlId.tsx` num layout com **painel de ações fixo no topo** + **sub-navegação por abas** (Tabs shadcn) para 3 seções.

### Top Actions Panel (sempre visível, sticky abaixo do header)
- Botão primário grande: **Create New Match** (destaque `bg-primary shadow-neon`).
- Botão secundário: **Edit Squad**.
- Mantém título do WL, crest, recorde compacto e RankBadge à esquerda.

### Sub-navegação (Tabs)
Três abas: `Campaign Overview` (default) · `Matches` · `Squad Analytics`.

#### Aba 1 · Campaign Overview
- **Team Performance:** cards com Wins, Losses, Goals Scored, Goals Conceded e **Goal Difference** (verde se ≥0, vermelho se <0).
- **Current Standing:** RankBadge grande + **Form (últimos 5)** — bolinhas W/L/D coloridas em linha.
- **Advanced Match Stats Aggregators:** médias acumuladas de Possession %, xG, Total Shots e Total Completed Passes (somando/mediando os campos já existentes em `Match`).
- **Top & Bottom Performers** (usando `aggregatePlayer`):
  - Top 3 Scorers · Top 3 Assists · Top 3 MVP Rating (maior média) · Bottom 3 Underperformers (menor média, mínimo 2 jogos).
  - Cards horizontais com foto/rarity + stat destacada.

#### Aba 2 · Matches Timeline
- Lista padronizada dos jogos com **cor por resultado** (borda esquerda verde para W, vermelha para L, amarela para pênaltis/ET).
- Cada row: `#index · placar · oponente · plataforma · MVP · rating médio`.
- Clique abre `MatchDetailModal` (já existe).

#### Aba 3 · Squad Analytics
- Tabela completa do squad ativo com colunas: Player · Pos · MP · G · A · G+A · Avg Rating · MVP · Best Rating.
- Ordenável por clique no header.
- Reutiliza `aggregatePlayer`.

### Post-WL Final Report (overlay)
Após 15 jogos, `ReportModal` (já existe) ganha:
- Campo **Coach's Tactical Notes** (`Textarea` shadcn) persistido no WL como `coachNotes?: string` em `WeekendLeague` (nova coluna opcional em `data` JSON — já é `jsonb`, sem migração).
- Grid com **average rating por jogador ao longo da campanha** (já disponível via `aggregatePlayer.avgRating`), ordenado desc.
- Salvar em `store.updateWL({ coachNotes })`.

---

## Detalhes técnicos

**Arquivos alterados:**
- `src/components/AppShell.tsx` — ler cookie, layout do footer colapsado.
- `src/components/AuthButton.tsx` — modo compacto quando `useSidebar().state === 'collapsed'`.
- `src/components/SettingsMenu.tsx` — idem, garantir ícone-only.
- `src/routes/weekend-leagues.$wlId.tsx` — reorganização em Tabs (shadcn `tabs`), extraindo componentes internos `<CampaignOverview>`, `<MatchesTimeline>`, `<SquadAnalytics>`.
- `src/components/ReportModal.tsx` — Textarea de notas + grid de médias.
- `src/lib/types.ts` — `coachNotes?: string` em `WeekendLeague`.
- `src/lib/stats.ts` — helper `aggregateMatchStats(matches)` retornando médias (possession, xG, shots, passes) e helper `formLast5(matches)`.

**Sem alteração de schema Supabase** (dados vivem em `data jsonb`).

**Preservado:** MatchDialog, SquadDialog, TacticsDialog, LossStreakAlert, LeagueWatermark, AICoach — reaproveitados dentro das novas seções.
