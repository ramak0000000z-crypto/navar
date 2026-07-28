  }
  input.fin:focus{outline:none;border-color:var(--green-deep);box-shadow:0 0 0 3px rgba(47,213,116,.18)}
  input.fin::-webkit-outer-spin-button,
  input.fin::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
  input.fin{-moz-appearance:textfield}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

  .seg{display:flex;gap:6px;background:#E8ECEF;padding:4px;border-radius:var(--radius-sm)}
  .seg button{
    flex:1;font-family:var(--sans);font-size:12.5px;font-weight:700;color:var(--ink-mut);
    background:transparent;border:none;border-radius:8px;padding:9px 6px;cursor:pointer;transition:.12s;line-height:1.25;
  }
  .seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(16,20,24,.12)}
  .seg button small{display:block;font-weight:500;font-size:10.5px;color:#9AA5AF}
