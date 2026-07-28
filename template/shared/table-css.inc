  table.cmp th:first-child{text-align:left}
  table.cmp td{padding:10px;border-bottom:1px solid var(--line);text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
  table.cmp td:first-child{text-align:left;font-weight:700}
  table.cmp tr.best td{background:rgba(47,213,116,.07)}
  table.cmp td.pos{color:var(--green)}
  table.cmp td.neg{color:var(--red)}
  table.cmp .del{cursor:pointer;color:var(--muted-2);font-weight:800;background:none;border:none;font-size:15px;padding:2px 6px}
  table.cmp .del:hover{color:var(--red)}
  .cmp-scroll{overflow-x:auto}

  .btn:focus-visible,.seg button:focus-visible,.del:focus-visible{outline:2px solid var(--green-deep);outline-offset:2px}
  @media (prefers-reduced-motion: reduce){*{transition:none !important}}
  .stickybar{display:none}
  @media(max-width:920px){
    body{padding-top:52px}
    .stickybar{
      display:flex;position:fixed;top:0;left:0;right:0;z-index:60;align-items:center;gap:10px;
      background:var(--panel);border-bottom:1px solid var(--line);padding:10px 16px;
    }
    .stickybar .sb-k{font-size:11.5px;color:var(--muted);font-weight:700}
    .stickybar .sb-v{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;margin-left:auto}
    .stickybar .sb-v.pos{color:var(--green)}
    .stickybar .sb-v.neg{color:var(--red)}
  }
  .adv-toggle{display:none}
  @media(max-width:920px){
    body:not(.expert) .advanced{display:none}
    .adv-toggle{display:block;margin:0 22px 18px;width:calc(100% - 44px);font-family:var(--sans);
      font-size:13.5px;font-weight:700;color:var(--ink);background:#fff;border:1.5px dashed var(--paper-line);
      border-radius:var(--radius-sm);padding:12px;cursor:pointer}
  }
  footer{max-width:1140px;margin:0 auto;padding:0 24px 44px;font-size:12px;color:var(--muted-2);line-height:1.65}
  footer b{color:var(--muted);font-weight:700}
</style>
</head>
<body>