export const PAGE_PARAM = "pagina";
export const INITIAL_HIDDEN_CLASS = "has-search-params";

export function revealInitialContent(): void {
  document.documentElement.classList.remove(INITIAL_HIDDEN_CLASS);
}

export function readPage(): number {
  const p = parseInt(
    new URLSearchParams(window.location.search).get(PAGE_PARAM) ?? "",
    10,
  );
  return Number.isInteger(p) && p >= 1 ? p : 1;
}

export function pageUrl(path: string, page: number, extra?: URLSearchParams): string {
  const qs = new URLSearchParams(extra ?? []);
  if (page > 1) qs.set(PAGE_PARAM, String(page));
  else qs.delete(PAGE_PARAM);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function pagerItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

export interface PagerOpts {
  getTotal: () => number;
  buildUrl: (page: number) => string;
  navigate: (page: number, push: boolean) => void;
}

const bound = new WeakSet<HTMLElement>();

export function setupPager(el: HTMLElement, opts: PagerOpts): {
  render: () => void;
  page: () => number;
} {
  const numbers = el.querySelector<HTMLElement>(".page-numbers");
  const prev = el.querySelector<HTMLAnchorElement>('[data-nav="prev"]');
  const next = el.querySelector<HTMLAnchorElement>('[data-nav="next"]');

  const page = () => Math.min(readPage(), opts.getTotal());

  const render = () => {
    const total = opts.getTotal();
    if (total <= 1) {
      el.style.display = "none";
      return;
    }
    el.style.display = "";
    const current = page();

    const setNav = (link: HTMLAnchorElement | null, disabled: boolean) => {
      if (!link) return;
      link.classList.toggle("is-disabled", disabled);
      link.setAttribute("aria-disabled", String(disabled));
    };
    setNav(prev, current <= 1);
    setNav(next, current >= total);

    if (numbers) {
      numbers.innerHTML = "";
      for (const item of pagerItems(current, total)) {
        if (item === "…") {
          const span = document.createElement("span");
          span.className = "ellipsis";
          span.textContent = "…";
          numbers.appendChild(span);
          continue;
        }
        if (item === current) {
          const span = document.createElement("span");
          span.className = "current";
          span.textContent = String(item);
          numbers.appendChild(span);
          continue;
        }
        const a = document.createElement("a");
        a.href = opts.buildUrl(item);
        a.className = "page-num";
        a.textContent = String(item);
        a.dataset.page = String(item);
        a.addEventListener("click", (e) => {
          e.preventDefault();
          opts.navigate(item, true);
        });
        numbers.appendChild(a);
      }
    }
  };

  if (!bound.has(el)) {
    bound.add(el);
    prev?.addEventListener("click", (e) => {
      e.preventDefault();
      const current = page();
      if (current > 1) opts.navigate(current - 1, true);
    });
    next?.addEventListener("click", (e) => {
      e.preventDefault();
      const current = page();
      if (current < opts.getTotal()) opts.navigate(current + 1, true);
    });
    window.addEventListener("popstate", () => opts.navigate(page(), false));
  }

  return { render, page };
}