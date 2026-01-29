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
import { Loader2, Banknote, AlertCircle, CheckCircle, History, ShieldCheck, XCircle, AlertTriangle, Trash2 } from "lucide-react";
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
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    
    // Fetch Store Details
    const { data: store, isLoading: isStoreLoading } = useQuery({
        queryKey: ["vendorStore"],
        queryFn: getVendorStore,
    });

    // Fetch Payout Status
    const { data: payoutStatus, isLoading: isStatusLoading } = useQuery({
        queryKey: ["payoutStatus", store?._id],
        queryFn: () => payoutService.getPayoutStatus(store._id),
        enabled: !!store?._id,
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

    // Sync Form with Status/Store Data
    useEffect(() => {
        if (payoutStatus?.data) {
            // Prefer live Paystack details if available
            const { account_number, paystack_details } = payoutStatus.data;
            if (account_number) setAccountNumber(account_number);
            
            // For bank code, we rely on our stored settlement_bank if available, 
            // as Paystack details might return bank name or different format.
            if (store?.settlement_bank) setSelectedBank(store.settlement_bank);
        } else if (store) {
            if (store.account_number) setAccountNumber(store.account_number);
            if (store.settlement_bank) setSelectedBank(store.settlement_bank);
        }
    }, [payoutStatus, store]);

    const saveSettingsMutation = useMutation({
        mutationFn: async (data: any) => {
            return await payoutService.savePayoutSettings(store?._id, data);
        },
        onSuccess: (data: any) => {
            toast.success(data.message || "Payout settings saved");
            queryClient.invalidateQueries({ queryKey: ["vendorStore"] });
            queryClient.invalidateQueries({ queryKey: ["payoutStatus"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to setup payouts");
        }
    });

    const verifyMutation = useMutation({
        mutationFn: async () => {
             return await payoutService.requestVerification(store?._id);
        },
        onSuccess: () => {
             toast.success("Verification request sent! Check your email.");
             queryClient.invalidateQueries({ queryKey: ["payoutStatus"] });
        },
        onError: (error: any) => {
             toast.error(error.response?.data?.message || "Failed to request verification");
        }
    });

    const deactivateMutation = useMutation({
        mutationFn: async () => {
             return await payoutService.deactivateSubaccount(store?._id);
        },
        onSuccess: () => {
             toast.success("Payout account deactivated.");
             queryClient.invalidateQueries({ queryKey: ["vendorStore"] });
             queryClient.invalidateQueries({ queryKey: ["payoutStatus"] });
             setAccountNumber("");
             setSelectedBank("");
             setShowDeactivateConfirm(false);
        },
        onError: (error: any) => {
             toast.error(error.response?.data?.message || "Failed to deactivate");
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

    if (isStoreLoading || isUserLoading || isStatusLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#3bb85e]" /></div>;
    }

    if (!store) {
        return <div className="p-10 text-center">You do not have a store yet.</div>;
    }

    const statusData = payoutStatus?.data || {};
    const hasSubaccount = statusData.has_subaccount;
    const isPayoutReady = statusData.payout_ready;
    const isVerificationRequested = statusData.verification_requested;
    const paystackDetails = statusData.paystack_details; // Live details

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
                {hasSubaccount ? (
                    isPayoutReady ? (
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 animate-in fade-in zoom-in duration-500">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="font-bold text-sm uppercase tracking-wider">Verified & Active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-100">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-bold text-sm uppercase tracking-wider">Verification Pending</span>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full border border-gray-200">
                        <XCircle className="w-5 h-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">No Payout Account</span>
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
                        { label: "Paystack Subaccount", status: hasSubaccount, link: null }
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
                        <CardDescription>
                            {hasSubaccount 
                                ? "Update your settlement account details." 
                                : "Setup your Paystack Subaccount for real-time settlements."}
                        </CardDescription>
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
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {hasSubaccount ? "Updating Details..." : "Creating Account..."}</>
                            ) : (
                                hasSubaccount ? "Update Bank Details" : "Create Payout Account"
                            )}
                        </Button>

                        {!user?.phone || !user?.matric_number ? (
                            <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-widest">
                                ⚠️ Profile must be complete to activate seller account
                            </p>
                        ) : null}

                        {hasSubaccount && (
                             <div className={`p-5 rounded-2xl border flex items-start gap-3 mt-4 animate-in slide-in-from-bottom-2 duration-500
                                ${isPayoutReady ? "bg-[#3bb85e]/5 text-[#3bb85e] border-[#3bb85e]/10" : "bg-amber-50 text-amber-700 border-amber-100"}
                             `}>
                                {isPayoutReady ? <CheckCircle className="w-6 h-6 shrink-0" /> : <AlertTriangle className="w-6 h-6 shrink-0" />}
                                <div className="space-y-2 w-full">
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tight">
                                            {isPayoutReady ? "Active Subaccount" : "Verification Required"}
                                        </p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <p className="text-xs font-bold opacity-80">
                                                {selectedBank ? banks.find(b => b.code === selectedBank)?.name : "Bank"} • ****{accountNumber.slice(-4)}
                                            </p>
                                            {paystackDetails?.business_name && (
                                                <p className="text-[10px] font-mono opacity-70 bg-black/5 w-fit px-1 rounded">
                                                    {paystackDetails.business_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {!isPayoutReady && (
                                        <div className="mt-3 bg-white/50 p-3 rounded-lg border border-amber-200/50">
                                            <p className="text-xs font-medium mb-3">
                                                To ensure platform safety, your products are <strong>hidden</strong> until this account is verified by our admins.
                                            </p>
                                            {isVerificationRequested ? (
                                                <Button disabled variant="secondary" size="sm" className="w-full text-xs font-bold h-8">
                                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Verification Status: Review in Progress
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={() => verifyMutation.mutate()} 
                                                    disabled={verifyMutation.isPending}
                                                    size="sm" 
                                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8"
                                                >
                                                    {verifyMutation.isPending ? "Requesting..." : "Request Account Verification"}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                    </CardContent>

                    {/* Delete Zone */}
                    {hasSubaccount && (
                        <div className="bg-red-50/50 border-t border-red-100 p-4">
                            {!showDeactivateConfirm ? (
                                <div className="flex justify-between w-full items-center">
                                     <div className="text-xs text-red-600 font-medium">
                                        No longer using this account?
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setShowDeactivateConfirm(true)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-100 font-bold text-xs uppercase"
                                    >
                                        <Trash2 className="w-3 h-3 mr-2" /> Deactivate
                                    </Button>
                                </div>
                            ) : (
                                 <div className="flex flex-col sm:flex-row justify-between w-full items-center gap-3 animate-in fade-in slide-in-from-right-5">
                                     <div className="text-xs text-red-600 font-bold">
                                        Are you sure? This will disable payouts and hide products.
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setShowDeactivateConfirm(false)}
                                            className="text-gray-500 text-xs"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => deactivateMutation.mutate()}
                                            disabled={deactivateMutation.isPending}
                                            className="text-xs font-bold"
                                        >
                                            {deactivateMutation.isPending ? "Deactivating..." : "Confirm Deactivate"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                                <strong>Strict Verification</strong><br/>
                                Vendors must have a verified Paystack subaccount to list products. This ensures safety for all buyers.
                            </p>
                            <p className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                                <strong>Direct Payouts</strong><br/>
                                Funds are routed directly to your subaccount. Platform fees are deducted automatically.
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
