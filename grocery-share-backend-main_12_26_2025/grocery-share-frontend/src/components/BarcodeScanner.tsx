import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, ScanLine } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const stoppedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;
    const scannerId = 'barcode-reader';

    const stopAndClean = async () => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      const s = scannerRef.current;
      if (!s) return;
      try { await s.stop(); } catch {}
      try { s.clear(); } catch {}
      scannerRef.current = null;
    };

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            if (navigator.vibrate) navigator.vibrate(100);
            stopAndClean().then(() => {
              onScanRef.current(decodedText);
            });
          },
          () => {}
        );
        if (!cancelled) setStarting(false);
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (cancelled) return;
        const msg = err?.toString() || '';
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else {
          setError('Could not start camera. Make sure no other app is using it.');
        }
        setStarting(false);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopAndClean();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="font-medium text-sm">Scan Barcode</span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {starting && !error && (
          <div className="flex flex-col items-center gap-3 text-white mb-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Starting camera...</p>
          </div>
        )}

        {error ? (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-center max-w-sm">
            <p className="text-red-200 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-white/20 text-white rounded-lg text-sm active:bg-white/30"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <div
              id="barcode-reader"
              className="rounded-xl overflow-hidden"
              style={{ width: '100%' }}
            />
            {!starting && (
              <>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <ScanLine className="h-16 w-16 text-green-400/50 animate-pulse" />
                </div>
                <p className="text-white/70 text-xs text-center mt-4">
                  Point your camera at a barcode on the product
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
