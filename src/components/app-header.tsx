import Link from "next/link";
import { Coffee, Store } from "lucide-react";
import { DemoModePill } from "./demo-mode-pill";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Nan Coffee, Please หน้าหลัก">
          <span className="brand-mark" aria-hidden="true">
            <Coffee size={19} strokeWidth={1.8} />
          </span>
          <span className="brand-copy">
            <strong>Nan Coffee, Please</strong>
            <span>เส้นทางกาแฟที่เข้ากับวันของคุณ</span>
          </span>
        </Link>
        <div className="header-actions">
          <DemoModePill compact />
          <Link className="merchant-nav-link desktop-menu" href="/merchant">
            <Store size={17} aria-hidden="true" />
            จัดการร้าน
          </Link>
        </div>
      </div>
    </header>
  );
}
