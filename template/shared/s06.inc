  .verdict{position:sticky;top:16px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:24px 22px}
  @media(max-width:920px){.verdict{position:static}}
  .v-label{font-size:12.5px;color:var(--muted);font-weight:600}
  .v-hero{display:flex;align-items:flex-end;gap:10px;margin:6px 0 2px}
  .v-profit{font-size:48px;font-weight:800;letter-spacing:-0.03em;line-height:1;font-variant-numeric:tabular-nums;transition:color .2s}
  .v-profit.pos{color:var(--green)}
  .v-profit.neg{color:var(--red)}
  .v-per{font-size:13px;color:var(--muted);font-weight:600;padding-bottom:7px}
  .v-status{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:100px;margin-top:5px}
  .v-status.pos{background:rgba(47,213,116,.13);color:var(--green)}
  .v-status.neg{background:rgba(255,93,98,.13);color:var(--red)}
  .v-status .dot{width:6px;height:6px;border-radius:50%;background:currentColor}

  .metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}
  .metric{background:var(--panel-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:11px 12px}
  .metric .k{font-size:11px;color:var(--muted);font-weight:600;margin-bottom:4px}