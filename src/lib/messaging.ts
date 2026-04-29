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
 * Formats a phone number for international messaging (WhatsApp/Viber).
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
 * Generates a WhatsApp wa.me link for a given phone number and message.
 */
export function getWhatsAppLink(phone: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formatPhoneNumber(phone)}?text=${encodedMessage}`;
}

/**
 * Generates a Viber link. 
 * Using forward?text is more reliable for sending pre-filled text.
 */
export function getViberLink(phone: string, message: string): string {
  // Replace %20 with + for better URI scheme compatibility in some Viber versions
  const encodedMessage = encodeURIComponent(message).replace(/%20/g, '+');
  return `viber://forward?text=${encodedMessage}`;
}
