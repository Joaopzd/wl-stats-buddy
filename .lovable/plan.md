# Plano de Implementação

Trabalho dividido em 3 blocos. Posso entregar tudo em sequência, mas confirmo antes de começar.

## Bloco A — Sub Impact & Win Rates (rápido, UI apenas)

1. **Club Legends (`src/routes/rankings.tsx`)**: adicionar nova categoria "Sub Impact" usando `computeSubImpact` já existente em `stats.ts`. Top N substitutos por impacto.
2. **Report final de WL (`src/components/ReportModal.tsx`)**: incluir seção/linha "Best Sub Impact" com o jogador de maior impacto naquela WL.
3. **Detalhes da carta (`src/components/PlayerDetailModal.tsx`)**:
   - Adicionar **Sub Impact** ao `StatGrid` (carreira e última WL).
   - Adicionar **Win Rate %** = wins / matches.
4. **Aba Club (`src/routes/club.tsx`)**: card com **Win Rate do clube** = somatório de matches vencidas / total de matches (todas as WLs, excluindo LAB — ver Bloco C).

## Bloco B — Migração de Schema para isolamento LAB

Adicionar coluna `session_type text default 'WL'` nas tabelas `weekend_leagues` e `matches`. Valores: `'WL'` ou `'LAB'`. Index parcial para acelerar filtros.

```sql
ALTER TABLE public.weekend_leagues ADD COLUMN session_type text NOT NULL DEFAULT 'WL';
ALTER TABLE public.matches ADD COLUMN session_type text NOT NULL DEFAULT 'WL';
CREATE INDEX idx_matches_session_type ON public.matches(user_id, session_type);
CREATE INDEX idx_wls_session_type ON public.weekend_leagues(user_id, session_type);
```

No store local (`src/lib/store.ts`) e nos tipos (`src/lib/types.ts`), adicionar `sessionType: "WL" | "LAB"` em `WeekendLeague` e `Match` (default `"WL"`).

**Regra estrita**: criar helper `filterWL(matches)` e `filterWLs(wls)` em `stats.ts`. Todas as agregações de Dashboard / MVP da Semana / Club Legends / Best XI / Club Win Rate passam por esse filtro. Apenas a aba PZD Lab vê dados `LAB`.

## Bloco C — Nova aba PZD Lab

1. **Nav (`src/components/AppShell.tsx`)**: adicionar link "PZD Lab" com ícone `FlaskConical`.
2. **Rota nova `src/routes/pzd-lab.tsx`**:
   - Botão "Add Test Match" abre dialog simplificado.
   - Campos: Match Type (`Rivals Test` / `Friendly` / `Qualifiers`), Formation (texto livre ou dropdown das formações existentes), Result/Score, e por jogador: G, A, Rating.
   - Lista de test matches recentes, mini-leaderboard isolado (top jogadores por avg rating + G+A apenas dos LAB matches).
3. **Lab Notes por jogador**: nova tabela ou JSON. Mais simples: tabela `player_lab_notes (user_id, player_id, notes text, updated_at)` com RLS. Editor inline na seção PZD Lab do jogador.
4. **Reuso**: criar `LabMatchDialog` derivado de `MatchDialog` mas sem WL/squad — apenas escolhe jogadores avulsos do roster, marca starter/sub se quiser, salva com `sessionType: "LAB"` e `wlId` = um WL "virtual" LAB por usuário (criado automaticamente, `sessionType: "LAB"`, `number: 0`).

## Detalhes técnicos

- **Filtro central**: em `aggregatePlayer`, `aggregateWL`, e nos seletores do Dashboard, aplicar `matches.filter(m => (m.sessionType ?? "WL") === "WL")` antes de qualquer cálculo. Mesmo para `wls`.
- **Migração de dados**: registros antigos ficam `'WL'` por causa do `DEFAULT`. Sem perda.
- **Win rate do clube**: derivar de matches WL. `wins = matches.filter(m => m.scoreFor > m.scoreAgainst || (m.penalties && m.penaltyWinner === 'us')).length`.
- **Sub Impact em rankings**: filtrar jogadores com `subMatches >= 2` para evitar ruído de amostra única.

## Confirmar antes de codar

Vou:
1. Rodar a migração SQL acima (pede sua aprovação).
2. Editar ~10 arquivos (rankings, ReportModal, PlayerDetailModal, club, store, types, stats, AppShell) + criar 2 novos (rota pzd-lab + LabMatchDialog).

Posso seguir? Ou prefere fatiar em entregas menores (ex: Bloco A primeiro, depois B+C)?
