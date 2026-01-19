"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorStore } from "@/services/storeService";
import { authService } from "@/services/authService";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Loader2, Banknote, AlertCircle, CheckCircle, History, ShieldCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import payoutService from "@/services/payoutService";
import Link from "next/link";

export default function VendorPayoutsPage() {
    const queryClient = useQueryClient();
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    
    // Form State
    const [accountNumber, setAccountNumber] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    
    // Fetch Store Details
    const { data: store, isLoading: isStoreLoading } = useQuery({
        queryKey: ["vendorStore"],
        queryFn: getVendorStore,
    });

    // Fetch User Profile for Gating Checklist
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ["userProfile"],
        queryFn: () => authService.getUserProfile(),
    });

    useEffect(() => {
        const fetchBanks = async () => {
            setIsLoadingBanks(true);
            try {
                const banksList = await payoutService.getBanks();
                if (banksList) {
                    setBanks(banksList);
                }
            } catch (error) {
                console.error("Failed to fetch banks", error);
                toast.error("Could not load bank list");
            } finally {
                setIsLoadingBanks(false);
            }
        };
        fetchBanks();
    }, []);

    useEffect(() => {
        if (store) {
            if (store.account_number) setAccountNumber(store.account_number);
            if (store.settlement_bank) setSelectedBank(store.settlement_bank);
        }
    }, [store]);

    const saveSettingsMutation = useMutation({
        mutationFn: async (data: any) => {
            return await payoutService.savePayoutSettings(store?._id, data);
        },
        onSuccess: (data: any) => {
            toast.success(`Subaccount Created: ${data.data.subaccount_code}`);
            queryClient.invalidateQueries({ queryKey: ["vendorStore"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to setup payouts");
        }
    });

    const handleSave = () => {
        if (!store?._id) return toast.error("Store not found");
        if (accountNumber.length < 10) return toast.error("Invalid Account Number");
        if (!selectedBank) return toast.error("Select a Bank");

        if (!user?.phone || !user?.matric_number) {
            return toast.error("Complete your profile (Phone & Matric) first!");
        }

        const bankObj = banks.find(b => b.code === selectedBank);

        saveSettingsMutation.mutate({
            account_number: accountNumber,
            bank_code: selectedBank,
            bank_name: bankObj?.name
        });
    };

    if (isStoreLoading || isUserLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#3bb85e]" /></div>;
    }

    if (!store) {
        return <div className="p-10 text-center">You do not have a store yet.</div>;
    }

    const isPayoutReady = !!(store.paystack_subaccount_code && user?.phone && user?.matric_number);

    return (
        <div className="space-y-6 pb-20 p-4 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="font-bold text-3xl tracking-tight font-mona flex items-center gap-3">
                        <Banknote className="text-[#3bb85e] w-8 h-8" />
                        Payout Setup
                    </h1>
                    <p className="text-muted-foreground">
                        Configure your settlement account for automated split payments.
                    </p>
                </div>
                {isPayoutReady ? (
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 animate-in fade-in zoom-in duration-500">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Eligible to Sell</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full border border-red-100">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Not Eligible to Sell</span>
                    </div>
                )}
            </div>

            {/* Onboarding Checklist */}
            <Card className="border-none bg-gray-50/50 shadow-inner">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "Phone Number", status: !!user?.phone, link: "/dashboard/settings" },
                        { label: "Matric Number", status: !!user?.matric_number, link: "/dashboard/settings" },
                        { label: "Paystack Subaccount", status: !!store.paystack_subaccount_code, link: null }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${item.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {item.status ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-gray-500">{item.label}</p>
                                    <p className={`text-xs font-bold ${item.status ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.status ? 'Completed' : 'Pending'}
                                    </p>
                                </div>
                            </div>
                            {!item.status && item.link && (
                                <Link href={item.link}>
                                    <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-[#3bb85e] hover:bg-green-50">Fix</Button>
                                </Link>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Bank Details Form */}
                <Card className="md:col-span-7 border-gray-200 shadow-sm rounded-3xl overflow-hidden border-none bg-white">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle>Bank Details</CardTitle>
                        <CardDescription>Setup your Paystack Subaccount for real-time settlements.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Settlement Bank</Label>
                            <Select 
                                value={selectedBank} 
                                onValueChange={setSelectedBank} 
                                disabled={saveSettingsMutation.isPending}
                            >
                                <SelectTrigger className="rounded-xl border-gray-200 h-12 bg-gray-50/30">
                                    <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : "Select Bank"} />
                                </SelectTrigger>
                                <SelectContent className="h-[300px] rounded-xl">
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Account Number</Label>
                            <Input 
                                placeholder="0123456789" 
                                className="rounded-xl border-gray-200 h-12 bg-gray-50/30 font-bold"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                disabled={saveSettingsMutation.isPending}
                            />
                        </div>

                        <Button 
                            className="w-full bg-[#3bb85e] hover:bg-[#2fa04e] text-white rounded-xl h-12 font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                            onClick={handleSave}
                            disabled={saveSettingsMutation.isPending || !user?.phone || !user?.matric_number}
                        >
                            {saveSettingsMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Subaccount...</>
                            ) : (
                                "Connect & Activate Store"
                            )}
                        </Button>

                        {!user?.phone || !user?.matric_number ? (
                            <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest">
                                ⚠️ Profile must be complete to activate seller account
                            </p>
                        ) : null}

                        {store.paystack_subaccount_code && (
                             <div className="bg-[#3bb85e]/5 text-[#3bb85e] p-5 rounded-2xl border border-[#3bb85e]/10 flex items-start gap-3 mt-4 animate-in slide-in-from-bottom-2 duration-500">
                                <CheckCircle className="w-6 h-6 shrink-0" />
                                <div>
                                    <p className="font-black text-sm uppercase tracking-tight">Active Subaccount</p>
                                    <p className="text-xs font-bold opacity-80 mt-1">{store.bank_name} • ****{store.account_number?.slice(-4)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <code className="bg-white/60 px-2 py-0.5 rounded text-[10px] font-mono border border-[#3bb85e]/20">{store.paystack_subaccount_code}</code>
                                        <span className="text-[10px] font-black uppercase bg-[#3bb85e] text-white px-2 py-0.5 rounded">Verified</span>
                                    </div>
                                </div>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Information Card */}
                <div className="md:col-span-5 space-y-6">
                    <Card className="bg-[#3bb85e] text-white border-none rounded-3xl shadow-xl shadow-green-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Banknote className="w-32 h-32" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-mona">
                                <ShieldCheck className="w-6 h-6" />
                                Safe-Trade Settlements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm font-medium">
                            <p className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                <strong>Automatic Payouts</strong><br/>
                                Funds are automatically split and settled to your bank account via Paystack as soon as delivery is confirmed.
                            </p>
                            <p className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                <strong>Platform Fee (2.5%)</strong><br/>
                                A small platform fee is deducted from the subtotal to keep the marketplace safe and running.
                            </p>
                            <p className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10 text-xs opacity-90">
                                <strong>Escrow Policy:</strong> Funds are held by Paystack until the buyer confirms receipt of the item.
                            </p>
                        </CardContent>
                    </Card>

                     <Card className="rounded-3xl border-none shadow-sm bg-white/50 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Financial History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center text-gray-300 py-12 text-sm">
                                <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">No payouts detected yet.</p>
                                <p className="text-[10px] uppercase tracking-tighter mt-1">Start selling to see your earnings here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
