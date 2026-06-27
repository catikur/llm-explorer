import { useLocation } from "wouter";
import { AnchorHTMLAttributes } from "react";

// Mevcut query string'i (filtre/sıralama/seçim) koruyarak gezinen link.
// Böylece sayfalar arası geçişte paylaşılabilir durum URL'den düşmez.
// Modifier'lı tıklamalar (yeni sekme) varsayılan davranışta bırakılır.
interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function NavLink({ href, onClick, ...rest }: NavLinkProps) {
  const [, navigate] = useLocation();
  return (
    <a
      href={href}
      onClick={e => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        e.preventDefault();
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        navigate(href + search);
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
