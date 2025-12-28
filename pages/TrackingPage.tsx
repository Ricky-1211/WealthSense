import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { BankAccount, Document, Receipt, PaymentMethod, Transaction } from '../types';
import { 
  Lock, Unlock, CreditCard, Wallet, Building2, FileText, Upload, Download, 
  Camera, Trash2, Plus, Eye, EyeOff, Shield, FileSpreadsheet, Receipt as ReceiptIcon,
  CreditCard as CardIcon, Banknote, QrCode, KeyRound
} from 'lucide-react';
import { downloadCSV, readFileAsText, parseCSV, convertCSVToTransactions } from '../services/csvUtils';
import { processReceiptImage, imageToBase64 } from '../services/ocrUtils';
import { decrypt, getEncryptionKey } from '../services/encryption';
import { auth } from '../services/firebase';

const TrackingPage: React.FC = () => {
  const { 
    tracking, 
    transactions,
    addTransaction,
    addBankAccount, 
    deleteBankAccount,
    addDocument, 
    deleteDocument,
    addPaymentMethod,
    deletePaymentMethod,
    addReceipt,
    deleteReceipt,
    setupLock,
    verifyLockPin,
    updateLockSettings
  } = useAppContext();

  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'bank' | 'documents' | 'payment' | 'receipts' | 'import'>('overview');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  // Check lock status on mount
  useEffect(() => {
    if (tracking?.lockSettings?.enabled && !tracking?.lockSettings?.lastUnlock) {
      setIsLocked(true);
    } else if (tracking?.lockSettings?.enabled) {
      // Check if last unlock was more than 5 minutes ago
      const lastUnlock = new Date(tracking.lockSettings.lastUnlock);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUnlock.getTime()) / (1000 * 60);
      if (diffMinutes > 5) {
        setIsLocked(true);
      }
    }
  }, [tracking]);

  // Cash vs Card tracking
  const paymentStats = useMemo(() => {
    const stats = {
      cash: 0,
      card: 0,
      upi: 0,
      bank: 0
    };

    transactions.forEach(t => {
      // This would ideally come from transaction metadata
      // For now, we'll use a simple heuristic
      if (t.amount < 100) stats.cash += t.amount;
      else if (t.amount < 1000) stats.card += t.amount;
      else stats.bank += t.amount;
    });

    return stats;
  }, [transactions]);

  const handleUnlock = async () => {
    if (pinInput.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    const isValid = await verifyLockPin(pinInput);
    if (isValid) {
      setIsLocked(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Invalid PIN');
      setPinInput('');
    }
  };

  const handleSetupPin = async () => {
    if (newPin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    try {
      await setupLock(newPin);
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
      setPinError('');
      alert('PIN set successfully!');
    } catch (error) {
      setPinError('Failed to set PIN');
    }
  };

  const handleToggleLock = async (enabled: boolean) => {
    if (enabled && !tracking?.lockSettings?.pinHash) {
      setShowPinSetup(true);
      return;
    }
    await updateLockSettings(enabled);
  };

  const handleResetPin = async () => {
    if (pinInput.length !== 4) {
      setPinError('Enter current PIN');
      return;
    }

    const isValid = await verifyLockPin(pinInput);
    if (!isValid) {
      setPinError('Invalid current PIN');
      return;
    }

    setShowPinSetup(true);
    setPinInput('');
  };

  // Bank Account Management
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    accountType: 'savings' as 'savings' | 'current' | 'salary',
    balance: ''
  });

  const handleAddBankAccount = async () => {
    await addBankAccount({
      ...bankForm,
      balance: bankForm.balance ? parseFloat(bankForm.balance) : undefined
    });
    setBankForm({
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      accountType: 'savings',
      balance: ''
    });
  };

  // Document Management
  const [docForm, setDocForm] = useState({
    type: 'aadhaar' as 'aadhaar' | 'pan' | 'upi',
    number: '',
    name: '',
    upiId: ''
  });

  const handleAddDocument = async () => {
    await addDocument(docForm);
    setDocForm({ type: 'aadhaar', number: '', name: '', upiId: '' });
  };

  // Payment Method Management
  const [paymentForm, setPaymentForm] = useState({
    type: 'card' as 'cash' | 'card' | 'upi' | 'bank_transfer',
    name: '',
    last4Digits: '',
    bankName: ''
  });

  const handleAddPaymentMethod = async () => {
    await addPaymentMethod(paymentForm);
    setPaymentForm({ type: 'card', name: '', last4Digits: '', bankName: '' });
  };

  // Receipt Management
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageBase64 = await imageToBase64(file);
      const receiptData = await processReceiptImage(file);

      await addReceipt({
        imageUrl: imageBase64,
        ocrText: receiptData.text,
        amount: receiptData.amount || undefined,
        merchant: receiptData.merchant || undefined,
        date: receiptData.date || undefined
      });

      alert('Receipt uploaded and processed!');
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Failed to process receipt');
    }
  };

  // CSV Import/Export
  const handleExportCSV = () => {
    downloadCSV(transactions, 'transactions.csv');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await readFileAsText(file);
      const csvTransactions = parseCSV(csvText);
      const transactions = convertCSVToTransactions(csvTransactions);

      for (const transaction of transactions) {
        await addTransaction(transaction);
      }

      alert(`Imported ${transactions.length} transactions successfully!`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV');
    }
  };

  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const decryptValue = (encrypted: string): string => {
    try {
      const user = auth.currentUser;
      if (!user) return '***';
      const key = getEncryptionKey(user.uid);
      return decrypt(encrypted, key);
    } catch {
      return '***';
    }
  };

  // Lock Screen
  if (isLocked && tracking?.lockSettings?.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Locked</h2>
            <p className="text-slate-500">Enter your 4-digit PIN to access</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center space-x-2 mb-6">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  value={pinInput[i] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length > 1) return;
                    const newPin = pinInput.split('');
                    newPin[i] = value;
                    const updatedPin = newPin.join('').slice(0, 4);
                    setPinInput(updatedPin);
                    if (value && i < 3) {
                      setTimeout(() => {
                        const nextInput = document.querySelector(`input[data-pin-index="${i + 1}"]`) as HTMLInputElement;
                        nextInput?.focus();
                      }, 10);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !pinInput[i] && i > 0) {
                      const prevInput = document.querySelector(`input[data-pin-index="${i - 1}"]`) as HTMLInputElement;
                      prevInput?.focus();
                    }
                  }}
                  data-pin-index={i}
                  className="w-16 h-16 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-rose-500 text-sm text-center">{pinError}</p>
            )}

            <button
              onClick={handleUnlock}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Unlock
            </button>

            <button
              onClick={handleResetPin}
              className="w-full py-2 text-slate-500 text-sm hover:text-slate-700"
            >
              Reset PIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PIN Setup Modal
  if (showPinSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Setup PIN</h2>
            <p className="text-slate-500">Create a 4-digit PIN to secure your data</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirm PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm 4-digit PIN"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {pinError && (
              <p className="text-rose-500 text-sm">{pinError}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleSetupPin}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
              >
                Set PIN
              </button>
              <button
                onClick={() => {
                  setShowPinSetup(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinError('');
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Financial Tracking</h1>
          <p className="text-slate-500 mt-1">Manage your accounts, documents, and receipts securely.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleToggleLock(!tracking?.lockSettings?.enabled)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all ${
              tracking?.lockSettings?.enabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tracking?.lockSettings?.enabled ? <Lock size={18} /> : <Unlock size={18} />}
            <span>{tracking?.lockSettings?.enabled ? 'Lock Enabled' : 'Lock Disabled'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: <Shield size={18} /> },
          { id: 'bank', label: 'Bank Accounts', icon: <Building2 size={18} /> },
          { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
          { id: 'payment', label: 'Payment Methods', icon: <CreditCard size={18} /> },
          { id: 'receipts', label: 'Receipts', icon: <ReceiptIcon size={18} /> },
          { id: 'import', label: 'Import/Export', icon: <FileSpreadsheet size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Banknote size={24} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase">Cash</span>
            </div>
            <p className="text-3xl font-black text-blue-900">${paymentStats.cash.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CardIcon size={24} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase">Card</span>
            </div>
            <p className="text-3xl font-black text-purple-900">${paymentStats.card.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <QrCode size={24} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase">UPI</span>
            </div>
            <p className="text-3xl font-black text-emerald-900">${paymentStats.upi.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 size={24} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase">Bank</span>
            </div>
            <p className="text-3xl font-black text-amber-900">${paymentStats.bank.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Bank Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Bank Name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="text"
                placeholder="Account Holder Name"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <select
                value={bankForm.accountType}
                onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as any })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="salary">Salary</option>
              </select>
              <input
                type="number"
                placeholder="Balance (Optional)"
                value={bankForm.balance}
                onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              onClick={handleAddBankAccount}
              className="mt-4 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Add Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracking?.bankAccounts?.map(account => (
              <div key={account.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">{account.bankName}</h4>
                  <button
                    onClick={() => deleteBankAccount(account.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="font-bold text-slate-800">
                      {showDetails[account.id] ? decryptValue(account.accountNumber) : '****'}
                      <button
                        onClick={() => toggleDetails(account.id)}
                        className="ml-2 text-emerald-500"
                      >
                        {showDetails[account.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC:</span>
                    <span className="font-bold text-slate-800">
                      {showDetails[account.id] ? decryptValue(account.ifscCode) : '****'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-bold text-slate-800 capitalize">{account.accountType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Document</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={docForm.type}
                onChange={(e) => setDocForm({ ...docForm, type: e.target.value as any })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="upi">UPI ID</option>
              </select>
              <input
                type="text"
                placeholder={docForm.type === 'upi' ? 'UPI ID' : 'Number'}
                value={docForm.type === 'upi' ? docForm.upiId : docForm.number}
                onChange={(e) => {
                  if (docForm.type === 'upi') {
                    setDocForm({ ...docForm, upiId: e.target.value });
                  } else {
                    setDocForm({ ...docForm, number: e.target.value });
                  }
                }}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {docForm.type !== 'upi' && (
                <input
                  type="text"
                  placeholder="Name"
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              )}
            </div>
            <button
              onClick={handleAddDocument}
              className="mt-4 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Add Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracking?.documents?.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 capitalize">{doc.type}</h4>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Number:</span>
                    <span className="font-bold text-slate-800">
                      {showDetails[doc.id] ? decryptValue(doc.number) : '****'}
                      <button
                        onClick={() => toggleDetails(doc.id)}
                        className="ml-2 text-emerald-500"
                      >
                        {showDetails[doc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </span>
                  </div>
                  {doc.name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-800">{doc.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={paymentForm.type}
                onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              <input
                type="text"
                placeholder="Name/Description"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {paymentForm.type === 'card' && (
                <input
                  type="text"
                  placeholder="Last 4 Digits"
                  maxLength={4}
                  value={paymentForm.last4Digits}
                  onChange={(e) => setPaymentForm({ ...paymentForm, last4Digits: e.target.value.replace(/\D/g, '') })}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              )}
              {paymentForm.type === 'bank_transfer' && (
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={paymentForm.bankName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              )}
            </div>
            <button
              onClick={handleAddPaymentMethod}
              className="mt-4 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Add Payment Method
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracking?.paymentMethods?.map(method => (
              <div key={method.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {method.type === 'cash' && <Banknote size={20} className="text-emerald-500" />}
                    {method.type === 'card' && <CardIcon size={20} className="text-blue-500" />}
                    {method.type === 'upi' && <QrCode size={20} className="text-purple-500" />}
                    {method.type === 'bank_transfer' && <Building2 size={20} className="text-amber-500" />}
                    <h4 className="font-bold text-slate-800">{method.name}</h4>
                  </div>
                  <button
                    onClick={() => deletePaymentMethod(method.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-bold text-slate-800 capitalize">{method.type.replace('_', ' ')}</span>
                  </div>
                  {method.last4Digits && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last 4 Digits:</span>
                      <span className="font-bold text-slate-800">****{method.last4Digits}</span>
                    </div>
                  )}
                  {method.bankName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-bold text-slate-800">{method.bankName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipts Tab */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Receipt</h3>
            <label className="flex items-center justify-center space-x-2 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
              <Camera size={24} className="text-slate-400" />
              <span className="font-bold text-slate-600">Click to scan receipt</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracking?.receipts?.map(receipt => (
              <div key={receipt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <img
                  src={receipt.imageUrl}
                  alt="Receipt"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800">
                      {receipt.merchant || 'Receipt'}
                    </h4>
                    <button
                      onClick={() => deleteReceipt(receipt.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {receipt.amount && (
                    <p className="text-lg font-black text-emerald-600">${receipt.amount.toFixed(2)}</p>
                  )}
                  {receipt.date && (
                    <p className="text-xs text-slate-500 mt-1">{new Date(receipt.date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Export Data</h3>
              <p className="text-slate-500 text-sm mb-4">Export your transactions to CSV format</p>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
              >
                <Download size={20} />
                <span>Export to CSV</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Import Data</h3>
              <p className="text-slate-500 text-sm mb-4">Import transactions from CSV/Excel file</p>
              <label className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all cursor-pointer">
                <Upload size={20} />
                <span>Import from CSV</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;

