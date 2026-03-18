# Aplicar PDF Settings nos exports do CRM e CarouselsTab

## Problema

O `usePdfSettings` foi integrado apenas no `ContentGenerator.tsx`. As outras duas áreas de exportação de PDF — **CRM** (`downloadPdf`, `downloadProjectPdf`, `downloadAllPdf`) e **CarouselsTab** (`handleDownloadPDF`) — continuam usando estilos hardcoded e não aplicam as configurações personalizadas do usuário.

## Áreas afetadas


| Local                                                | Método atual                                                                   | Problema                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `src/pages/CRM.tsx` (linhas 688-708)                 | `window.print()` com CSS hardcoded em `index.css`                              | Ignora logo, cores, fontes, header/footer do `pdf_settings` |
| `src/index.css` (linhas 290-422)                     | Classes `.pdf-cover`, `.pdf-card`, etc. com cores fixas (`#2563eb`, `#0f172a`) | Não é dinâmico                                              |
| `src/components/crm/CarouselsTab.tsx` (linhas 71-89) | `window.open` + HTML inline com `Segoe UI` hardcoded                           | Ignora completamente as settings                            |


## Solução

### 1. `src/pages/CRM.tsx`

- Importar `usePdfSettings`
- Substituir o container de print estático por um que injete dinamicamente: logo (com posicionamento), cores primária/secundária, font-family, font-sizes, header/footer texts, e controle de cover page
- Em vez de usar `window.print()` direto com CSS estático, abrir `window.open` e montar o HTML completo com as settings (mesmo padrão do ContentGenerator), garantindo consistência

### 2. `src/components/crm/CarouselsTab.tsx`

- Importar `usePdfSettings`
- No `handleDownloadPDF`, aplicar as configurações de cor, fonte, logo, header/footer no HTML gerado

### 3. `src/index.css`

- Manter as classes `.pdf-*` como fallback mas tornar as cores parametrizáveis via CSS custom properties que serão setadas inline pelo CRM antes de imprimir

## Abordagem técnica

A forma mais consistente é converter os 3 métodos de PDF do CRM (`downloadPdf`, `downloadProjectPdf`, `downloadAllPdf`) para usar `window.open` + HTML inline com settings dinâmicas (mesmo padrão do ContentGenerator), em vez de `window.print()` com div oculta. Isso elimina a dependência do CSS estático e garante que todas as exportações usem o template personalizado.

Além disso, ao atualizar o template, todos os roteiros e briefings antigos devem ser automaticamente migrados para o novo modelo ao serem abertos pelo usuário.

## Arquivos modificados


| Arquivo                               | Alteração                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/pages/CRM.tsx`                   | Importar `usePdfSettings`, reescrever 3 funções de PDF para gerar HTML com settings dinâmicas |
| `src/components/crm/CarouselsTab.tsx` | Importar `usePdfSettings`, aplicar settings no `handleDownloadPDF`                            |
