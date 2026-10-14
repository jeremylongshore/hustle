import Image from "next/image";
import "../app/intent-partner.css";

export default function IntentPartner() {
  return (
    <aside className="intent-partner" aria-label="Intent Solutions partner status" data-intent-partner>
      <div className="intent-partner__inner">
        <p className="intent-partner__owner">Built by <strong>Intent Solutions</strong></p>
        <a className="intent-partner__link" href="https://intentsolutions.io/" aria-label="About Intent Solutions, a Claude Partner Network Select Services Partner">
          <Image className="intent-partner__image" src="/images/claude-select-partner.svg" alt="Claude Partner Network: Select Services Partner" width={600} height={190} unoptimized />
        </a>
      </div>
    </aside>
  );
}
