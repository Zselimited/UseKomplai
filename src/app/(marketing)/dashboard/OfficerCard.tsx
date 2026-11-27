import { IconMessageQuestion, IconArrowRight } from "@/components/icons";
import { buildOfficerWhatsAppLink } from "@/lib/whatsapp";

export default function OfficerCard() {
  const whatsAppLink = buildOfficerWhatsAppLink("Hi, I'd like to get a Rulla officer to help with my compliance.");

  return (
    <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="officer-card">
      <div className="officer-card-top">
        <span className="icon-tile" style={{ marginBottom: 0 }}>
          <IconMessageQuestion />
        </span>
        <span className="officer-card-whatsapp-badge">WhatsApp</span>
      </div>

      <h3>Get your Rulla officer</h3>
      <p>
        A trained account officer who files what&apos;s due and helps
        explain your numbers.
      </p>

      <span className="officer-card-cta">
        Chat now
        <IconArrowRight className="btn-arrow" />
      </span>
    </a>
  );
}
