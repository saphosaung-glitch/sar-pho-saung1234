import { Order } from '../context/StoreContext';

/**
 * Formats an order into a WhatsApp message string.
 * @param order The order object to format.
 * @param formatPrice Function to format price values.
 * @returns A formatted string ready for WhatsApp.
 */
export function formatOrderForWhatsApp(order: Order, formatPrice: (price: number) => string): string {
  const lineBreak = '---------------------------';
  const items = order.items.map(item => `- ${item.name} x ${item.quantity} (${formatPrice(item.price * item.quantity)})`).join('\n');
  
  const message = `🔔 *Order Confirmation* 🔔
Order ID: #${order.id}
${lineBreak}
👤 *Customer Info*
Name: ${order.customerName}
Phone: ${order.customerPhone}
${lineBreak}
📦 *Order Items*
${items}
${lineBreak}
💰 *Total Amount*: ${formatPrice(order.total)}
📍 *Address*: ${order.address || order.roomNumber || 'N/A'}
${lineBreak}
Thank you for your order!`;

  return message;
}

/**
 * Formats a notification message for the customer from the admin.
 */
export function formatAdminNotifyMessage(order: Order, formatPrice: (price: number) => string): string {
  const itemsList = order.items.map(item => `• ${item.name}${item.unit ? ` (${item.unit})` : ''} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`).join('\n');
  const deliveryInfo = order.address || order.roomNumber || 'your registered address';
  
  return `Order ID: #${order.id}
Hello ${order.customerName},
We have received your order and it is being processed.

Order Items:
${itemsList}

${order.deliveryFee > 0 ? `Delivery Fee: ${formatPrice(order.deliveryFee)}\n` : ''}${order.pointDiscount > 0 ? `Discount: -${formatPrice(order.pointDiscount)}\n` : ''}Total Amount: ${formatPrice(order.total)}

${order.note ? `Note: ${order.note}\n` : ''}Items will be delivered to ${deliveryInfo} tomorrow.
Thank you!`;
}

/**
 * Formats an order inquiry message for the customer to send to admin.
 */
export function formatOrderInquiry(order: Order): string {
  return `Hello! I would like to inquire about my order #${order.id}.

Order ID: #${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}

Looking forward to your response. Thank you!`;
}

/**
 * Formats a phone number for international messaging (WhatsApp).
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  
  // If it's a local Myanmar number starting with 09
  if (cleaned.startsWith("09")) {
    return "95" + cleaned.substring(1);
  }
  // If it's a local Malaysia number starting with 01
  if (cleaned.startsWith("01")) {
    return "60" + cleaned.substring(1);
  }
  
  return cleaned;
}

/**
 * Generates a WhatsApp link for a given phone number and message.
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = formatPhoneNumber(phone);
  // Using api.whatsapp.com as it can be more stable for redirects in some browsers
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Opens a WhatsApp link. Reverted to window.open for reliability.
 */
export function openWhatsApp(phone: string, message: string) {
  const link = getWhatsAppLink(phone, message);
  window.open(link, '_blank');
}
