import { useState } from 'react';
import { Copy, Download, Check, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MFAInput } from './MFAInput';
import { Button } from './Button';

export interface MFASetupProps {
  qrCodeUrl?: string;
  secretKey?: string;
  recoveryCodes?: string[];
  onVerify?: (code: string) => Promise<boolean>;
  onComplete?: () => void;
  className?: string;
}

export function MFASetup({
  qrCodeUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMTAwIiB5PSIxMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMTEwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMjAiIHk9IjExMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTYwIDEwaDMwaTEwdjIwaS00MHoiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNMTAgNjBoMjB2MTBIMTB6TTYwIDYwaDIwdjEwSDYweiIgZmlsbD0iIzAwMCIvPjxwYXRoIGQ9Ik00MCA4MGgxMHYyMEg0MHoiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNMTAwIDYwaDQwdjQwSDEwMHpNMTExIDcwaDIwdjIwSDExMXoiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNNjAgMTAwaDMwdjEwSDYwek05MCAxMjBoMjB2MTBINTB6IiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTEzMCAxMTBoMTB2MTBoLTEweiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==',
  secretKey = 'JBSWY3DPEHPK3PXP',
  recoveryCodes = [
    'A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2', 'M3N4-O5P6',
    'Q7R8-S9T0', 'U1V2-W3X4', 'Y5Z6-A7B8', 'C9D0-E1F2'
  ],
  onVerify,
  onComplete,
  className
}: MFASetupProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    const text = `Recovery Codes for Your Account\\n\\nSave these codes in a secure place. They can be used to access your account if you lose your authenticator device.\\n\\n${recoveryCodes.join('\\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerify = async (code: string) => {
    if (!onVerify) {
      setStep(3);
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const isValid = await onVerify(code);
      if (isValid) {
        setStep(3);
      } else {
        setError('Invalid verification code.');
      }
    } catch (e) {
      setError('Failed to verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={twMerge('w-full max-w-lg mx-auto bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden', className)}>
      {/* Setup Step 1 & 2: QR Code & Verification */}
      {step < 3 && (
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[var(--color-text-primary)] mb-1">Set up Two-Factor Authentication</h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Enhance your account security by enabling 2FA via an authenticator app.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Step 1: Scan */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] rounded-full flex items-center justify-center text-[12px] font-semibold">1</div>
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">Scan the QR code</h3>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mb-4">Use Google Authenticator, Authy, or similar.</p>
                  
                  <div className="bg-white border border-[var(--color-border-default)] rounded-lg p-2 inline-block">
                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 object-contain" />
                  </div>
                  
                  <div className="mt-4 space-y-1.5">
                    <p className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Or enter manually</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[13px] bg-[var(--color-surface-secondary)] px-2 py-1 rounded font-mono tracking-wide flex-1 text-center border border-[var(--color-border-subtle)]">
                        {secretKey}
                      </code>
                      <button 
                        onClick={handleCopyKey}
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] rounded transition-colors"
                        title="Copy key"
                      >
                        {copiedKey ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Verify */}
            <div>
              <div className="flex gap-3 mb-4">
                 <div className="w-6 h-6 shrink-0 bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] rounded-full flex items-center justify-center text-[12px] font-semibold">2</div>
                 <div>
                  <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">Verify code</h3>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">Enter the code generated by your app.</p>
                 </div>
              </div>
              
              <MFAInput 
                className="border-none p-0 max-w-none shadow-none" 
                title="" 
                description="" 
                isLoading={isLoading} 
                error={error} 
                onComplete={handleVerify} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Recovery Codes */}
      {step === 3 && (
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-[14px] font-semibold text-amber-900 mb-1">Save your recovery codes</h3>
              <p className="text-[12px] leading-relaxed opacity-90">
                These codes are the ONLY way to access your account if you lose your device. We will not show them to you again.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface-secondary)]/50 border border-[var(--color-border-default)] rounded-xl p-5 mb-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[13px] tracking-widest text-center text-[var(--color-text-primary)]">
              {recoveryCodes.map(code => (
                <div key={code} className="bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] py-1.5 rounded shadow-sm">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              leftIcon={copiedCodes ? <Check className="text-emerald-600" /> : <Copy />}
              onClick={handleCopyCodes}
            >
              {copiedCodes ? 'Copied!' : 'Copy codes'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              leftIcon={<Download />}
              onClick={handleDownloadCodes}
            >
              Download .txt
            </Button>
            <Button 
              className="flex-1 sm:ml-auto" 
              onClick={() => onComplete?.()}
            >
              I have saved them
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
