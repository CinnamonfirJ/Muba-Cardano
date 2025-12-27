"use client";

import { useState, useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface Variant {
  name?: string;
  price?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  attributes?: Record<string, string>;
}

interface VariantSelectorProps {
  variantType: string;
  variants: Variant[];
  onVariantSelect: (variant: Variant | null) => void;
}

export default function VariantSelector({ variantType, variants, onVariantSelect }: VariantSelectorProps) {
    // 1. Get all unique attribute keys (e.g. ["color", "size"])
    // We sort them so that "color" usually comes before "size" or alphabetical if unknown
    const attributeKeys = useMemo(() => {
        if (!variants || variants.length === 0) return [];
        const keys = new Set<string>();
        variants.forEach(v => {
            if (v.attributes) {
                Object.keys(v.attributes).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys).sort((a, b) => {
            const priority: Record<string, number> = { color: 1, size: 2 };
            const aP = priority[a.toLowerCase()] || 99;
            const bP = priority[b.toLowerCase()] || 99;
            return aP - bP || a.localeCompare(b);
        });
    }, [variants]);

    // 2. Selected state
    const [selected, setSelected] = useState<Record<string, string>>({});

    // Initialize selection if there is only one option for any attribute
    useEffect(() => {
        const newSelected = { ...selected };
        let changed = false;
        attributeKeys.forEach(key => {
            if (!newSelected[key]) {
                const values = Array.from(new Set(variants.map(v => v.attributes?.[key]).filter(Boolean)));
                if (values.length === 1) {
                    newSelected[key] = values[0] as string;
                    changed = true;
                }
            }
        });
        if (changed) setSelected(newSelected);
    }, [variants, attributeKeys]);

    // 3. Find matched variant
    const matchedVariant = useMemo(() => {
        // Only consider it a match if ALL attribute keys are selected
        if (Object.keys(selected).length !== attributeKeys.length) return null;
        
        return variants.find(v => {
            return attributeKeys.every(k => v.attributes?.[k] === selected[k]);
        }) || null;
    }, [selected, variants, attributeKeys]);

    // Notify parent
    useEffect(() => {
        onVariantSelect(matchedVariant);
    }, [matchedVariant]);

    // 4. Helper to check if an option is valid given current other selections
    const isOptionValid = (key: string, value: string) => {
        return variants.some(v => {
            if (v.attributes?.[key] !== value) return false;
            // Check if this variant matches all OTHER currently selected attributes
            return attributeKeys.every(k => {
                if (k === key || !selected[k]) return true;
                return v.attributes?.[k] === selected[k];
            });
        });
    };

    // 5. Helper to check if an option results in stock > 0
    const hasStock = (key: string, value: string) => {
        return variants.some(v => {
            if (v.attributes?.[key] !== value) return false;
            if ((v.stock || 0) <= 0) return false;
            // Check if this variant matches all OTHER currently selected attributes
            return attributeKeys.every(k => {
                if (k === key || !selected[k]) return true;
                return v.attributes?.[k] === selected[k];
            });
        });
    };

    if (variantType === "None" || variants.length === 0 || attributeKeys.length === 0) return null;

    return (
        <div className="space-y-6">
            {attributeKeys.map(key => {
                const values = Array.from(new Set(variants.map(v => v.attributes?.[key]).filter(Boolean))) as string[];
                
                return (
                    <div key={key} className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                            Select {key}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {values.map(val => {
                                const isSelected = selected[key] === val;
                                const isValid = isOptionValid(key, val);
                                const stocked = hasStock(key, val);

                                return (
                                    <button
                                        key={val}
                                        onClick={() => {
                                            setSelected(prev => ({
                                                ...prev,
                                                [key]: val
                                            }));
                                        }}
                                        disabled={!isValid}
                                        className={`px-4 py-2 text-xs border transition-all duration-200 min-w-[3.5rem] relative ${
                                            isSelected
                                            ? "bg-black text-white border-black"
                                            : !isValid
                                            ? "bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed"
                                            : !stocked
                                            ? "bg-white text-gray-400 border-gray-200 border-dashed hover:border-black"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-black"
                                        }`}
                                    >
                                        <span className={!stocked && !isSelected ? "opacity-50" : ""}>
                                            {val}
                                        </span>
                                        {!stocked && isValid && (
                                            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                                                <div className="absolute top-1/2 left-1/2 w-[140%] h-[1px] bg-gray-300 -translate-x-1/2 -translate-y-1/2 rotate-45" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            
            {/* Clear Selection */}
            {Object.keys(selected).length > 0 && (
                <button 
                    onClick={() => setSelected({})}
                    className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                    Clear Selection
                </button>
            )}
        </div>
    );
}
