import React, { useState } from 'react';
import { Copy, Check, Info, Smartphone } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const AMOUNTS = [100, 500, 1000, 2500];
const MOBILE_BANKING_NUMBER = "01915648432"; // Same number for both bKash & Nagad

export default function Donate() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    purpose: '',
    transactionId: '',
    method: 'bKash' as 'bKash' | 'Nagad',
    note: ''
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(MOBILE_BANKING_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
    if (step === 1 && amount === '') return;
    setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !formData.name || !formData.phone || !formData.transactionId) return;
    
    setIsSubmitting(true);
    try {
      const newDonation = {
        ...formData,
        method: method,
        id: 'don-' + Date.now(),
        amount: Number(amount),
        status: 'Pending' as const,
        adminNotes: '',
        createdAt: Date.now()
      };

      try {
        const docRef = await addDoc(collection(db, 'donations'), {
          ...formData,
          method: method,
          amount: Number(amount),
          status: 'Pending',
          adminNotes: '',
          createdAt: Date.now()
        });
        newDonation.id = docRef.id;
      } catch (err) {
        console.warn("Firestore donation submission skipped, cached locally:", err);
      }

      try {
        const existing = JSON.parse(localStorage.getItem('hea_cached_donations') || '[]');
        localStorage.setItem('hea_cached_donations', JSON.stringify([newDonation, ...existing]));
      } catch (e) {}

      setStep(4);
    } catch (error) {
      console.error("Error submitting donation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-[#130722] dark:to-zinc-950 flex items-center justify-center px-4 transition-colors">
      <div className="max-w-xl w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 dark:border-purple-900/40 overflow-hidden">
        
        <div className="bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <h1 className="text-3xl font-serif font-semibold mb-2 relative z-10">Be Part of Something Bigger</h1>
          <p className="text-purple-100 text-sm relative z-10">Your contribution helps us create sustainable change on the ground.</p>
        </div>

        <div className="p-8">
          {/* Step 1: Amount Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-6 text-center">Select Donation Amount</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt)}
                    className={`py-4 rounded-xl border-2 text-lg font-medium transition-all cursor-pointer ${
                      amount === amt 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold shadow-sm shadow-purple-600/10' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    ৳{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Custom Amount (৳)</label>
                <input
                  type="number"
                  min="10"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || '')}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  placeholder="Enter amount"
                />
              </div>
              <button
                onClick={handleNextStep}
                disabled={!amount}
                className="w-full py-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 disabled:opacity-50 text-white rounded-xl font-medium shadow-md shadow-purple-600/25 transition-all cursor-pointer"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment Method (bKash & Nagad) */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-2 text-center">Select Payment Channel</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-6">Choose either bKash or Nagad to send your contribution.</p>
              
              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('bKash');
                    setFormData(prev => ({ ...prev, method: 'bKash' }));
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-semibold transition-all cursor-pointer ${
                    method === 'bKash'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 shadow-sm shadow-pink-500/20 scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-pink-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-pink-500 inline-block" />
                  <span className="text-base font-bold">bKash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod('Nagad');
                    setFormData(prev => ({ ...prev, method: 'Nagad' }));
                  }}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-semibold transition-all cursor-pointer ${
                    method === 'Nagad'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/20 scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-base font-bold">Nagad</span>
                </button>
              </div>

              <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl p-6 mb-6 text-center border border-purple-200 dark:border-purple-900/40">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1">
                  <Smartphone size={14} />
                  <span>{method} Mobile Banking</span>
                </div>
                
                <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-1">Contribution Amount</p>
                <div className="text-3xl font-serif font-bold text-purple-700 dark:text-purple-300 mb-3">
                  ৳{Number(amount).toLocaleString()}
                </div>
                
                <hr className="border-purple-200 dark:border-purple-800/40 mb-3" />
                
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">
                  Send ৳{Number(amount).toLocaleString()} via <strong>{method}</strong> (Send Money / Payment) to our official foundation number:
                </p>
                
                <div className="flex items-center justify-between bg-white dark:bg-zinc-950 px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{method} Personal / Merchant</div>
                    <span className="font-mono text-xl text-zinc-900 dark:text-zinc-50 font-bold tracking-wider">{MOBILE_BANKING_NUMBER}</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    <span className="text-xs font-semibold">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 p-4 rounded-xl text-xs mb-8 border border-purple-200/60 dark:border-purple-800/40">
                <Info size={18} className="shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <p>After completing the transfer in your {method} app, copy the <strong>Transaction ID (TrxID)</strong> for confirmation.</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="w-2/3 py-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-xl font-medium transition-colors shadow-md shadow-purple-600/25 cursor-pointer text-sm"
                >
                  I Have Sent via {method}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation Form */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-1 text-center">Confirm Your Donation</h2>
              <div className="flex justify-center mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  method === 'bKash' 
                    ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${method === 'bKash' ? 'bg-pink-500' : 'bg-amber-500'}`} />
                  <span>Paid via {method}</span>
                </span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs text-center mb-6">Please provide your details so we can verify your transaction.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">{method} Transaction ID (TrxID) *</label>
                  <input
                    required
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                    placeholder={`e.g. ${method === 'bKash' ? '8JL9XABC123' : 'NGD9834192'}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none font-mono uppercase text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
                  />
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-medium transition-colors cursor-pointer text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-md shadow-purple-600/25 flex justify-center items-center cursor-pointer text-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Confirmation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center animate-in fade-in zoom-in duration-500 py-8">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h2 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">Thank You!</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed max-w-md mx-auto text-sm">
                Your donation confirmation has been received and is currently pending verification by our team. We deeply appreciate your generous support.
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  setAmount('');
                  setFormData({name: '', email: '', phone: '', purpose: '', transactionId: '', method: 'bKash', note: ''});
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-full font-medium transition-all shadow-md shadow-purple-600/25 cursor-pointer text-sm"
              >
                Make Another Donation
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

