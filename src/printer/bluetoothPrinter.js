/**
 * bluetoothPrinter.js  –  RawBT Mobile Print Edition
 * -------------------------------------------------
 * This module encodes raw ESC/POS bytes into Base64 and redirects
 * the browser to the RawBT Android app custom URI scheme.
 *
 * Requirements:
 *   - The user must have the "RawBT" app installed on their Android device.
 *   - The printer must be paired inside the RawBT app.
 */

/**
 * Send raw ESC/POS bytes to the RawBT Android printing service.
 * @param {Uint8Array} bytes
 */
export function printBytes(bytes) {
  // Convert Uint8Array to binary string
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  // Encode binary string to Base64
  const base64Data = btoa(binary);
  
  // Redirect to RawBT app to handle the printing (uses a comma delimiter)
  window.location.href = `rawbt:base64,${base64Data}`;
}

/**
 * Since RawBT handles connection management internally on the device,
 * the web app does not need to maintain an active connection socket.
 */
export function isPrinterConnected() {
  return true;
}