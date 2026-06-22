# Plano

## 1. Raridades não aparecendo

Causa: as raridades novas (FOF: Greats of The Game Icon/Hero) foram adicionadas ao type `Rarity` e ao `format.ts`, mas **não** foram incluídas no `RARITY_GROUPS` em `src/routes/players.tsx` — por isso não aparecem no Add Player. Showdown está lá; FOF está faltando.

**Correção:** acrescentar as duas FOF ao grupo "Specials / Promos" em `RARITY_GROUPS`.

## 2. Ícones distintos por raridade

Adicionar em `src/lib/format.ts` uma função `rarityIcon(r)` que retorna um componente Lucide por raridade (TOTS → `Crown`, TOTY → `Trophy`, FOF Icon → `Star`, FOF Hero → `Shield`, Showdown → `Swords`, FUT Birthday → `Cake`, Future Stars → `Sparkles`, Path to Glory → `TrendingUp`, etc.). Default: `Circle`.

Exibir o ícone em:
- `PlayerCard.tsx` — pequeno badge no canto superior esquerdo (tamanhos sm+).
- Player picker em `players.tsx` — ao lado do swatch e na opção selecionada.
- WL detail (`weekend-leagues.$wlId.tsx`) — na linha de cada jogador.

## 3. Botão "Tactics" + Modal (EA FC FC IQ style)

### Modelo de dados (persistido em `WeekendLeague.tactics`)

```ts
type BuildUpStyle = "Balance" | "Counter Attack" | "Short Pass";
interface PlayerTactics { role: string; focus: string; }
interface WLTactics {
  buildUpStyle: BuildUpStyle;        // default Balance
  defensiveApproach: number;         // 1–100, default 50
  playerRoles: Record<string, PlayerTactics>; // playerId → {role, focus}
}
```

Persistência: usa `store.updateWL(id, { tactics })` (já grava JSON em `weekend_leagues.data`).

### Componentes novos

- `src/lib/tactics.ts` — mapas de role/focus por grupo posicional (GK, CB, FB, CDM/CM, CAM, Wide, ST), defaults, label do defensive approach (Deep-Lying / Balance / High Press / Aggressive Press), build-up styles + ícones, helper `roleOptionsFor(position)`.
- `src/components/TacticsDialog.tsx` — Dialog (shadcn) com:
  - Header com toggle "View Mode" ↔ "Edit Mode" por aba.
  - `Tabs` (3): **Summary**, **Tactical Information**, **Player Roles**.
  - **Summary**: pequeno pitch 2D (SVG/divs), cada nó mostra "Nome • Role [Focus]", card lateral com Build Up + Defensive Approach.
  - **Tactical Information**: lista de botões para Build Up Style (ícones Lucide: `Scale`, `Zap`, `Send`); slider 1–100 para Defensive Approach com badge dinâmica (ícones por faixa: `Shield`, `Scale`, `ArrowUp`, `Flame`).
  - **Player Roles (FC IQ)**: mesmo pitch; em View Mode, hover/tooltip mostra Role+Focus; em Edit Mode, click abre `Sheet` lateral com selects de Role e Focus filtrados pelo grupo da posição.
- Botão **Tactics** na linha de ações do WL detail (junto a Edit Squad / Add Match), abrindo o dialog. Salva on-change via `store.updateWL`.

### Visual

- Paleta da casa (off-white background do dialog, accent Blue #302681 e Green #30503A para ações/badges).
- Pitch 2D reaproveita a geometria de `FORMATIONS[wl.formation].slots` (x/y %).
- Transições com classes Tailwind (`transition-all duration-200`).

## Arquivos a tocar

- `src/lib/types.ts` — `BuildUpStyle`, `PlayerTactics`, `WLTactics`; campo `tactics?: WLTactics` em `WeekendLeague`.
- `src/lib/format.ts` — `rarityIcon()`.
- `src/lib/tactics.ts` — **novo**, mapas e helpers.
- `src/components/TacticsDialog.tsx` — **novo**.
- `src/components/PlayerCard.tsx` — render do ícone.
- `src/routes/players.tsx` — adicionar FOF ao `RARITY_GROUPS` + ícone na option/picker.
- `src/routes/weekend-leagues.$wlId.tsx` — botão "Tactics" + montar dialog; ícone de raridade na lista do squad.

Nenhuma mudança de schema no Supabase necessária (tudo dentro do JSON `data`).
