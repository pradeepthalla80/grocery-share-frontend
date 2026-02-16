import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Loader2, Keyboard, ImagePlus } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isAndroid = () => /Android/i.test(navigator.userAgent);

const isFirefox = () => /Firefox/i.test(navigator.userAgent);

const hasCameraSupport = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanAttempts, setScanAttempts] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const stoppedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attemptCounterRef = useRef(0);
  onScanRef.current = onScan;

  const stopAndClean = useCallback(async () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    const s = scannerRef.current;
    if (!s) return;
    try { await s.stop(); } catch {}
    try { s.clear(); } catch {}
    scannerRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const scannerId = 'barcode-reader';
    stoppedRef.current = false;
    hasScannedRef.current = false;
    attemptCounterRef.current = 0;

    const startScanner = async () => {
      if (!hasCameraSupport()) {
        setError('Camera is not supported on this browser. Use manual entry or scan a photo of the barcode.');
        setStarting(false);
        return;
      }

      try {
        const ios = isIOS();
        const android = isAndroid();
        const firefox = isFirefox();

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: !firefox,
          verbose: false,
        });
        scannerRef.current = scanner;

        const fps = ios ? 8 : android ? 10 : 15;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps,
            qrbox: undefined,
            disableFlip: false,
            experimentalFeatures: { useBarCodeDetectorIfSupported: !firefox },
          } as any,
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            try { navigator.vibrate(100); } catch {}
            stoppedRef.current = true;
            scanner.stop().then(() => {
              try { scanner.clear(); } catch {}
              scannerRef.current = null;
              onScanRef.current(decodedText);
            }).catch(() => {
              onScanRef.current(decodedText);
            });
          },
          () => {
            if (!hasScannedRef.current) {
              attemptCounterRef.current++;
              if (attemptCounterRef.current % fps === 0) {
                setScanAttempts(prev => prev + 1);
              }
            }
          }
        );
        if (!cancelled) setStarting(false);
      } catch (err: any) {
        console.error('[BarcodeScanner] Error:', err);
        if (cancelled) return;
        const msg = err?.toString() || '';
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (msg.includes('NotFound') || msg.includes('Requested device not found')) {
          setError('No camera found. Make sure your device has a camera.');
        } else if (msg.includes('NotReadable') || msg.includes('Could not start')) {
          setError('Camera is being used by another app. Close other apps using the camera and try again.');
        } else if (msg.includes('OverconstrainedError') || msg.includes('Overconstrained')) {
          setError('Camera settings not supported on this device. Try scanning a photo or entering the barcode manually.');
        } else {
          setError('Could not start camera. Try using manual entry or photo scan instead.');
        }
        setStarting(false);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (!stoppedRef.current) {
        stoppedRef.current = true;
        const s = scannerRef.current;
        if (s) {
          s.stop().catch(() => {}).finally(() => {
            try { s.clear(); } catch {}
            scannerRef.current = null;
          });
        }
      }
    };
  }, []);

  const handleManualSubmit = () => {
    const cleaned = manualBarcode.trim();
    if (cleaned.length >= 8) {
      stopAndClean().then(() => {
        onScanRef.current(cleaned);
      });
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('barcode-file-reader', {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      if (result) {
        stopAndClean().then(() => {
          onScanRef.current(result);
        });
      }
    } catch {
      setError('Could not read barcode from image. Try entering the number manually.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const scanTips = [
    'Hold steady and keep barcode in frame',
    'Try moving closer to the barcode',
    'Make sure barcode is well lit',
    'Flatten the package if folded',
    'Try tilting the product slightly',
  ];

  const currentTip = scanTips[Math.floor(scanAttempts / 3) % scanTips.length];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="font-medium text-sm">Scan Barcode</span>
        </div>
        <button
          onClick={() => { stopAndClean(); onClose(); }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
        {starting && !error && (
          <div className="flex flex-col items-center gap-3 text-white mb-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Starting camera...</p>
          </div>
        )}

        {error && !showManualEntry ? (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 text-center max-w-sm">
            <p className="text-red-200 text-sm">{error}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowManualEntry(true)}
                className="flex-1 px-3 py-2 bg-white/20 text-white rounded-lg text-sm active:bg-white/30 flex items-center justify-center gap-1.5"
              >
                <Keyboard className="h-4 w-4" />
                Enter Manually
              </button>
              <button
                onClick={() => { stopAndClean(); onClose(); }}
                className="px-4 py-2 bg-white/10 text-white/70 rounded-lg text-sm active:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        ) : showManualEntry ? (
          <div className="w-full max-w-sm bg-white/10 rounded-xl p-5 backdrop-blur">
            <p className="text-white font-medium text-sm mb-3">Enter Barcode Number</p>
            <p className="text-white/60 text-xs mb-4">Type the numbers below the barcode lines on the product</p>
            <input
              type="number"
              inputMode="numeric"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="e.g. 0123456789012"
              className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 text-lg font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleManualSubmit}
                disabled={manualBarcode.trim().length < 8}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 active:bg-green-700"
              >
                Look Up Product
              </button>
              <button
                onClick={() => setShowManualEntry(false)}
                className="px-4 py-2.5 bg-white/10 text-white rounded-lg text-sm active:bg-white/20"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <div className="relative">
              <div
                id="barcode-reader"
                style={{ width: '100%', minHeight: '300px' }}
              />
              {!starting && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-32">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                    <div
                      className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-80"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div id="barcode-file-reader" style={{ display: 'none' }} />
            {!starting && (
              <>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  </div>
                  <p className="text-green-300 text-xs font-medium">Scanning...</p>
                </div>

                <p className="text-white/50 text-[11px] text-center mt-2 transition-all duration-500">
                  {currentTip}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/15 text-white rounded-lg text-xs active:bg-white/25"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    Type Barcode
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/15 text-white rounded-lg text-xs active:bg-white/25"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Scan Photo
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileScan}
                  className="hidden"
                />
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
};
