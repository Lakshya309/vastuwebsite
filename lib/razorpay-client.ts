export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const win = window as unknown as { R?: { new (options: unknown): { open: () => void } } };
    if (win.R) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    R?: new (options: unknown) => { open: () => void };
  }
}
