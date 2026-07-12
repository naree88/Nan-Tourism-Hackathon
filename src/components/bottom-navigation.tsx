import Link from "next/link";
import { Compass, Store, UserRound } from "lucide-react";

export function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="เมนูหลักบนมือถือ">
      <div className="bottom-nav__inner">
        <Link href="/">
          <Compass size={21} aria-hidden="true" />
          <span>ค้นหา</span>
        </Link>
        <Link href="/merchant">
          <Store size={21} aria-hidden="true" />
          <span>ร้านของฉัน</span>
        </Link>
        <Link href="/login">
          <UserRound size={21} aria-hidden="true" />
          <span>บัญชี</span>
        </Link>
      </div>
    </nav>
  );
}
