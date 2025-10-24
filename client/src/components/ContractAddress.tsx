import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, FileText, Shield } from "lucide-react";
import { useState } from "react";

export default function ContractAddress() {
  const [copied, setCopied] = useState(false);
  const contractAddress = "0x1234567890abcdef1234567890abcdef12345678";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="p-8 border-4 border-primary shadow-lg rounded-2xl">
      <div className="space-y-6">
        <div className="flex items-start gap-4 pb-4 border-b-2 border-primary/30">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-foreground font-[Space_Grotesk]">
                Smart Contract Address
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Interact with CZ AI directly on the blockchain. This verified smart contract powers all AI interactions.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="p-5 rounded-xl bg-muted border-2 border-primary/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Contract Address</p>
                <code className="text-sm font-mono text-foreground break-all bg-card px-3 py-2 rounded-lg block font-medium border-2 border-primary/30">
                  {contractAddress}
                </code>
              </div>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="gap-2 hover-elevate border-2 border-primary rounded-lg px-3 py-2 font-semibold"
                data-testid="button-copy-address"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="p-4 rounded-xl bg-green-50 border-2 border-green-400">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-green-900 mb-1">Verified & Audited</h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  This smart contract has been verified on BNB Chain and audited for security.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/50">
            <p className="text-sm text-foreground leading-relaxed font-medium">
              <span className="font-semibold">Network:</span> BNB Smart Chain (BSC) • 
              <span className="font-semibold ml-2">Chain ID:</span> 56
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}