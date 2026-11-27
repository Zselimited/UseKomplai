import { IconMessageQuestion } from "@/components/icons";
import { buildOfficerWhatsAppLink } from "@/lib/whatsapp";

export default function OfficerCard() {
  const whatsAppLink = buildOfficerWhatsAppLink("Hi, I'd like to get a Rulla officer to help with my compliance.");

  return (
    <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="officer-card">
      <span className="icon-tile" style={{ marginBottom: 0 }}>
        <IconMessageQuestion />
      </span>
      <div>
        <h3 style={{ fontSize: "1rem" }}>Get your Rulla officer</h3>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          A trained account officer who files what&apos;s due and helps
          explain your numbers, over WhatsApp.
        </p>
      </div>
    </a>
  );
}
