import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="breadcrumb" className="mx-auto w-full max-w-6xl px-4 pt-6 font-[family-name:var(--font-body)] sm:px-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <i className="fa-solid fa-chevron-right text-[10px] text-gray-400" />}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)] hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-[var(--text)]' : 'text-gray-500'}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
