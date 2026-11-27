// The Rulla officer's WhatsApp line. Click-to-chat uses the standard
// https://wa.me/<digits>?text=<message> scheme (no country "+", no spaces).
const OFFICER_WHATSAPP_NUMBER = "2347067599891";

export function buildOfficerWhatsAppLink(message: string): string {
  return `https://wa.me/${OFFICER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
